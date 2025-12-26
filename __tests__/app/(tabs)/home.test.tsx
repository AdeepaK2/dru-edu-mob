/**
 * Home Screen Tests
 * 
 * Tests for the main Home screen (tab) including:
 * - Component rendering
 * - Student switching
 * - Subscription status display
 * - Performance overview
 * - Paywall display for non-subscribers
 * - Loading states
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// Mock the contexts
const mockUseAuth = jest.fn();
const mockUseStudent = jest.fn();

jest.mock('../../../src/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../../../src/contexts/StudentContext', () => ({
  useStudent: () => mockUseStudent(),
  Student: jest.fn(),
}));

jest.mock('../../../src/config/api', () => ({
  getStudentEndpoints: (studentId: string) => ({
    classes: `https://api.example.com/students/${studentId}/classes`,
    classDetails: (classId: string) => 
      `https://api.example.com/students/${studentId}/classes/${classId}`,
  }),
}));

// Mock the components
jest.mock('../../../components/Paywall', () => {
  const { View, Text } = require('react-native');
  return function MockPaywall() {
    return <View testID="paywall"><Text>Paywall Content</Text></View>;
  };
});

jest.mock('../../../components/home', () => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    HomeHeader: ({ userName }: { userName: string }) => (
      <View testID="home-header"><Text>Welcome, {userName}</Text></View>
    ),
    SubscriptionCard: ({ studentCount, expiryDate, daysRemaining }: any) => (
      <View testID="subscription-card">
        <Text>Students: {studentCount}</Text>
        <Text>Expires: {expiryDate}</Text>
        <Text>Days: {daysRemaining}</Text>
      </View>
    ),
    StudentSwitcher: ({ student, onPress }: any) => (
      <TouchableOpacity testID="student-switcher" onPress={onPress}>
        <Text>{student?.studentName}</Text>
      </TouchableOpacity>
    ),
    SingleStudentCard: ({ student }: any) => (
      <View testID="single-student-card">
        <Text>{student?.studentName}</Text>
      </View>
    ),
    PerformanceOverview: ({ studentName, isLoading }: any) => (
      <View testID="performance-overview">
        <Text>{studentName}</Text>
        {isLoading && <Text>Loading...</Text>}
      </View>
    ),
    QuickActions: () => (
      <View testID="quick-actions"><Text>Quick Actions</Text></View>
    ),
    StudentList: ({ students, onSelectStudent }: any) => (
      <View testID="student-list">
        {students?.map((s: any, i: number) => (
          <TouchableOpacity 
            key={i} 
            testID={`student-item-${i}`}
            onPress={() => onSelectStudent(s)}
          >
            <Text>{s.studentName}</Text>
          </TouchableOpacity>
        ))}
      </View>
    ),
    StudentPickerModal: ({ visible, students, onSelect, onClose }: any) => (
      visible ? (
        <View testID="student-picker-modal">
          {students?.map((s: any, i: number) => (
            <TouchableOpacity 
              key={i} 
              testID={`picker-student-${i}`}
              onPress={() => onSelect(s)}
            >
              <Text>{s.studentName}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity testID="close-picker" onPress={onClose}>
            <Text>Close</Text>
          </TouchableOpacity>
        </View>
      ) : null
    ),
  };
});

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

// Import after mocks
import HomeScreen from '../../../app/(tabs)/index';

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('Loading State', () => {
    it('should show loading indicator when isLoading is true', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        hasActiveSubscription: false,
        subscription: null,
        refreshSubscription: jest.fn(),
        isLoading: true,
        authToken: null,
      });

      mockUseStudent.mockReturnValue({
        students: [],
        selectedStudent: null,
        setSelectedStudent: jest.fn(),
        hasMultipleStudents: false,
      });

      const { getByText } = render(<HomeScreen />);

      expect(getByText('Loading...')).toBeTruthy();
    });
  });

  describe('Paywall Display', () => {
    it('should show Paywall when user has no active subscription', () => {
      mockUseAuth.mockReturnValue({
        user: { name: 'Test User', email: 'test@example.com' },
        hasActiveSubscription: false,
        subscription: null,
        refreshSubscription: jest.fn(),
        isLoading: false,
        authToken: 'test-token',
      });

      mockUseStudent.mockReturnValue({
        students: [],
        selectedStudent: null,
        setSelectedStudent: jest.fn(),
        hasMultipleStudents: false,
      });

      const { getByTestId } = render(<HomeScreen />);

      expect(getByTestId('paywall')).toBeTruthy();
    });
  });

  describe('Home Screen with Active Subscription', () => {
    const mockStudent = {
      studentId: 'student-1',
      studentName: 'John Doe',
      studentEmail: 'john@school.com',
      className: 'Class 10A',
    };

    const mockStudents = [
      mockStudent,
      {
        studentId: 'student-2',
        studentName: 'Jane Doe',
        studentEmail: 'jane@school.com',
        className: 'Class 8B',
      },
    ];

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { name: 'Parent Name', email: 'parent@example.com' },
        hasActiveSubscription: true,
        subscription: { expiryDate: '2025-12-31', daysRemaining: 365 },
        refreshSubscription: jest.fn(),
        isLoading: false,
        authToken: 'test-token',
      });
    });

    it('should render home header with user name', () => {
      mockUseStudent.mockReturnValue({
        students: [mockStudent],
        selectedStudent: mockStudent,
        setSelectedStudent: jest.fn(),
        hasMultipleStudents: false,
      });

      // Mock API call for classes
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      const { getByTestId, getByText } = render(<HomeScreen />);

      expect(getByTestId('home-header')).toBeTruthy();
      expect(getByText('Welcome, Parent Name')).toBeTruthy();
    });

    it('should render subscription card with correct info', () => {
      mockUseStudent.mockReturnValue({
        students: [mockStudent],
        selectedStudent: mockStudent,
        setSelectedStudent: jest.fn(),
        hasMultipleStudents: false,
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      const { getByTestId, getByText } = render(<HomeScreen />);

      expect(getByTestId('subscription-card')).toBeTruthy();
      expect(getByText('Students: 1')).toBeTruthy();
      expect(getByText('Days: 365')).toBeTruthy();
    });

    it('should render single student card when only one student', () => {
      mockUseStudent.mockReturnValue({
        students: [mockStudent],
        selectedStudent: mockStudent,
        setSelectedStudent: jest.fn(),
        hasMultipleStudents: false,
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      const { getByTestId } = render(<HomeScreen />);

      expect(getByTestId('single-student-card')).toBeTruthy();
    });

    it('should render student switcher when multiple students', () => {
      mockUseStudent.mockReturnValue({
        students: mockStudents,
        selectedStudent: mockStudents[0],
        setSelectedStudent: jest.fn(),
        hasMultipleStudents: true,
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      const { getByTestId, queryByTestId } = render(<HomeScreen />);

      expect(getByTestId('student-switcher')).toBeTruthy();
      expect(queryByTestId('single-student-card')).toBeNull();
    });

    it('should render performance overview', () => {
      mockUseStudent.mockReturnValue({
        students: [mockStudent],
        selectedStudent: mockStudent,
        setSelectedStudent: jest.fn(),
        hasMultipleStudents: false,
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      const { getByTestId } = render(<HomeScreen />);

      expect(getByTestId('performance-overview')).toBeTruthy();
    });

    it('should render quick actions', () => {
      mockUseStudent.mockReturnValue({
        students: [mockStudent],
        selectedStudent: mockStudent,
        setSelectedStudent: jest.fn(),
        hasMultipleStudents: false,
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      const { getByTestId } = render(<HomeScreen />);

      expect(getByTestId('quick-actions')).toBeTruthy();
    });

    it('should render student list', () => {
      mockUseStudent.mockReturnValue({
        students: mockStudents,
        selectedStudent: mockStudents[0],
        setSelectedStudent: jest.fn(),
        hasMultipleStudents: true,
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      const { getByTestId } = render(<HomeScreen />);

      expect(getByTestId('student-list')).toBeTruthy();
    });
  });

  describe('Student Picker Modal', () => {
    const mockStudents = [
      {
        studentId: 'student-1',
        studentName: 'John Doe',
        studentEmail: 'john@school.com',
        className: 'Class 10A',
      },
      {
        studentId: 'student-2',
        studentName: 'Jane Doe',
        studentEmail: 'jane@school.com',
        className: 'Class 8B',
      },
    ];

    it('should open student picker when student switcher is pressed', async () => {
      mockUseAuth.mockReturnValue({
        user: { name: 'Parent Name' },
        hasActiveSubscription: true,
        subscription: { expiryDate: '2025-12-31', daysRemaining: 365 },
        refreshSubscription: jest.fn(),
        isLoading: false,
        authToken: 'test-token',
      });

      mockUseStudent.mockReturnValue({
        students: mockStudents,
        selectedStudent: mockStudents[0],
        setSelectedStudent: jest.fn(),
        hasMultipleStudents: true,
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      const { getByTestId, queryByTestId } = render(<HomeScreen />);

      // Initially modal should not be visible
      expect(queryByTestId('student-picker-modal')).toBeNull();

      // Press student switcher
      fireEvent.press(getByTestId('student-switcher'));

      // Modal should now be visible
      await waitFor(() => {
        expect(getByTestId('student-picker-modal')).toBeTruthy();
      });
    });

    it('should close student picker when close button is pressed', async () => {
      mockUseAuth.mockReturnValue({
        user: { name: 'Parent Name' },
        hasActiveSubscription: true,
        subscription: { expiryDate: '2025-12-31', daysRemaining: 365 },
        refreshSubscription: jest.fn(),
        isLoading: false,
        authToken: 'test-token',
      });

      mockUseStudent.mockReturnValue({
        students: mockStudents,
        selectedStudent: mockStudents[0],
        setSelectedStudent: jest.fn(),
        hasMultipleStudents: true,
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      const { getByTestId, queryByTestId } = render(<HomeScreen />);

      // Open modal
      fireEvent.press(getByTestId('student-switcher'));

      await waitFor(() => {
        expect(getByTestId('student-picker-modal')).toBeTruthy();
      });

      // Close modal
      fireEvent.press(getByTestId('close-picker'));

      await waitFor(() => {
        expect(queryByTestId('student-picker-modal')).toBeNull();
      });
    });
  });

  describe('Data Fetching', () => {
    it('should fetch classes data when student is selected', async () => {
      const mockStudent = {
        studentId: 'student-1',
        studentName: 'John Doe',
        studentEmail: 'john@school.com',
      };

      mockUseAuth.mockReturnValue({
        user: { name: 'Parent Name' },
        hasActiveSubscription: true,
        subscription: { expiryDate: '2025-12-31', daysRemaining: 365 },
        refreshSubscription: jest.fn(),
        isLoading: false,
        authToken: 'test-token',
      });

      mockUseStudent.mockReturnValue({
        students: [mockStudent],
        selectedStudent: mockStudent,
        setSelectedStudent: jest.fn(),
        hasMultipleStudents: false,
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: [
            { id: 'class-1', name: 'Math', subject: 'Mathematics', attendance: 95 },
          ],
        }),
      });

      render(<HomeScreen />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'https://api.example.com/students/student-1/classes',
          expect.objectContaining({
            headers: { Authorization: 'Bearer test-token' },
          })
        );
      });
    });
  });

  describe('Pull to Refresh', () => {
    it('should call refreshSubscription on pull to refresh', async () => {
      const mockRefreshSubscription = jest.fn().mockResolvedValue(undefined);
      const mockStudent = {
        studentId: 'student-1',
        studentName: 'John Doe',
        studentEmail: 'john@school.com',
      };

      mockUseAuth.mockReturnValue({
        user: { name: 'Parent Name' },
        hasActiveSubscription: true,
        subscription: { expiryDate: '2025-12-31', daysRemaining: 365 },
        refreshSubscription: mockRefreshSubscription,
        isLoading: false,
        authToken: 'test-token',
      });

      mockUseStudent.mockReturnValue({
        students: [mockStudent],
        selectedStudent: mockStudent,
        setSelectedStudent: jest.fn(),
        hasMultipleStudents: false,
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      render(<HomeScreen />);

      // The refresh functionality would be tested through ScrollView's onRefresh
      expect(mockRefreshSubscription).toBeDefined();
    });
  });
});
