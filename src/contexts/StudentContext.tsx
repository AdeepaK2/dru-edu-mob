import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

export interface Student {
  studentId: string;
  studentName: string;
  studentEmail?: string;
  grade?: string;
  section?: string;
  schoolName?: string;
}

interface StudentContextType {
  students: Student[];
  selectedStudent: Student | null;
  setSelectedStudent: (student: Student) => void;
  hasMultipleStudents: boolean;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

const STORAGE_KEYS = {
  SELECTED_STUDENT: '@dru_selected_student',
};

export function StudentProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [selectedStudent, setSelectedStudentState] = useState<Student | null>(null);

  const students: Student[] = user?.linkedStudents || [];
  const hasMultipleStudents = students.length > 1;

  // Load selected student from storage or set first student
  useEffect(() => {
    const loadSelectedStudent = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_STUDENT);
        
        if (stored && students.length > 0) {
          const storedStudent = JSON.parse(stored);
          // Verify the stored student is still in the list
          const exists = students.find(s => s.studentId === storedStudent.studentId);
          if (exists) {
            setSelectedStudentState(exists);
            return;
          }
        }
        
        // Default to first student if available
        if (students.length > 0) {
          setSelectedStudentState(students[0]);
          await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_STUDENT, JSON.stringify(students[0]));
        }
      } catch (error) {
        console.error('Error loading selected student:', error);
        if (students.length > 0) {
          setSelectedStudentState(students[0]);
        }
      }
    };

    loadSelectedStudent();
  }, [students]);

  const setSelectedStudent = async (student: Student) => {
    try {
      setSelectedStudentState(student);
      await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_STUDENT, JSON.stringify(student));
    } catch (error) {
      console.error('Error saving selected student:', error);
    }
  };

  const value: StudentContextType = {
    students,
    selectedStudent,
    setSelectedStudent,
    hasMultipleStudents,
  };

  return <StudentContext.Provider value={value}>{children}</StudentContext.Provider>;
}

export function useStudent() {
  const context = useContext(StudentContext);
  if (context === undefined) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
}
