/**
 * AuthContext Tests
 * 
 * Tests for the Auth Context including:
 * - Login/logout functionality
 * - Token management
 * - Subscription status
 * - Storage persistence
 * - User updates
 */

import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { View, Text, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock Firebase
jest.mock('../../utils/firebase', () => ({
  auth: {
    currentUser: null,
  },
}));

jest.mock('firebase/auth', () => ({
  signInWithCustomToken: jest.fn().mockResolvedValue({ user: { uid: 'firebase-uid' } }),
  signOut: jest.fn().mockResolvedValue(undefined),
  onAuthStateChanged: jest.fn((auth, callback) => {
    callback(null);
    return jest.fn(); // unsubscribe function
  }),
}));

jest.mock('../../config/api', () => ({
  SUBSCRIPTION_ENDPOINTS: {
    status: 'https://api.example.com/subscription/status',
  },
  AUTH_ENDPOINTS: {
    refreshToken: 'https://api.example.com/auth/refresh',
  },
}));

// Import after mocks
import { AuthProvider, useAuth } from '../../contexts/AuthContext';

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
    AsyncStorage.clear();
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Create a component that uses useAuth without provider
      const TestComponent = () => {
        try {
          useAuth();
          return <Text>Should not reach here</Text>;
        } catch (error: any) {
          return <Text>{error.message}</Text>;
        }
      };

      const { getByText } = render(<TestComponent />);
      expect(getByText('useAuth must be used within an AuthProvider')).toBeTruthy();
    });
  });

  describe('AuthProvider initialization', () => {
    it('should start with loading state', async () => {
      let isLoadingValue = true;

      const TestComponent = () => {
        const { isLoading } = useAuth();
        isLoadingValue = isLoading;
        return <Text>{isLoading ? 'Loading' : 'Loaded'}</Text>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Initially should be loading
      expect(isLoadingValue).toBe(true);

      // Wait for loading to finish
      await waitFor(() => {
        expect(isLoadingValue).toBe(false);
      });
    });

    it('should initialize with null user when no stored data', async () => {
      const TestComponent = () => {
        const { user, isAuthenticated } = useAuth();
        return (
          <View>
            <Text testID="auth-status">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</Text>
            <Text testID="user-status">{user ? 'User exists' : 'No user'}</Text>
          </View>
        );
      };

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
        expect(getByTestId('user-status')).toHaveTextContent('No user');
      });
    });
  });

  describe('Login functionality', () => {
    it('should login and store user data', async () => {
      // Mock subscription fetch
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            isActive: true,
            status: 'active',
            studentCount: 1,
            linkedStudentsCount: 1,
            totalAmount: 14.99,
            pricePerStudent: 14.99,
            requiredAmount: 0,
          },
        }),
      });

      let loginFn: any;
      let authState: any = {};

      const TestComponent = () => {
        const auth = useAuth();
        loginFn = auth.login;
        authState = auth;
        return (
          <View>
            <Text testID="user-name">{auth.user?.name || 'No name'}</Text>
            <Text testID="is-auth">{auth.isAuthenticated ? 'Yes' : 'No'}</Text>
            <Text testID="has-sub">{auth.hasActiveSubscription ? 'Yes' : 'No'}</Text>
          </View>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authState.isLoading).toBe(false);
      });

      // Perform login
      await act(async () => {
        await loginFn(
          'test-token',
          'test-refresh-token',
          {
            uid: 'user123',
            email: 'test@example.com',
            name: 'Test User',
            linkedStudents: [],
          },
          'custom-token'
        );
      });

      // Verify state after login
      expect(authState.user).toEqual({
        uid: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        linkedStudents: [],
      });
      expect(authState.authToken).toBe('test-token');
      expect(authState.isAuthenticated).toBe(true);
    });

    it('should store tokens in AsyncStorage on login', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { isActive: false, status: 'none' },
        }),
      });

      let loginFn: any;

      const TestComponent = () => {
        const { login, isLoading } = useAuth();
        loginFn = login;
        return <Text>{isLoading ? 'Loading' : 'Ready'}</Text>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(loginFn).toBeDefined();
      });

      await act(async () => {
        await loginFn(
          'auth-token-123',
          'refresh-token-456',
          { uid: 'user1', email: 'test@test.com', name: 'Test', linkedStudents: [] }
        );
      });

      // Check AsyncStorage was called
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@dru_auth_token', 'auth-token-123');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@dru_refresh_token', 'refresh-token-456');
    });
  });

  describe('Logout functionality', () => {
    it('should clear state on logout', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { isActive: false, status: 'none' } }),
      });

      let authState: any = {};
      let loginFn: any;
      let logoutFn: any;

      const TestComponent = () => {
        const auth = useAuth();
        authState = auth;
        loginFn = auth.login;
        logoutFn = auth.logout;
        return <Text>{auth.isAuthenticated ? 'Auth' : 'No Auth'}</Text>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authState.isLoading).toBe(false);
      });

      // Login first
      await act(async () => {
        await loginFn(
          'test-token',
          'refresh-token',
          { uid: 'user1', email: 'test@test.com', name: 'Test', linkedStudents: [] }
        );
      });

      expect(authState.isAuthenticated).toBe(true);

      // Now logout
      await act(async () => {
        await logoutFn();
      });

      expect(authState.user).toBeNull();
      expect(authState.authToken).toBeNull();
      expect(authState.isAuthenticated).toBe(false);
    });

    it('should clear AsyncStorage on logout', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { isActive: false } }),
      });

      let loginFn: any;
      let logoutFn: any;

      const TestComponent = () => {
        const { login, logout, isLoading } = useAuth();
        loginFn = login;
        logoutFn = logout;
        return <Text>{isLoading ? 'Loading' : 'Ready'}</Text>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(loginFn).toBeDefined();
      });

      await act(async () => {
        await loginFn('token', 'refresh', { uid: '1', email: 'e', name: 'n', linkedStudents: [] });
      });

      await act(async () => {
        await logoutFn();
      });

      // Check AsyncStorage items were removed
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@dru_auth_token');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@dru_refresh_token');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@dru_user_data');
    });
  });

  describe('Subscription status', () => {
    it('should fetch subscription status after login', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            isActive: true,
            status: 'active',
            studentCount: 2,
            linkedStudentsCount: 2,
            totalAmount: 29.98,
            pricePerStudent: 14.99,
            requiredAmount: 0,
            expiryDate: '2025-12-31',
            daysRemaining: 365,
          },
        }),
      });

      let authState: any = {};
      let loginFn: any;

      const TestComponent = () => {
        const auth = useAuth();
        authState = auth;
        loginFn = auth.login;
        return <Text>{auth.hasActiveSubscription ? 'Active' : 'Inactive'}</Text>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => expect(authState.isLoading).toBe(false));

      await act(async () => {
        await loginFn(
          'test-token',
          'refresh',
          { uid: '1', email: 'test@test.com', name: 'Test', linkedStudents: [] }
        );
      });

      expect(authState.hasActiveSubscription).toBe(true);
      expect(authState.subscription?.studentCount).toBe(2);
      expect(authState.subscription?.daysRemaining).toBe(365);
    });

    it('should handle no subscription', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: false }),
      });

      let authState: any = {};
      let loginFn: any;

      const TestComponent = () => {
        const auth = useAuth();
        authState = auth;
        loginFn = auth.login;
        return <Text>Test</Text>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => expect(authState.isLoading).toBe(false));

      await act(async () => {
        await loginFn('token', 'refresh', { uid: '1', email: 'e', name: 'n', linkedStudents: [] });
      });

      expect(authState.hasActiveSubscription).toBe(false);
      expect(authState.subscription?.status).toBe('none');
    });
  });

  describe('Update user', () => {
    it('should update user data', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { isActive: false } }),
      });

      let authState: any = {};
      let loginFn: any;
      let updateUserFn: any;

      const TestComponent = () => {
        const auth = useAuth();
        authState = auth;
        loginFn = auth.login;
        updateUserFn = auth.updateUser;
        return <Text>{auth.user?.name || 'No name'}</Text>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => expect(authState.isLoading).toBe(false));

      await act(async () => {
        await loginFn(
          'token',
          'refresh',
          { uid: '1', email: 'test@test.com', name: 'Original Name', linkedStudents: [] }
        );
      });

      expect(authState.user?.name).toBe('Original Name');

      await act(async () => {
        await updateUserFn({ name: 'Updated Name' });
      });

      expect(authState.user?.name).toBe('Updated Name');
    });
  });

  describe('Refresh subscription', () => {
    it('should refresh subscription when called', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { isActive: false, status: 'none' },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { isActive: true, status: 'active', studentCount: 1 },
          }),
        });

      let authState: any = {};
      let loginFn: any;
      let refreshSubFn: any;

      const TestComponent = () => {
        const auth = useAuth();
        authState = auth;
        loginFn = auth.login;
        refreshSubFn = auth.refreshSubscription;
        return <Text>Test</Text>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => expect(authState.isLoading).toBe(false));

      await act(async () => {
        await loginFn('token', 'refresh', { uid: '1', email: 'e', name: 'n', linkedStudents: [] });
      });

      expect(authState.hasActiveSubscription).toBe(false);

      await act(async () => {
        await refreshSubFn();
      });

      expect(authState.hasActiveSubscription).toBe(true);
    });
  });
});
