import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/src/contexts/AuthContext';
import { useStudent } from '@/src/contexts/StudentContext';
import { getStudentEndpoints } from '@/src/config/api';
import Paywall from '@/components/Paywall';

interface TeacherClass {
  classId: string;
  className: string;
  subject: string;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
  avatar: string;
  profileImageUrl?: string | null;
  subjects: string[];
  status: string;
  classes: TeacherClass[];
}

interface SystemAdmin {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
}

interface TeachersData {
  teachers: Teacher[];
  systemAdmin: SystemAdmin | null;
}

export default function MessagesScreen() {
  const { hasActiveSubscription, isLoading: authLoading, authToken } = useAuth();
  const { selectedStudent } = useStudent();
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [teachersData, setTeachersData] = useState<TeachersData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchTeachers = useCallback(async () => {
    if (!selectedStudent?.studentId || !authToken) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const endpoints = getStudentEndpoints(selectedStudent.studentId);
      const response = await fetch(endpoints.teachers, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch teachers');
      }

      const result = await response.json();
      if (result.success) {
        setTeachersData(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch teachers');
      }
    } catch (err) {
      console.error('Error fetching teachers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load teachers');
    } finally {
      setIsLoading(false);
    }
  }, [selectedStudent?.studentId, authToken]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTeachers();
    setRefreshing(false);
  };

  const handleTeacherPress = (teacher: Teacher) => {
    router.push(
      `/chat/${teacher.id}?name=${encodeURIComponent(teacher.name)}&type=teacher&avatar=${encodeURIComponent(teacher.avatar)}&subjects=${encodeURIComponent(teacher.subjects.join(', '))}` as any
    );
  };

  const handleAdminPress = (admin: SystemAdmin) => {
    router.push(
      `/chat/${admin.id}?name=${encodeURIComponent(admin.name)}&type=admin&avatar=${encodeURIComponent(admin.avatar)}` as any
    );
  };

  if (authLoading || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!hasActiveSubscription) {
    return <Paywall />;
  }

  if (!selectedStudent) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="person-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyStateTitle}>No Student Selected</Text>
          <Text style={styles.emptyStateText}>
            Please select a student from the profile tab
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const teachers = teachersData?.teachers || [];
  const systemAdmin = teachersData?.systemAdmin;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Messages</Text>
          <Text style={styles.studentIndicator}>{selectedStudent.studentName}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={24} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchTeachers}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Teachers Section */}
        {teachers.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Teachers</Text>
            <Text style={styles.sectionSubtitle}>
              Teachers from {selectedStudent.studentName}&apos;s classes
            </Text>
            
            {teachers.map((teacher) => (
              <TouchableOpacity
                key={teacher.id}
                style={styles.contactCard}
                onPress={() => handleTeacherPress(teacher)}
                activeOpacity={0.7}
              >
                {teacher.profileImageUrl ? (
                  <Image
                    source={{ uri: teacher.profileImageUrl }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{teacher.avatar}</Text>
                  </View>
                )}
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{teacher.name}</Text>
                  <Text style={styles.contactSubjects}>
                    {teacher.subjects.join(', ')}
                  </Text>
                  <View style={styles.classesRow}>
                    <Ionicons name="school-outline" size={12} color="#9CA3AF" />
                    <Text style={styles.classesText}>
                      {teacher.classes.map(c => c.className).join(', ')}
                    </Text>
                  </View>
                </View>
                <View style={styles.statusBadge}>
                  <View style={[
                    styles.statusDot,
                    teacher.status === 'Active' ? styles.statusActive : styles.statusInactive
                  ]} />
                </View>
                <Ionicons name="chatbubble-outline" size={20} color="#6366F1" />
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {/* System Admin Section */}
        {systemAdmin ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Administration</Text>
            <Text style={styles.sectionSubtitle}>
              Contact for general inquiries
            </Text>
            
            <TouchableOpacity
              style={styles.contactCard}
              onPress={() => handleAdminPress(systemAdmin)}
              activeOpacity={0.7}
            >
              <View style={[styles.avatar, styles.adminAvatar]}>
                <Text style={styles.avatarText}>{systemAdmin.avatar}</Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{systemAdmin.name}</Text>
                <View style={styles.adminBadge}>
                  <Ionicons name="shield-checkmark" size={12} color="#059669" />
                  <Text style={styles.adminBadgeText}>System Administrator</Text>
                </View>
              </View>
              <Ionicons name="chatbubble-outline" size={20} color="#6366F1" />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Empty State */}
        {teachers.length === 0 && !systemAdmin && !error ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>No Contacts</Text>
            <Text style={styles.emptyStateText}>
              Teachers will appear here once {selectedStudent.studentName} is enrolled in classes
            </Text>
          </View>
        ) : null}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  studentIndicator: {
    fontSize: 14,
    color: '#6366F1',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EF4444',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  adminAvatar: {
    backgroundColor: '#059669',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  contactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  contactSubjects: {
    fontSize: 13,
    color: '#6366F1',
    marginTop: 2,
  },
  classesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  classesText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
    flex: 1,
  },
  statusBadge: {
    marginRight: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: '#10B981',
  },
  statusInactive: {
    backgroundColor: '#9CA3AF',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  adminBadgeText: {
    fontSize: 12,
    color: '#059669',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
