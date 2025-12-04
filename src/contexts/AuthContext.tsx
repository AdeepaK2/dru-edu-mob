import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUBSCRIPTION_ENDPOINTS, AUTH_ENDPOINTS } from '../config/api';

interface User {
  uid: string;
  email: string;
  name: string;
  phone?: string;
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
  login: (token: string, userData: User) => Promise<void>;
  logout: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  setSubscription: (sub: Subscription) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
  AUTH_TOKEN: '@dru_auth_token',
  USER_DATA: '@dru_user_data',
  TOKEN_EXPIRY: '@dru_token_expiry',
};

// 30 days in milliseconds
const TOKEN_VALIDITY_DURATION = 30 * 24 * 60 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load stored auth data on mount
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedUser, tokenExpiry] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER_DATA),
        AsyncStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY),
      ]);

      if (storedToken && storedUser) {
        const now = Date.now();
        const expiry = tokenExpiry ? parseInt(tokenExpiry, 10) : 0;
        
        // Check if token is expired
        if (expiry && now > expiry) {
          // Clear expired tokens
          await Promise.all([
            AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN),
            AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
            AsyncStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY),
          ]);
          setIsLoading(false);
          return;
        }

        const userData = JSON.parse(storedUser);
        setAuthToken(storedToken);
        setUser(userData);
        
        // Fetch subscription status
        await fetchSubscriptionStatus(storedToken);
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubscriptionStatus = async (token: string) => {
    try {
      const response = await fetch(SUBSCRIPTION_ENDPOINTS.status, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setSubscription(data.data);
      } else {
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

  const login = async (token: string, userData: User) => {
    try {
      // Set token expiry to 30 days from now
      const expiryTime = Date.now() + TOKEN_VALIDITY_DURATION;
      
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token),
        AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData)),
        AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString()),
      ]);
      
      setAuthToken(token);
      setUser(userData);
      
      // Fetch subscription status after login
      await fetchSubscriptionStatus(token);
    } catch (error) {
      console.error('Error saving auth:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
        AsyncStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY),
      ]);
      
      setUser(null);
      setAuthToken(null);
      setSubscription(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const refreshSubscription = async () => {
    if (authToken) {
      await fetchSubscriptionStatus(authToken);
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
