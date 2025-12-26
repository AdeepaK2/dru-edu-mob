/**
 * Login Screen Tests
 * 
 * Tests for the authentication login screen including:
 * - Component rendering
 * - User input handling
 * - Form validation
 * - Login API interactions
 * - Navigation flows
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';

// Mock the modules before importing the component
jest.mock('../../../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    login: jest.fn().mockResolvedValue(undefined),
    user: null,
    token: null,
    isLoading: false,
  }),
}));

jest.mock('../../../src/config/api', () => ({
  AUTH_ENDPOINTS: {
    login: 'https://api.example.com/auth/login',
  },
}));

// Import after mocks are set up
import LoginScreen from '../../../app/(auth)/login';

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('Rendering', () => {
    it('should render the login screen correctly', () => {
      const { getByText, getByPlaceholderText } = render(<LoginScreen />);

      // Check header elements
      expect(getByText('Dr U Education')).toBeTruthy();
      expect(getByText('Parent Portal')).toBeTruthy();

      // Check welcome section
      expect(getByText('Welcome Back!')).toBeTruthy();
      expect(getByText("Sign in to track your child's academic progress")).toBeTruthy();

      // Check form elements
      expect(getByPlaceholderText('Email Address')).toBeTruthy();
      expect(getByPlaceholderText('Password')).toBeTruthy();

      // Check buttons
      expect(getByText('Sign In')).toBeTruthy();
      expect(getByText('Forgot Password?')).toBeTruthy();
      expect(getByText("Don't have an account?")).toBeTruthy();
      expect(getByText('Sign Up')).toBeTruthy();
    });

    it('should have email input with correct keyboard type', () => {
      const { getByPlaceholderText } = render(<LoginScreen />);
      const emailInput = getByPlaceholderText('Email Address');
      
      expect(emailInput.props.keyboardType).toBe('email-address');
      expect(emailInput.props.autoCapitalize).toBe('none');
    });

    it('should initially hide password', () => {
      const { getByPlaceholderText } = render(<LoginScreen />);
      const passwordInput = getByPlaceholderText('Password');
      
      expect(passwordInput.props.secureTextEntry).toBe(true);
    });
  });

  describe('User Input', () => {
    it('should update email field when user types', () => {
      const { getByPlaceholderText } = render(<LoginScreen />);
      const emailInput = getByPlaceholderText('Email Address');

      fireEvent.changeText(emailInput, 'test@example.com');
      expect(emailInput.props.value).toBe('test@example.com');
    });

    it('should update password field when user types', () => {
      const { getByPlaceholderText } = render(<LoginScreen />);
      const passwordInput = getByPlaceholderText('Password');

      fireEvent.changeText(passwordInput, 'password123');
      expect(passwordInput.props.value).toBe('password123');
    });

    it('should toggle password visibility when eye icon is pressed', async () => {
      const { getByPlaceholderText, getByTestId } = render(<LoginScreen />);
      const passwordInput = getByPlaceholderText('Password');

      // Initially password should be hidden
      expect(passwordInput.props.secureTextEntry).toBe(true);

      // Find and press the eye icon (toggle button)
      const eyeIcon = getByTestId('icon-eye-off-outline');
      fireEvent.press(eyeIcon.parent);

      // After toggle, password should be visible
      await waitFor(() => {
        expect(passwordInput.props.secureTextEntry).toBe(false);
      });
    });
  });

  describe('Form Validation', () => {
    it('should show error alert when email is empty', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      const { getByText, getByPlaceholderText } = render(<LoginScreen />);

      // Only fill password
      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
      fireEvent.press(getByText('Sign In'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error', 'Please enter email and password');
      });
    });

    it('should show error alert when password is empty', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      const { getByText, getByPlaceholderText } = render(<LoginScreen />);

      // Only fill email
      fireEvent.changeText(getByPlaceholderText('Email Address'), 'test@example.com');
      fireEvent.press(getByText('Sign In'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error', 'Please enter email and password');
      });
    });

    it('should show error alert when both fields are empty', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      const { getByText } = render(<LoginScreen />);

      fireEvent.press(getByText('Sign In'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error', 'Please enter email and password');
      });
    });
  });

  describe('API Integration', () => {
    it('should call login API with correct credentials', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            parent: {
              uid: 'user123',
              email: 'test@example.com',
              name: 'Test User',
              phone: '+1234567890',
              linkedStudents: [],
            },
            idToken: 'mock-token',
            refreshToken: 'mock-refresh-token',
          },
        }),
      });

      const { getByText, getByPlaceholderText } = render(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('Email Address'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
      fireEvent.press(getByText('Sign In'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'https://api.example.com/auth/login',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'test@example.com',
              password: 'password123',
            }),
          })
        );
      });
    });

    it('should show error on failed login', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: false,
          message: 'Invalid credentials',
        }),
      });

      const { getByText, getByPlaceholderText } = render(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('Email Address'), 'wrong@example.com');
      fireEvent.changeText(getByPlaceholderText('Password'), 'wrongpassword');
      fireEvent.press(getByText('Sign In'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error', 'Invalid credentials');
      });
    });

    it('should show network error on fetch failure', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { getByText, getByPlaceholderText } = render(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('Email Address'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
      fireEvent.press(getByText('Sign In'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Error',
          'Network error. Please check your connection and try again.'
        );
      });
    });

    it('should show loading indicator while logging in', async () => {
      // Mock a slow response
      (global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      const { getByText, getByPlaceholderText, queryByText, getByTestId } = render(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('Email Address'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
      fireEvent.press(getByText('Sign In'));

      // While loading, button text should be hidden
      await waitFor(() => {
        expect(queryByText('Sign In')).toBeNull();
      });
    });

    it('should lowercase email before sending to API', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            parent: { uid: 'user123', email: 'test@example.com' },
            idToken: 'mock-token',
          },
        }),
      });

      const { getByText, getByPlaceholderText } = render(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('Email Address'), 'TEST@EXAMPLE.COM');
      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
      fireEvent.press(getByText('Sign In'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: JSON.stringify({
              email: 'test@example.com',
              password: 'password123',
            }),
          })
        );
      });
    });
  });

  describe('UI Interaction', () => {
    it('should disable button while loading', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      const { getByText, getByPlaceholderText } = render(<LoginScreen />);
      const signInButton = getByText('Sign In').parent;

      fireEvent.changeText(getByPlaceholderText('Email Address'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');

      // Button should be enabled before press
      expect(signInButton.props.disabled).toBeFalsy();

      fireEvent.press(signInButton);

      // Button should be disabled while loading
      await waitFor(() => {
        expect(signInButton.props.disabled).toBe(true);
      });
    });
  });
});
