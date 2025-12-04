import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/src/contexts/AuthContext';
import { useStudent } from '@/src/contexts/StudentContext';
import { getStudentEndpoints } from '@/src/config/api';
import Paywall from '@/components/Paywall';

interface ClassItem {
  id: string;
  classId: string;
  name: string;
  subject: string;
  teacher: string;
  year: string;
  schedule: Array<{ day: string; startTime: string; endTime: string }>;
  status: string;
  attendance: number;
  zoomLink?: string;
}

const CLASS_COLORS = [
  '#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#84CC16'
];

export default function ClassesScreen() {
  const { hasActiveSubscription, isLoading: authLoading, authToken } = useAuth();
  const { selectedStudent } = useStudent();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClasses = useCallback(async () => {
    if (!selectedStudent?.studentId || !authToken) {
      setClasses([]);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const endpoints = getStudentEndpoints(selectedStudent.studentId);
      const response = await fetch(endpoints.classes, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setClasses(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch classes');
        setClasses([]);
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError('Failed to load classes. Please try again.');
      setClasses([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedStudent?.studentId, authToken]);

  useEffect(() => {
    if (hasActiveSubscription) {
      fetchClasses();
    }
  }, [fetchClasses, hasActiveSubscription]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchClasses();
    setRefreshing(false);
  };

  const getClassColor = (index: number) => {
    return CLASS_COLORS[index % CLASS_COLORS.length];
  };

  const formatSchedule = (schedule: Array<{ day: string; startTime: string; endTime: string }>) => {
    if (!schedule || schedule.length === 0) return 'No schedule';
    return schedule.map(s => `${s.day.slice(0, 3)} ${s.startTime}`).join(', ');
  };

  const handleClassPress = (classItem: ClassItem) => {
    router.push({
      pathname: '/class/[classId]',
      params: { 
        classId: classItem.id,
        className: classItem.name,
        subject: classItem.subject,
      },
    });
  };

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (!hasActiveSubscription) {
    return <Paywall />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Classes</Text>
          {selectedStudent && (
            <Text style={styles.studentIndicator}>{selectedStudent.studentName}</Text>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading classes...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchClasses}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {!selectedStudent ? (
            <View style={styles.emptyState}>
              <Ionicons name="person-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyStateTitle}>No Student Selected</Text>
              <Text style={styles.emptyStateText}>
                Please select a student from the Home tab
              </Text>
            </View>
          ) : classes.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="school-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyStateTitle}>No Classes Yet</Text>
              <Text style={styles.emptyStateText}>
                Classes will appear here once {selectedStudent.studentName} is enrolled
              </Text>
            </View>
          ) : (
            <>
              {/* Quick Stats */}
              <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{classes.length}</Text>
                  <Text style={styles.statLabel}>Total Classes</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>
                    {classes.filter(c => c.status === 'Active').length}
                  </Text>
                  <Text style={styles.statLabel}>Active</Text>
                </View>
              </View>

              {/* Class List */}
              {classes.map((classItem, index) => (
                <TouchableOpacity 
                  key={classItem.id} 
                  style={styles.classCard}
                  onPress={() => handleClassPress(classItem)}
                >
                  <View style={[styles.classAccent, { backgroundColor: getClassColor(index) }]} />
                  <View style={styles.classContent}>
                    <View style={styles.classHeader}>
                      <View style={styles.classInfo}>
                        <Text style={styles.className}>{classItem.name}</Text>
                        <Text style={styles.classSubject}>{classItem.subject}</Text>
                      </View>
                      <View style={[
                        styles.statusBadge, 
                        { backgroundColor: classItem.status === 'Active' ? '#DEF7EC' : '#FEE2E2' }
                      ]}>
                        <View style={[
                          styles.statusDot, 
                          { backgroundColor: classItem.status === 'Active' ? '#10B981' : '#EF4444' }
                        ]} />
                        <Text style={[
                          styles.statusText,
                          { color: classItem.status === 'Active' ? '#10B981' : '#EF4444' }
                        ]}>
                          {classItem.status}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.classDetails}>
                      <View style={styles.detailRow}>
                        <Ionicons name="person-outline" size={16} color="#6B7280" />
                        <Text style={styles.detailText}>{classItem.teacher}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Ionicons name="time-outline" size={16} color="#6B7280" />
                        <Text style={styles.detailText}>{formatSchedule(classItem.schedule)}</Text>
                      </View>
                      {classItem.attendance > 0 && (
                        <View style={styles.detailRow}>
                          <Ionicons name="checkmark-circle-outline" size={16} color="#6B7280" />
                          <Text style={styles.detailText}>
                            {classItem.attendance}% Attendance
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.classActions}>
                      <View style={styles.actionHint}>
                        <Text style={styles.actionHintText}>View Progress & Tests</Text>
                        <Ionicons name="chevron-forward" size={16} color="#6366F1" />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}
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
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
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
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6366F1',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
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
  classCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  classAccent: {
    width: 4,
  },
  classContent: {
    flex: 1,
    padding: 16,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  classSubject: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  classDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  classActions: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  actionHintText: {
    fontSize: 13,
    color: '#6366F1',
    fontWeight: '500',
  },
});
