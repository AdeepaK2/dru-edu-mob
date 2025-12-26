/**
 * Paywall Component Tests
 * 
 * Tests for the Paywall component including:
 * - Component rendering
 * - Pricing calculation
 * - Subscribe functionality
 * - Logout functionality
 * - Dev mode testing
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

// Mock dependencies
const mockLogout = jest.fn();
const mockRefreshSubscription = jest.fn();
const mockRouterReplace = jest.fn();

let mockUser: any = {
  linkedStudents: [{ studentId: '1', studentName: 'Student 1' }],
};

jest.mock('../../../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    authToken: 'test-token',
    logout: mockLogout,
    refreshSubscription: mockRefreshSubscription,
  }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockRouterReplace,
  }),
}));

jest.mock('../../../src/config/api', () => ({
  SUBSCRIPTION_ENDPOINTS: {
    subscribe: 'https://api.example.com/subscription/subscribe',
    devSubscribe: 'https://api.example.com/subscription/dev-subscribe',
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

// Import after mocks
import Paywall from '../../../components/Paywall';

describe('Paywall', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
    mockUser = {
      linkedStudents: [{ studentId: '1', studentName: 'Student 1' }],
    };
  });

  describe('Rendering', () => {
    it('should render the paywall header', () => {
      const { getByText } = render(<Paywall />);

      expect(getByText('Unlock Full Access')).toBeTruthy();
      expect(getByText("Subscribe to track your children's progress")).toBeTruthy();
    });

    it('should render the pricing card', () => {
      const { getByText } = render(<Paywall />);

      expect(getByText('Yearly Subscription')).toBeTruthy();
      expect(getByText('Total per year')).toBeTruthy();
      expect(getByText('365 days of full access')).toBeTruthy();
    });

    it('should render all features', () => {
      const { getByText } = render(<Paywall />);

      expect(getByText('What you get')).toBeTruthy();
      expect(getByText('Access all student information')).toBeTruthy();
      expect(getByText('Real-time grade updates')).toBeTruthy();
      expect(getByText('Attendance tracking')).toBeTruthy();
      expect(getByText('Message teachers directly')).toBeTruthy();
      expect(getByText('Progress reports')).toBeTruthy();
      expect(getByText('Event notifications')).toBeTruthy();
    });

    it('should render subscribe button', () => {
      const { getByText } = render(<Paywall />);

      expect(getByText(/Subscribe Now/)).toBeTruthy();
    });

    it('should render logout button', () => {
      const { getByText } = render(<Paywall />);

      expect(getByText('Sign out')).toBeTruthy();
    });

    it('should render footer with terms links', () => {
      const { getByText } = render(<Paywall />);

      expect(getByText('Terms of Service')).toBeTruthy();
      expect(getByText('Privacy Policy')).toBeTruthy();
    });
  });

  describe('Pricing Calculation', () => {
    it('should display correct price for 1 student', () => {
      mockUser = {
        linkedStudents: [{ studentId: '1', studentName: 'Student 1' }],
      };

      const { getByText } = render(<Paywall />);

      expect(getByText('1 Student')).toBeTruthy();
      expect(getByText('$14.99/student')).toBeTruthy();
      expect(getByText('$14.99')).toBeTruthy(); // Total price
    });

    it('should display correct price for multiple students', () => {
      mockUser = {
        linkedStudents: [
          { studentId: '1', studentName: 'Student 1' },
          { studentId: '2', studentName: 'Student 2' },
          { studentId: '3', studentName: 'Student 3' },
        ],
      };

      const { getByText } = render(<Paywall />);

      expect(getByText('3 Students')).toBeTruthy();
      expect(getByText('$14.99/student')).toBeTruthy();
      expect(getByText('$44.97')).toBeTruthy(); // Total price (14.99 * 3)
    });

    it('should default to 1 student if no linkedStudents', () => {
      mockUser = { linkedStudents: [] };

      const { getByText } = render(<Paywall />);

      expect(getByText('1 Student')).toBeTruthy();
      expect(getByText('$14.99')).toBeTruthy();
    });
  });

  describe('Subscribe Functionality', () => {
    it('should call subscribe API when button is pressed', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const { getByText } = render(<Paywall />);

      fireEvent.press(getByText(/Subscribe Now/));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'https://api.example.com/subscription/subscribe',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': 'Bearer test-token',
            }),
          })
        );
      });
    });

    it('should refresh subscription on successful subscribe', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const { getByText } = render(<Paywall />);

      fireEvent.press(getByText(/Subscribe Now/));

      await waitFor(() => {
        expect(mockRefreshSubscription).toHaveBeenCalled();
      });
    });

    it('should show success alert on successful subscription', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const { getByText } = render(<Paywall />);

      fireEvent.press(getByText(/Subscribe Now/));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          '🎉 Subscription Activated!',
          'Thank you for subscribing. You now have full access to the app.'
        );
      });
    });

    it('should show error alert on failed subscription', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: false,
          message: 'Payment failed',
        }),
      });

      const { getByText } = render(<Paywall />);

      fireEvent.press(getByText(/Subscribe Now/));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error', 'Payment failed');
      });
    });

    it('should show network error on fetch failure', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { getByText } = render(<Paywall />);

      fireEvent.press(getByText(/Subscribe Now/));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error', 'Network error. Please try again.');
      });
    });

    it('should disable button while loading', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 5000))
      );

      const { getByText, queryByText } = render(<Paywall />);
      const button = getByText(/Subscribe Now/).parent;

      fireEvent.press(button);

      await waitFor(() => {
        // Button should be disabled and text should be hidden (showing loader)
        expect(button.props.disabled).toBe(true);
      });
    });
  });

  describe('Logout Functionality', () => {
    it('should call logout when sign out is pressed', async () => {
      const { getByText } = render(<Paywall />);

      fireEvent.press(getByText('Sign out'));

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
      });
    });

    it('should navigate to login after logout', async () => {
      const { getByText } = render(<Paywall />);

      fireEvent.press(getByText('Sign out'));

      await waitFor(() => {
        expect(mockRouterReplace).toHaveBeenCalledWith('/(auth)/login');
      });
    });
  });

  describe('Icons and Styling', () => {
    it('should render school icon in header', () => {
      const { getByTestId } = render(<Paywall />);

      expect(getByTestId('icon-school')).toBeTruthy();
    });

    it('should render star icon for yearly subscription', () => {
      const { getByTestId } = render(<Paywall />);

      expect(getByTestId('icon-star')).toBeTruthy();
    });

    it('should render card icon in subscribe button', () => {
      const { getByTestId } = render(<Paywall />);

      expect(getByTestId('icon-card-outline')).toBeTruthy();
    });

    it('should render log-out icon', () => {
      const { getByTestId } = render(<Paywall />);

      expect(getByTestId('icon-log-out-outline')).toBeTruthy();
    });
  });

  describe('Footer', () => {
    it('should display renewal information', () => {
      const { getByText } = render(<Paywall />);

      expect(getByText(/Subscription automatically renews yearly/)).toBeTruthy();
      expect(getByText(/Cancel anytime from your account settings/)).toBeTruthy();
    });
  });
});
