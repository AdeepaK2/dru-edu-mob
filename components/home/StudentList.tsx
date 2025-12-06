import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Student } from '@/src/contexts/StudentContext';

interface StudentListProps {
  students: Student[];
  selectedStudentId?: string;
  hasMultipleStudents: boolean;
  onSelectStudent: (student: Student) => void;
}

export function StudentList({
  students,
  selectedStudentId,
  hasMultipleStudents,
  onSelectStudent,
}: StudentListProps) {
  if (students.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="person-outline" size={48} color="#9CA3AF" />
          <Text style={styles.emptyText}>No students linked yet</Text>
          <Text style={styles.emptySubtext}>
            Contact your school administrator to link students to your account
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Students</Text>
      </View>
      {students.map((student) => (
        <TouchableOpacity
          key={student.studentId}
          style={[
            styles.card,
            selectedStudentId === student.studentId && styles.cardSelected,
          ]}
          onPress={() => hasMultipleStudents && onSelectStudent(student)}
        >
          <View
            style={[
              styles.avatar,
              selectedStudentId === student.studentId && styles.avatarSelected,
            ]}
          >
            <Text style={styles.avatarText}>
              {student.studentName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{student.studentName}</Text>
            {student.studentEmail && (
              <Text style={styles.email}>{student.studentEmail}</Text>
            )}
          </View>
          {selectedStudentId === student.studentId && (
            <View style={styles.badge}>
              <Ionicons name="checkmark-circle" size={20} color="#6366F1" />
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: '#6366F1',
    backgroundColor: '#FAFBFF',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarSelected: {
    backgroundColor: '#6366F1',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  email: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  badge: {
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
});
