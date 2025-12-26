/**
 * StudentContext Tests
 * 
 * Tests for the Student Context including:
 * - Student selection
 * - Multiple students handling
 * - Storage persistence
 * - Default student selection
 */

import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock useAuth before importing StudentContext
const mockUser: any = { linkedStudents: [] };
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}));

// Import after mocks
import { StudentProvider, useStudent, Student } from '../../contexts/StudentContext';

describe('StudentContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
    mockUser.linkedStudents = [];
  });

  describe('useStudent hook', () => {
    it('should throw error when used outside StudentProvider', () => {
      const TestComponent = () => {
        try {
          useStudent();
          return <Text>Should not reach here</Text>;
        } catch (error: any) {
          return <Text>{error.message}</Text>;
        }
      };

      const { getByText } = render(<TestComponent />);
      expect(getByText('useStudent must be used within a StudentProvider')).toBeTruthy();
    });
  });

  describe('StudentProvider with no students', () => {
    it('should have empty students array when user has no linked students', async () => {
      mockUser.linkedStudents = [];

      let contextValue: any = {};

      const TestComponent = () => {
        contextValue = useStudent();
        return (
          <View>
            <Text testID="student-count">{contextValue.students.length}</Text>
            <Text testID="has-multiple">{contextValue.hasMultipleStudents ? 'Yes' : 'No'}</Text>
          </View>
        );
      };

      const { getByTestId } = render(
        <StudentProvider>
          <TestComponent />
        </StudentProvider>
      );

      await waitFor(() => {
        expect(getByTestId('student-count')).toHaveTextContent('0');
        expect(getByTestId('has-multiple')).toHaveTextContent('No');
      });
    });

    it('should have null selectedStudent when no students available', async () => {
      mockUser.linkedStudents = [];

      let contextValue: any = {};

      const TestComponent = () => {
        contextValue = useStudent();
        return <Text>{contextValue.selectedStudent ? 'Has student' : 'No student'}</Text>;
      };

      const { getByText } = render(
        <StudentProvider>
          <TestComponent />
        </StudentProvider>
      );

      await waitFor(() => {
        expect(getByText('No student')).toBeTruthy();
      });
    });
  });

  describe('StudentProvider with single student', () => {
    const singleStudent: Student = {
      studentId: 'student-1',
      studentName: 'John Doe',
      studentEmail: 'john@school.com',
    };

    it('should automatically select the first student', async () => {
      mockUser.linkedStudents = [singleStudent];

      let contextValue: any = {};

      const TestComponent = () => {
        contextValue = useStudent();
        return (
          <View>
            <Text testID="selected-name">{contextValue.selectedStudent?.studentName || 'None'}</Text>
            <Text testID="has-multiple">{contextValue.hasMultipleStudents ? 'Yes' : 'No'}</Text>
          </View>
        );
      };

      const { getByTestId } = render(
        <StudentProvider>
          <TestComponent />
        </StudentProvider>
      );

      await waitFor(() => {
        expect(getByTestId('selected-name')).toHaveTextContent('John Doe');
        expect(getByTestId('has-multiple')).toHaveTextContent('No');
      });
    });

    it('should save selected student to AsyncStorage', async () => {
      mockUser.linkedStudents = [singleStudent];

      const TestComponent = () => {
        useStudent();
        return <Text>Test</Text>;
      };

      render(
        <StudentProvider>
          <TestComponent />
        </StudentProvider>
      );

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          '@dru_selected_student',
          JSON.stringify(singleStudent)
        );
      });
    });
  });

  describe('StudentProvider with multiple students', () => {
    const students: Student[] = [
      { studentId: 'student-1', studentName: 'John Doe', studentEmail: 'john@school.com' },
      { studentId: 'student-2', studentName: 'Jane Doe', studentEmail: 'jane@school.com' },
      { studentId: 'student-3', studentName: 'Bob Smith', studentEmail: 'bob@school.com' },
    ];

    it('should correctly identify hasMultipleStudents', async () => {
      mockUser.linkedStudents = students;

      let contextValue: any = {};

      const TestComponent = () => {
        contextValue = useStudent();
        return (
          <View>
            <Text testID="count">{contextValue.students.length}</Text>
            <Text testID="has-multiple">{contextValue.hasMultipleStudents ? 'Yes' : 'No'}</Text>
          </View>
        );
      };

      const { getByTestId } = render(
        <StudentProvider>
          <TestComponent />
        </StudentProvider>
      );

      await waitFor(() => {
        expect(getByTestId('count')).toHaveTextContent('3');
        expect(getByTestId('has-multiple')).toHaveTextContent('Yes');
      });
    });

    it('should select first student by default', async () => {
      mockUser.linkedStudents = students;

      let contextValue: any = {};

      const TestComponent = () => {
        contextValue = useStudent();
        return <Text testID="name">{contextValue.selectedStudent?.studentName || 'None'}</Text>;
      };

      const { getByTestId } = render(
        <StudentProvider>
          <TestComponent />
        </StudentProvider>
      );

      await waitFor(() => {
        expect(getByTestId('name')).toHaveTextContent('John Doe');
      });
    });

    it('should allow changing selected student', async () => {
      mockUser.linkedStudents = students;

      let setStudentFn: any;
      let contextValue: any = {};

      const TestComponent = () => {
        contextValue = useStudent();
        setStudentFn = contextValue.setSelectedStudent;
        return <Text testID="name">{contextValue.selectedStudent?.studentName || 'None'}</Text>;
      };

      const { getByTestId } = render(
        <StudentProvider>
          <TestComponent />
        </StudentProvider>
      );

      await waitFor(() => {
        expect(getByTestId('name')).toHaveTextContent('John Doe');
      });

      // Change to second student
      await act(async () => {
        await setStudentFn(students[1]);
      });

      await waitFor(() => {
        expect(getByTestId('name')).toHaveTextContent('Jane Doe');
      });
    });

    it('should persist selected student to AsyncStorage', async () => {
      mockUser.linkedStudents = students;

      let setStudentFn: any;

      const TestComponent = () => {
        const { setSelectedStudent } = useStudent();
        setStudentFn = setSelectedStudent;
        return <Text>Test</Text>;
      };

      render(
        <StudentProvider>
          <TestComponent />
        </StudentProvider>
      );

      await waitFor(() => {
        expect(setStudentFn).toBeDefined();
      });

      await act(async () => {
        await setStudentFn(students[2]);
      });

      expect(AsyncStorage.setItem).toHaveBeenLastCalledWith(
        '@dru_selected_student',
        JSON.stringify(students[2])
      );
    });
  });

  describe('Restoring from storage', () => {
    const students: Student[] = [
      { studentId: 'student-1', studentName: 'John Doe' },
      { studentId: 'student-2', studentName: 'Jane Doe' },
    ];

    it('should restore previously selected student from storage', async () => {
      mockUser.linkedStudents = students;

      // Pre-set the stored student
      await AsyncStorage.setItem(
        '@dru_selected_student',
        JSON.stringify(students[1])
      );

      let contextValue: any = {};

      const TestComponent = () => {
        contextValue = useStudent();
        return <Text testID="name">{contextValue.selectedStudent?.studentName || 'None'}</Text>;
      };

      const { getByTestId } = render(
        <StudentProvider>
          <TestComponent />
        </StudentProvider>
      );

      await waitFor(() => {
        expect(getByTestId('name')).toHaveTextContent('Jane Doe');
      });
    });

    it('should fallback to first student if stored student no longer exists', async () => {
      mockUser.linkedStudents = students;

      // Store a student that doesn't exist anymore
      await AsyncStorage.setItem(
        '@dru_selected_student',
        JSON.stringify({ studentId: 'deleted-student', studentName: 'Deleted' })
      );

      let contextValue: any = {};

      const TestComponent = () => {
        contextValue = useStudent();
        return <Text testID="name">{contextValue.selectedStudent?.studentName || 'None'}</Text>;
      };

      const { getByTestId } = render(
        <StudentProvider>
          <TestComponent />
        </StudentProvider>
      );

      await waitFor(() => {
        expect(getByTestId('name')).toHaveTextContent('John Doe');
      });
    });
  });

  describe('Students list', () => {
    it('should expose all students from user', async () => {
      const students: Student[] = [
        { studentId: '1', studentName: 'Student 1' },
        { studentId: '2', studentName: 'Student 2' },
      ];
      mockUser.linkedStudents = students;

      let contextValue: any = {};

      const TestComponent = () => {
        contextValue = useStudent();
        return (
          <View>
            {contextValue.students.map((s: Student) => (
              <Text key={s.studentId} testID={`student-${s.studentId}`}>
                {s.studentName}
              </Text>
            ))}
          </View>
        );
      };

      const { getByTestId } = render(
        <StudentProvider>
          <TestComponent />
        </StudentProvider>
      );

      await waitFor(() => {
        expect(getByTestId('student-1')).toHaveTextContent('Student 1');
        expect(getByTestId('student-2')).toHaveTextContent('Student 2');
      });
    });
  });
});
