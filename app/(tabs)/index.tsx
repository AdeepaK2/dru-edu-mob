import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/contexts/AuthContext';
import { useStudent, Student } from '@/src/contexts/StudentContext';
import { getStudentEndpoints } from '@/src/config/api';
import Paywall from '@/components/Paywall';
import {
  HomeHeader,
  SubscriptionCard,
  StudentSwitcher,
  SingleStudentCard,
  PerformanceOverview,
  QuickActions,
  StudentList,
  StudentPickerModal,
  ClassSummary,
} from '@/components/home';

interface ClassItem {
  id: string;
  classId: string;
  name: string;
  subject: string;
  teacher: string;
  year: string;
  status: string;
  attendance: number;
}

export default function HomeScreen() {
  const { user, hasActiveSubscription, subscription, refreshSubscription, isLoading, authToken } = useAuth();
  const { students, selectedStudent, setSelectedStudent, hasMultipleStudents } = useStudent();
  const [refreshing, setRefreshing] = useState(false);
  const [showStudentPicker, setShowStudentPicker] = useState(false);
  const [classesLoading, setClassesLoading] = useState(false);
  const [classSummaries, setClassSummaries] = useState<ClassSummary[]>([]);

  const fetchClassesData = useCallback(async () => {
    if (!selectedStudent?.studentId || !authToken) {
      setClassSummaries([]);
      return;
    }

    try {
      setClassesLoading(true);
      const endpoints = getStudentEndpoints(selectedStudent.studentId);

      // Fetch classes list
      const classesResponse = await fetch(endpoints.classes, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const classesData = await classesResponse.json();

      if (!classesData.success || !classesData.data) {
        setClassSummaries([]);
        return;
      }

      const classes: ClassItem[] = classesData.data;

      // Fetch details for each class to get test scores and attendance
      const summaries: ClassSummary[] = await Promise.all(
        classes.map(async (cls) => {
          try {
            const detailResponse = await fetch(endpoints.classDetails(cls.id), {
              headers: { Authorization: `Bearer ${authToken}` },
            });
            const detailData = await detailResponse.json();

            if (detailData.success && detailData.data) {
              const tests = detailData.data.tests || [];
              const attendance = detailData.data.attendanceStats || {};

              // Calculate average test score from completed tests
              const completedTests = tests.filter(
                (t: { submission?: { percentage: number } }) => t.submission?.percentage !== undefined
              );
              const avgScore =
                completedTests.length > 0
                  ? completedTests.reduce(
                      (sum: number, t: { submission: { percentage: number } }) =>
                        sum + t.submission.percentage,
                      0
                    ) / completedTests.length
                  : 0;

              return {
                classId: cls.id,
                className: cls.name,
                subject: cls.subject,
                avgTestScore: Math.round(avgScore),
                testCount: completedTests.length,
                attendanceRate: attendance.attendanceRate || cls.attendance || 0,
                totalClasses: attendance.totalClasses || 0,
                present: attendance.present || 0,
              };
            }

            return {
              classId: cls.id,
              className: cls.name,
              subject: cls.subject,
              avgTestScore: 0,
              testCount: 0,
              attendanceRate: cls.attendance || 0,
              totalClasses: 0,
              present: 0,
            };
          } catch {
            return {
              classId: cls.id,
              className: cls.name,
              subject: cls.subject,
              avgTestScore: 0,
              testCount: 0,
              attendanceRate: cls.attendance || 0,
              totalClasses: 0,
              present: 0,
            };
          }
        })
      );

      setClassSummaries(summaries);
    } catch (err) {
      console.error('Error fetching classes data:', err);
      setClassSummaries([]);
    } finally {
      setClassesLoading(false);
    }
  }, [selectedStudent?.studentId, authToken]);

  useEffect(() => {
    if (hasActiveSubscription && selectedStudent) {
      fetchClassesData();
    }
  }, [fetchClassesData, hasActiveSubscription, selectedStudent]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshSubscription(), fetchClassesData()]);
    setRefreshing(false);
  };

  const formatExpiryDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowStudentPicker(false);
  };

  if (isLoading) {
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Logo and Greeting */}
        <HomeHeader userName={user?.name || 'Parent'} />

        {/* Student Switcher */}
        {hasMultipleStudents && selectedStudent && (
          <StudentSwitcher student={selectedStudent} onPress={() => setShowStudentPicker(true)} />
        )}

        {/* Single Student Display */}
        {!hasMultipleStudents && selectedStudent && <SingleStudentCard student={selectedStudent} />}

        {/* Subscription Status */}
        <SubscriptionCard
          studentCount={students.length}
          expiryDate={formatExpiryDate(subscription?.expiryDate)}
          daysRemaining={subscription?.daysRemaining || '-'}
        />

        {/* Performance Overview */}
        {selectedStudent && (
          <PerformanceOverview
            studentName={selectedStudent.studentName}
            isLoading={classesLoading}
            classSummaries={classSummaries}
          />
        )}

        {/* Quick Actions */}
        <QuickActions />

        {/* My Students */}
        <StudentList
          students={students}
          selectedStudentId={selectedStudent?.studentId}
          hasMultipleStudents={hasMultipleStudents}
          onSelectStudent={setSelectedStudent}
        />

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Student Picker Modal */}
      <StudentPickerModal
        visible={showStudentPicker}
        students={students}
        selectedStudentId={selectedStudent?.studentId}
        onSelect={handleSelectStudent}
        onClose={() => setShowStudentPicker(false)}
      />
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
  scrollView: {
    flex: 1,
  },
});
