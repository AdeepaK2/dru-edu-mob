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
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/src/contexts/AuthContext';
import { useStudent } from '@/src/contexts/StudentContext';
import { getStudentEndpoints } from '@/src/config/api';

interface TestItem {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  totalQuestions: number;
  duration?: number;
  scheduledFor?: string;
  submission?: {
    id: string;
    status: string;
    totalScore: number;
    maxPossibleScore: number;
    percentage: number;
    submittedAt: string;
  };
}

interface AttendanceStats {
  totalClasses: number;
  present: number;
  absent: number;
  late: number;
  attendanceRate: number;
}

interface ClassDetails {
  class: {
    id: string;
    classId: string;
    name: string;
    subject: string;
    teacher: string;
    year: string;
    schedule: Array<{ day: string; startTime: string; endTime: string }>;
    zoomLink?: string;
  };
  enrollment: {
    enrolledAt: string;
    status: string;
  };
  tests: TestItem[];
  attendanceStats: AttendanceStats;
  attendanceRecords: Array<{
    id: string;
    date: string;
    topic?: string;
    status: string;
    mode: string;
  }>;
}

type TabType = 'overview' | 'tests' | 'attendance';

export default function ClassDetailScreen() {
  const params = useLocalSearchParams<{ classId: string; className: string; subject: string }>();
  const { authToken } = useAuth();
  const { selectedStudent } = useStudent();
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const fetchClassDetails = useCallback(async () => {
    if (!selectedStudent?.studentId || !authToken || !params.classId) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const endpoints = getStudentEndpoints(selectedStudent.studentId);
      const response = await fetch(endpoints.classDetails(params.classId), {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setClassDetails(data.data);
      } else {
        setError(data.message || 'Failed to fetch class details');
      }
    } catch (err) {
      console.error('Error fetching class details:', err);
      setError('Failed to load class details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedStudent?.studentId, authToken, params.classId]);

  useEffect(() => {
    fetchClassDetails();
  }, [fetchClassDetails]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchClassDetails();
    setRefreshing(false);
  };

  const handleTestPress = (test: TestItem) => {
    router.push({
      pathname: '/test/[testId]',
      params: {
        testId: test.id,
        testTitle: test.title,
        classId: params.classId,
      },
    });
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return '#10B981';
    if (percentage >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const getAttendanceColor = (status: string) => {
    switch (status) {
      case 'present': return '#10B981';
      case 'late': return '#F59E0B';
      case 'absent': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading class details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !classDetails) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{params.className || 'Class'}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error || 'Class not found'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchClassDetails}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{classDetails.class.name}</Text>
          <Text style={styles.headerSubtitle}>{classDetails.class.subject}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(['overview', 'tests', 'attendance'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <View style={styles.tabContent}>
            {/* Performance Summary Card */}
            <View style={styles.performanceCard}>
              <Text style={styles.performanceTitle}>Performance Overview</Text>
              <View style={styles.performanceGrid}>
                <View style={styles.performanceItem}>
                  <Text style={styles.performanceValue}>
                    {classDetails.tests.length > 0 
                      ? Math.round(
                          classDetails.tests
                            .filter(t => t.submission)
                            .reduce((sum, t) => sum + (t.submission?.percentage || 0), 0) / 
                          Math.max(classDetails.tests.filter(t => t.submission).length, 1)
                        )
                      : 0}%
                  </Text>
                  <Text style={styles.performanceLabel}>Average Score</Text>
                </View>
                <View style={styles.performanceDivider} />
                <View style={styles.performanceItem}>
                  <Text style={styles.performanceValue}>
                    {classDetails.tests.filter(t => t.submission).length}/{classDetails.tests.length}
                  </Text>
                  <Text style={styles.performanceLabel}>Tests Completed</Text>
                </View>
                <View style={styles.performanceDivider} />
                <View style={styles.performanceItem}>
                  <Text style={styles.performanceValue}>{classDetails.attendanceStats.attendanceRate}%</Text>
                  <Text style={styles.performanceLabel}>Attendance</Text>
                </View>
              </View>
            </View>

            {/* Quick Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <View style={[styles.statIcon, { backgroundColor: '#DEF7EC' }]}>
                  <Ionicons name="checkmark-circle-outline" size={24} color="#10B981" />
                </View>
                <Text style={styles.statNumber}>{classDetails.attendanceStats.present}</Text>
                <Text style={styles.statLabel}>Classes Present</Text>
              </View>
              <View style={styles.statBox}>
                <View style={[styles.statIcon, { backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="close-circle-outline" size={24} color="#EF4444" />
                </View>
                <Text style={styles.statNumber}>{classDetails.attendanceStats.absent}</Text>
                <Text style={styles.statLabel}>Classes Absent</Text>
              </View>
              <View style={styles.statBox}>
                <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="time-outline" size={24} color="#F59E0B" />
                </View>
                <Text style={styles.statNumber}>{classDetails.attendanceStats.late}</Text>
                <Text style={styles.statLabel}>Late</Text>
              </View>
              <View style={styles.statBox}>
                <View style={[styles.statIcon, { backgroundColor: '#EEF2FF' }]}>
                  <Ionicons name="document-text-outline" size={24} color="#6366F1" />
                </View>
                <Text style={styles.statNumber}>
                  {classDetails.tests.filter(t => !t.submission && t.status !== 'completed').length}
                </Text>
                <Text style={styles.statLabel}>Pending Tests</Text>
              </View>
            </View>

            {/* Class Info Summary */}
            <View style={styles.infoSummary}>
              <View style={styles.infoSummaryRow}>
                <Ionicons name="person-outline" size={16} color="#6B7280" />
                <Text style={styles.infoSummaryText}>Teacher: {classDetails.class.teacher}</Text>
              </View>
              <View style={styles.infoSummaryRow}>
                <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                <Text style={styles.infoSummaryText}>Year: {classDetails.class.year}</Text>
              </View>
              {classDetails.class.schedule?.length > 0 && (
                <View style={styles.infoSummaryRow}>
                  <Ionicons name="time-outline" size={16} color="#6B7280" />
                  <Text style={styles.infoSummaryText}>
                    {classDetails.class.schedule.map(s => `${s.day} ${s.startTime}-${s.endTime}`).join(', ')}
                  </Text>
                </View>
              )}
            </View>

            {/* Recent Tests Preview */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Tests</Text>
                <TouchableOpacity onPress={() => setActiveTab('tests')}>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              {classDetails.tests.slice(0, 3).map((test) => (
                <TouchableOpacity
                  key={test.id}
                  style={styles.testPreviewItem}
                  onPress={() => handleTestPress(test)}
                >
                  <View style={styles.testPreviewInfo}>
                    <Text style={styles.testPreviewTitle}>{test.title}</Text>
                    <Text style={styles.testPreviewMeta}>
                      {test.totalQuestions} questions • {test.type}
                    </Text>
                  </View>
                  {test.submission ? (
                    <View style={[
                      styles.scoreBadge,
                      { backgroundColor: `${getScoreColor(test.submission.percentage)}20` }
                    ]}>
                      <Text style={[
                        styles.scoreText,
                        { color: getScoreColor(test.submission.percentage) }
                      ]}>
                        {test.submission.percentage}%
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingText}>Pending</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
              {classDetails.tests.length === 0 && (
                <Text style={styles.emptyText}>No tests yet</Text>
              )}
            </View>
          </View>
        )}

        {/* Tests Tab */}
        {activeTab === 'tests' && (
          <View style={styles.tabContent}>
            {classDetails.tests.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyStateTitle}>No Tests Yet</Text>
                <Text style={styles.emptyStateText}>
                  Tests will appear here when assigned
                </Text>
              </View>
            ) : (
              classDetails.tests.map((test) => (
                <TouchableOpacity
                  key={test.id}
                  style={styles.testCard}
                  onPress={() => handleTestPress(test)}
                >
                  <View style={styles.testCardHeader}>
                    <View style={styles.testInfo}>
                      <Text style={styles.testTitle}>{test.title}</Text>
                      {test.description && (
                        <Text style={styles.testDescription} numberOfLines={2}>
                          {test.description}
                        </Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </View>
                  
                  <View style={styles.testMeta}>
                    <View style={styles.testMetaItem}>
                      <Ionicons name="help-circle-outline" size={16} color="#6B7280" />
                      <Text style={styles.testMetaText}>{test.totalQuestions} questions</Text>
                    </View>
                    <View style={styles.testMetaItem}>
                      <Ionicons name="time-outline" size={16} color="#6B7280" />
                      <Text style={styles.testMetaText}>{test.duration || 'N/A'} min</Text>
                    </View>
                    <View style={[
                      styles.testTypeBadge,
                      { backgroundColor: test.type === 'live' ? '#FEE2E2' : '#E0E7FF' }
                    ]}>
                      <Text style={[
                        styles.testTypeText,
                        { color: test.type === 'live' ? '#EF4444' : '#6366F1' }
                      ]}>
                        {test.type}
                      </Text>
                    </View>
                  </View>

                  {test.submission ? (
                    <View style={styles.submissionInfo}>
                      <View style={styles.scoreSection}>
                        <Text style={styles.scoreLabel}>Score</Text>
                        <Text style={[styles.scoreLarge, { color: getScoreColor(test.submission.percentage) }]}>
                          {test.submission.totalScore}/{test.submission.maxPossibleScore}
                        </Text>
                        <Text style={[styles.percentageText, { color: getScoreColor(test.submission.percentage) }]}>
                          ({test.submission.percentage}%)
                        </Text>
                      </View>
                      <Text style={styles.submittedAt}>
                        Submitted: {formatDate(test.submission.submittedAt)}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.notSubmitted}>
                      <Ionicons name="alert-circle-outline" size={16} color="#F59E0B" />
                      <Text style={styles.notSubmittedText}>Not submitted yet</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <View style={styles.tabContent}>
            {/* Attendance Summary */}
            <View style={styles.attendanceSummary}>
              <View style={styles.attendanceCircle}>
                <Text style={styles.attendancePercent}>
                  {classDetails.attendanceStats.attendanceRate}%
                </Text>
                <Text style={styles.attendanceLabel}>Attendance Rate</Text>
              </View>
              <View style={styles.attendanceBreakdown}>
                <View style={styles.breakdownItem}>
                  <View style={[styles.breakdownDot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.breakdownText}>Present: {classDetails.attendanceStats.present}</Text>
                </View>
                <View style={styles.breakdownItem}>
                  <View style={[styles.breakdownDot, { backgroundColor: '#F59E0B' }]} />
                  <Text style={styles.breakdownText}>Late: {classDetails.attendanceStats.late}</Text>
                </View>
                <View style={styles.breakdownItem}>
                  <View style={[styles.breakdownDot, { backgroundColor: '#EF4444' }]} />
                  <Text style={styles.breakdownText}>Absent: {classDetails.attendanceStats.absent}</Text>
                </View>
              </View>
            </View>

            {/* Attendance Records */}
            <Text style={styles.sectionTitle}>Recent Classes</Text>
            {classDetails.attendanceRecords.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyStateTitle}>No Records Yet</Text>
                <Text style={styles.emptyStateText}>
                  Attendance records will appear here
                </Text>
              </View>
            ) : (
              classDetails.attendanceRecords.map((record) => (
                <View key={record.id} style={styles.attendanceRecord}>
                  <View style={styles.recordDate}>
                    <Text style={styles.recordDateText}>{formatDate(record.date)}</Text>
                    <Text style={styles.recordMode}>{record.mode}</Text>
                  </View>
                  <View style={styles.recordInfo}>
                    {record.topic && (
                      <Text style={styles.recordTopic} numberOfLines={1}>{record.topic}</Text>
                    )}
                  </View>
                  <View style={[
                    styles.attendanceStatus,
                    { backgroundColor: `${getAttendanceColor(record.status)}20` }
                  ]}>
                    <Text style={[
                      styles.attendanceStatusText,
                      { color: getAttendanceColor(record.status) }
                    ]}>
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#EEF2FF',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#6366F1',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  performanceCard: {
    backgroundColor: '#6366F1',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  performanceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
  },
  performanceGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  performanceItem: {
    alignItems: 'center',
  },
  performanceValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  performanceLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  performanceDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  infoSummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  infoSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoSummaryText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    width: 70,
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    width: '47%',
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
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '500',
  },
  testPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  testPreviewInfo: {
    flex: 1,
  },
  testPreviewTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  testPreviewMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  scoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  testCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  testCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  testInfo: {
    flex: 1,
  },
  testTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  testDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  testMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 16,
  },
  testMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  testMetaText: {
    fontSize: 13,
    color: '#6B7280',
  },
  testTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  testTypeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  submissionInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  scoreLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  scoreLarge: {
    fontSize: 20,
    fontWeight: '700',
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '600',
  },
  submittedAt: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  notSubmitted: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 6,
  },
  notSubmittedText: {
    fontSize: 13,
    color: '#F59E0B',
  },
  attendanceSummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  attendanceCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  attendancePercent: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6366F1',
  },
  attendanceLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  attendanceBreakdown: {
    flex: 1,
    gap: 8,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breakdownDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  breakdownText: {
    fontSize: 14,
    color: '#1F2937',
  },
  attendanceRecord: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  recordDate: {
    width: 90,
  },
  recordDateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  recordMode: {
    fontSize: 11,
    color: '#6B7280',
    textTransform: 'capitalize',
    marginTop: 2,
  },
  recordInfo: {
    flex: 1,
    paddingHorizontal: 12,
  },
  recordTopic: {
    fontSize: 13,
    color: '#6B7280',
  },
  attendanceStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  attendanceStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
