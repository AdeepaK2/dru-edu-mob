import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { PerformanceCard } from './PerformanceCard';
import { ClassSummaryCard } from './ClassSummaryCard';

export interface ClassSummary {
  classId: string;
  className: string;
  subject: string;
  avgTestScore: number;
  testCount: number;
  attendanceRate: number;
  totalClasses: number;
  present: number;
}

interface PerformanceOverviewProps {
  studentName: string;
  isLoading: boolean;
  classSummaries: ClassSummary[];
}

export function getPerformanceIndicator(score: number, type: 'score' | 'attendance') {
  if (type === 'score') {
    if (score >= 80) return { label: 'Excellent', color: '#10B981', icon: 'trending-up' as const };
    if (score >= 60) return { label: 'Good', color: '#F59E0B', icon: 'remove' as const };
    if (score > 0) return { label: 'Needs Improvement', color: '#EF4444', icon: 'trending-down' as const };
    return { label: 'No Data', color: '#9CA3AF', icon: 'remove' as const };
  } else {
    if (score >= 90) return { label: 'Excellent', color: '#10B981', icon: 'trending-up' as const };
    if (score >= 75) return { label: 'Good', color: '#F59E0B', icon: 'remove' as const };
    if (score > 0) return { label: 'Needs Improvement', color: '#EF4444', icon: 'trending-down' as const };
    return { label: 'No Data', color: '#9CA3AF', icon: 'remove' as const };
  }
}

export function PerformanceOverview({
  studentName,
  isLoading,
  classSummaries,
}: PerformanceOverviewProps) {
  // Calculate overall stats
  const getOverallStats = () => {
    if (classSummaries.length === 0) {
      return { avgScore: 0, avgAttendance: 0, totalTests: 0, totalClasses: 0 };
    }

    const totalTests = classSummaries.reduce((sum, c) => sum + c.testCount, 0);
    const avgScore =
      totalTests > 0
        ? classSummaries.reduce((sum, c) => sum + c.avgTestScore * c.testCount, 0) / totalTests
        : 0;
    const avgAttendance =
      classSummaries.reduce((sum, c) => sum + c.attendanceRate, 0) / classSummaries.length;

    return {
      avgScore: Math.round(avgScore),
      avgAttendance: Math.round(avgAttendance),
      totalTests,
      totalClasses: classSummaries.length,
    };
  };

  const handleClassPress = (classId: string, className: string, subject: string) => {
    router.push({
      pathname: '/class/[classId]',
      params: { classId, className, subject },
    });
  };

  const overallStats = getOverallStats();
  const scoreIndicator = getPerformanceIndicator(overallStats.avgScore, 'score');
  const attendanceIndicator = getPerformanceIndicator(overallStats.avgAttendance, 'attendance');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{studentName}&apos;s Performance</Text>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color="#6366F1" />
          <Text style={styles.loadingText}>Loading performance data...</Text>
        </View>
      ) : (
        <>
          {/* Overall Performance Cards */}
          <View style={styles.grid}>
            <PerformanceCard
              title="Test Scores"
              value={overallStats.totalTests > 0 ? `${overallStats.avgScore}%` : '-'}
              icon="school"
              iconColor="#6366F1"
              indicator={scoreIndicator}
              subtext={`${overallStats.totalTests} tests completed`}
            />
            <PerformanceCard
              title="Attendance"
              value={overallStats.avgAttendance > 0 ? `${overallStats.avgAttendance}%` : '-'}
              icon="calendar-outline"
              iconColor="#10B981"
              indicator={attendanceIndicator}
              subtext={`Across ${overallStats.totalClasses} classes`}
            />
          </View>

          {/* Class-wise Summary */}
          {classSummaries.length > 0 && (
            <View style={styles.summarySection}>
              <Text style={styles.summaryTitle}>Class-wise Summary</Text>
              {classSummaries.map((cls) => (
                <ClassSummaryCard
                  key={cls.classId}
                  className={cls.className}
                  subject={cls.subject}
                  avgTestScore={cls.avgTestScore}
                  testCount={cls.testCount}
                  attendanceRate={cls.attendanceRate}
                  present={cls.present}
                  totalClasses={cls.totalClasses}
                  scoreIndicator={getPerformanceIndicator(cls.avgTestScore, 'score')}
                  attendanceIndicator={getPerformanceIndicator(cls.attendanceRate, 'attendance')}
                  onPress={() => handleClassPress(cls.classId, cls.className, cls.subject)}
                />
              ))}
            </View>
          )}

          {/* No Classes State */}
          {classSummaries.length === 0 && !isLoading && (
            <View style={styles.noData}>
              <Ionicons name="school-outline" size={40} color="#9CA3AF" />
              <Text style={styles.noDataText}>No classes enrolled yet</Text>
              <Text style={styles.noDataSubtext}>
                Performance data will appear once {studentName} is enrolled in classes
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  loadingText: {
    marginLeft: 10,
    color: '#6B7280',
    fontSize: 14,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summarySection: {
    marginTop: 4,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  noData: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
  },
  noDataSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
});
