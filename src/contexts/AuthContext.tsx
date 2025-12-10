import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInWithCustomToken, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { auth as firebaseAuth } from '../utils/firebase';
import { SUBSCRIPTION_ENDPOINTS, AUTH_ENDPOINTS } from '../config/api';

interface User {
  uid: string;
  email: string;
  name: string;
  phone?: string;
  photoURL?: string;
  linkedStudents: Array<{
    studentId: string;
    studentName: string;
    studentEmail?: string;
  }>;
}

interface Subscription {
  isActive: boolean;
  status: 'active' | 'expired' | 'cancelled' | 'none';
  studentCount: number;
  linkedStudentsCount: number;
  totalAmount: number;
  pricePerStudent: number;
  requiredAmount: number;
  expiryDate?: string;
  daysRemaining?: number;
}

interface AuthContextType {
  user: User | null;
  authToken: string | null;
  subscription: Subscription | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasActiveSubscription: boolean;
  login: (token: string, refreshToken: string, userData: User, customToken?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  setSubscription: (sub: Subscription) => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
  AUTH_TOKEN: '@dru_auth_token',
  REFRESH_TOKEN: '@dru_refresh_token',
  USER_DATA: '@dru_user_data',
  TOKEN_EXPIRY: '@dru_token_expiry',
  CUSTOM_TOKEN: '@dru_custom_token',
};

// idToken expires in 1 hour - we'll refresh a bit before
const TOKEN_VALIDITY_DURATION = 55 * 60 * 1000; // 55 minutes

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseAuthenticated, setFirebaseAuthenticated] = useState(false);

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      console.log('Firebase auth state changed:', firebaseUser ? 'signed in' : 'signed out');
      setFirebaseAuthenticated(!!firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  // Load stored auth data on mount
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const refreshAuthToken = async (): Promise<string | null> => {
    try {
      const storedRefreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (!storedRefreshToken) {
        console.log('❌ No refresh token available');
        return null;
      }

      console.log('🔄 Refreshing access token...');
      const response = await fetch(AUTH_ENDPOINTS.refreshToken, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      });

      const data = await response.json();
      
      if (data.success && data.data) {
        const { idToken, refreshToken: newRefreshToken, expiresIn } = data.data;
        
        // Store new tokens
        const expiryTime = Date.now() + (parseInt(expiresIn, 10) * 1000) - 300000; // Subtract 5 mins buffer
        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, idToken),
          AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken),
          AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString()),
        ]);
        
        setAuthToken(idToken);
        console.log('✅ Token refreshed successfully');
        return idToken;
      } else {
        console.log('❌ Failed to refresh token:', data.message);
        return null;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  };

  const getValidToken = async (): Promise<string | null> => {
    const tokenExpiry = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
    const now = Date.now();
    const expiry = tokenExpiry ? parseInt(tokenExpiry, 10) : 0;
    
    // If token is expired or about to expire, refresh it
    if (!expiry || now > expiry) {
      console.log('🔄 Token expired, attempting refresh...');
      return await refreshAuthToken();
    }
    
    return authToken;
  };

  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedUser, storedRefreshToken, storedCustomToken] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER_DATA),
        AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_TOKEN),
      ]);

      if (storedToken && storedUser) {
        const userData = JSON.parse(storedUser);
        setAuthToken(storedToken);
        setUser(userData);
        
        // Try to get valid token (refresh if needed)
        const validToken = await getValidToken();
        
        if (validToken) {
          // Re-authenticate with Firebase if we have a custom token
          if (storedCustomToken && !firebaseAuth.currentUser) {
            try {
              console.log('🔥 Re-authenticating with Firebase...');
              await signInWithCustomToken(firebaseAuth, storedCustomToken);
              console.log('✅ Firebase re-authentication successful');
            } catch (firebaseError) {
              console.warn('⚠️ Firebase re-auth failed, chat features may not work:', firebaseError);
              // Don't logout - API auth is still valid, just chat won't work
            }
          }
          
          // Fetch subscription status with valid token
          await fetchSubscriptionStatus(validToken);
        } else if (storedRefreshToken) {
          // Try to refresh
          const newToken = await refreshAuthToken();
          if (newToken) {
            await fetchSubscriptionStatus(newToken);
          } else {
            // Can't refresh, need to login again
            await clearAuthData();
          }
        } else {
          // No refresh token, clear auth
          await clearAuthData();
        }
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearAuthData = async () => {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
      AsyncStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY),
      AsyncStorage.removeItem(STORAGE_KEYS.CUSTOM_TOKEN),
    ]);
    setUser(null);
    setAuthToken(null);
    setSubscription(null);
  };

  const fetchSubscriptionStatus = async (token: string, isRetry: boolean = false) => {
    try {
      console.log('🔍 Fetching subscription status...');
      const response = await fetch(SUBSCRIPTION_ENDPOINTS.status, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log('📦 Subscription status response:', data);
      
      // Handle unauthorized - try to refresh token
      if (response.status === 401 && !isRetry) {
        console.log('🔄 Got 401, attempting token refresh...');
        const newToken = await refreshAuthToken();
        if (newToken) {
          return await fetchSubscriptionStatus(newToken, true);
        } else {
          // Can't refresh, clear auth
          await clearAuthData();
          return;
        }
      }
      
      if (data.success) {
        console.log('✅ Subscription active:', data.data.isActive);
        setSubscription(data.data);
      } else {
        console.log('❌ Subscription not found or error');
        setSubscription({
          isActive: false,
          status: 'none',
          studentCount: 0,
          linkedStudentsCount: 0,
          totalAmount: 0,
          pricePerStudent: 14.99,
          requiredAmount: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscription({
        isActive: false,
        status: 'none',
        studentCount: 0,
        linkedStudentsCount: 0,
        totalAmount: 0,
        pricePerStudent: 14.99,
        requiredAmount: 0,
      });
    }
  };

  const login = async (token: string, refreshToken: string, userData: User, customToken?: string) => {
    try {
      // Sign into Firebase Auth if custom token provided
      if (customToken) {
        try {
          console.log('Signing into Firebase Auth...');
          await signInWithCustomToken(firebaseAuth, customToken);
          console.log('Firebase Auth sign-in successful');
          // Store custom token for re-authentication on app reload
          await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_TOKEN, customToken);
        } catch (firebaseError) {
          console.error('Firebase Auth sign-in failed:', firebaseError);
          // Continue anyway - chat may not work but rest of app should
        }
      }
      
      // Set token expiry to ~55 minutes from now (idToken expires in 1 hour)
      const expiryTime = Date.now() + TOKEN_VALIDITY_DURATION;
      
      // Store auth data - wrap each in try-catch to prevent partial failures from crashing
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token || '');
      } catch (e) { console.error('Failed to store auth token:', e); }
      
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken || '');
      } catch (e) { console.error('Failed to store refresh token:', e); }
      
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
      } catch (e) { console.error('Failed to store user data:', e); }
      
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
      } catch (e) { console.error('Failed to store token expiry:', e); }
      
      setAuthToken(token);
      setUser(userData);
      
      // Fetch subscription status after login - don't let this crash the login flow
      try {
        await fetchSubscriptionStatus(token);
      } catch (subError) {
        console.error('Failed to fetch subscription after login:', subError);
      }
    } catch (error) {
      console.error('Error in login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Sign out from Firebase Auth
      try {
        await firebaseSignOut(firebaseAuth);
      } catch (e) {
        console.error('Firebase sign out error:', e);
      }
      await clearAuthData();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const refreshSubscription = async () => {
    if (authToken) {
      await fetchSubscriptionStatus(authToken);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    
    // Also update AsyncStorage
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
      console.log('✅ User data updated in storage');
    } catch (error) {
      console.error('Error updating user in storage:', error);
    }
  };

  const value: AuthContextType = {
    user,
    authToken,
    subscription,
    isLoading,
    isAuthenticated: !!user && !!authToken,
    hasActiveSubscription: subscription?.isActive || false,
    login,
    logout,
    refreshSubscription,
    setSubscription,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
