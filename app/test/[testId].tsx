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

interface Answer {
  questionNumber: number;
  questionText: string;
  questionType: 'mcq' | 'essay';
  points: number;
  selectedOption?: number;
  correctOption?: number;
  options?: string[];
  isCorrect?: boolean;
  textAnswer?: string;
  pdfFiles?: Array<{ fileName: string; fileUrl: string }>;
  earnedPoints: number;
  feedback?: string;
}

interface Submission {
  id: string;
  status: string;
  totalScore: number;
  maxPossibleScore: number;
  percentage: number;
  mcqScore?: { earned: number; total: number };
  essayScore?: { earned: number; total: number };
  submittedAt: string;
  startTime?: string;
  endTime?: string;
  timeTaken?: number;
  answers: Answer[];
}

interface TestDetails {
  test: {
    id: string;
    title: string;
    description?: string;
    instructions?: string;
    type: string;
    status: string;
    totalQuestions: number;
    maxScore: number;
    duration?: number;
    scheduledFor?: string;
  };
  submission: Submission | null;
  hasSubmission: boolean;
}

export default function TestDetailScreen() {
  const params = useLocalSearchParams<{ testId: string; testTitle: string; classId: string }>();
  const { authToken } = useAuth();
  const { selectedStudent } = useStudent();
  const [testDetails, setTestDetails] = useState<TestDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

  const fetchTestDetails = useCallback(async () => {
    if (!selectedStudent?.studentId || !authToken || !params.testId) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const endpoints = getStudentEndpoints(selectedStudent.studentId);
      const response = await fetch(endpoints.testDetails(params.testId), {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setTestDetails(data.data);
      } else {
        setError(data.message || 'Failed to fetch test details');
      }
    } catch (err) {
      console.error('Error fetching test details:', err);
      setError('Failed to load test details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedStudent?.studentId, authToken, params.testId]);

  useEffect(() => {
    fetchTestDetails();
  }, [fetchTestDetails]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTestDetails();
    setRefreshing(false);
  };

  const toggleQuestion = (index: number) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedQuestions(newExpanded);
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return '#10B981';
    if (percentage >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading test details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !testDetails) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{params.testTitle || 'Test'}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error || 'Test not found'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchTestDetails}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { test, submission, hasSubmission } = testDetails;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{test.title}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Test Info Card */}
        <View style={styles.testInfoCard}>
          <View style={styles.testInfoHeader}>
            <View style={[
              styles.typeBadge,
              { backgroundColor: test.type === 'live' ? '#FEE2E2' : '#E0E7FF' }
            ]}>
              <Text style={[
                styles.typeBadgeText,
                { color: test.type === 'live' ? '#EF4444' : '#6366F1' }
              ]}>
                {test.type.toUpperCase()}
              </Text>
            </View>
            <View style={[
              styles.statusBadge,
              { backgroundColor: test.status === 'completed' ? '#DEF7EC' : '#FEF3C7' }
            ]}>
              <Text style={[
                styles.statusBadgeText,
                { color: test.status === 'completed' ? '#10B981' : '#F59E0B' }
              ]}>
                {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
              </Text>
            </View>
          </View>

          {test.description && (
            <Text style={styles.testDescription}>{test.description}</Text>
          )}

          <View style={styles.testMetaGrid}>
            <View style={styles.testMetaItem}>
              <Ionicons name="help-circle-outline" size={20} color="#6B7280" />
              <Text style={styles.testMetaValue}>{test.totalQuestions}</Text>
              <Text style={styles.testMetaLabel}>Questions</Text>
            </View>
            <View style={styles.testMetaItem}>
              <Ionicons name="star-outline" size={20} color="#6B7280" />
              <Text style={styles.testMetaValue}>{test.maxScore}</Text>
              <Text style={styles.testMetaLabel}>Max Score</Text>
            </View>
            <View style={styles.testMetaItem}>
              <Ionicons name="time-outline" size={20} color="#6B7280" />
              <Text style={styles.testMetaValue}>{test.duration || 'N/A'}</Text>
              <Text style={styles.testMetaLabel}>Minutes</Text>
            </View>
          </View>
        </View>

        {/* Submission Summary */}
        {hasSubmission && submission ? (
          <>
            <View style={styles.scoreCard}>
              <View style={styles.scoreHeader}>
                <Text style={styles.scoreTitle}>Your Score</Text>
                <Text style={styles.submittedDate}>
                  Submitted: {formatDate(submission.submittedAt)}
                </Text>
              </View>
              
              <View style={styles.scoreMainSection}>
                <View style={[
                  styles.scoreCircle,
                  { borderColor: getScoreColor(submission.percentage) }
                ]}>
                  <Text style={[
                    styles.scorePercent,
                    { color: getScoreColor(submission.percentage) }
                  ]}>
                    {submission.percentage}%
                  </Text>
                </View>
                <View style={styles.scoreDetails}>
                  <Text style={styles.scoreRatio}>
                    {submission.totalScore} / {submission.maxPossibleScore}
                  </Text>
                  <Text style={styles.scoreSubtext}>points earned</Text>
                  {submission.timeTaken && (
                    <Text style={styles.timeTaken}>
                      Time: {formatDuration(submission.timeTaken)}
                    </Text>
                  )}
                </View>
              </View>

              {/* Score Breakdown */}
              {(submission.mcqScore || submission.essayScore) && (
                <View style={styles.scoreBreakdown}>
                  {submission.mcqScore && (
                    <View style={styles.breakdownItem}>
                      <Text style={styles.breakdownLabel}>MCQ</Text>
                      <Text style={styles.breakdownValue}>
                        {submission.mcqScore.earned}/{submission.mcqScore.total}
                      </Text>
                    </View>
                  )}
                  {submission.essayScore && (
                    <View style={styles.breakdownItem}>
                      <Text style={styles.breakdownLabel}>Essay</Text>
                      <Text style={styles.breakdownValue}>
                        {submission.essayScore.earned}/{submission.essayScore.total}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Questions Review */}
            <Text style={styles.sectionTitle}>Questions Review</Text>
            {submission.answers?.map((answer, index) => (
              <TouchableOpacity
                key={index}
                style={styles.questionCard}
                onPress={() => toggleQuestion(index)}
                activeOpacity={0.7}
              >
                <View style={styles.questionHeader}>
                  <View style={styles.questionNumber}>
                    <Text style={styles.questionNumberText}>Q{answer.questionNumber}</Text>
                  </View>
                  <View style={styles.questionInfo}>
                    <Text style={styles.questionType}>
                      {answer.questionType.toUpperCase()}
                    </Text>
                    <View style={[
                      styles.questionResult,
                      { 
                        backgroundColor: answer.questionType === 'mcq' 
                          ? (answer.isCorrect ? '#DEF7EC' : '#FEE2E2')
                          : '#E0E7FF'
                      }
                    ]}>
                      <Text style={[
                        styles.questionResultText,
                        { 
                          color: answer.questionType === 'mcq'
                            ? (answer.isCorrect ? '#10B981' : '#EF4444')
                            : '#6366F1'
                        }
                      ]}>
                        {answer.earnedPoints}/{answer.points} pts
                      </Text>
                    </View>
                  </View>
                  <Ionicons 
                    name={expandedQuestions.has(index) ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color="#6B7280" 
                  />
                </View>

                {expandedQuestions.has(index) && (
                  <View style={styles.questionDetails}>
                    <Text style={styles.questionText}>{answer.questionText}</Text>
                    
                    {answer.questionType === 'mcq' && answer.options && (
                      <View style={styles.optionsContainer}>
                        {answer.options.map((option, optIndex) => (
                          <View 
                            key={optIndex}
                            style={[
                              styles.optionItem,
                              answer.selectedOption === optIndex && styles.selectedOption,
                              answer.correctOption === optIndex && styles.correctOption,
                            ]}
                          >
                            <View style={[
                              styles.optionBullet,
                              answer.selectedOption === optIndex && styles.selectedBullet,
                              answer.correctOption === optIndex && styles.correctBullet,
                            ]}>
                              <Text style={[
                                styles.optionBulletText,
                                (answer.selectedOption === optIndex || answer.correctOption === optIndex) && styles.whiteBulletText,
                              ]}>
                                {String.fromCharCode(65 + optIndex)}
                              </Text>
                            </View>
                            <Text style={styles.optionText}>{option}</Text>
                            {answer.correctOption === optIndex && (
                              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                            )}
                            {answer.selectedOption === optIndex && answer.selectedOption !== answer.correctOption && (
                              <Ionicons name="close-circle" size={18} color="#EF4444" />
                            )}
                          </View>
                        ))}
                      </View>
                    )}

                    {answer.questionType === 'essay' && (
                      <View style={styles.essayAnswer}>
                        <Text style={styles.answerLabel}>Your Answer:</Text>
                        <Text style={styles.answerText}>
                          {answer.textAnswer || 'No text answer provided'}
                        </Text>
                        {answer.pdfFiles && answer.pdfFiles.length > 0 && (
                          <View style={styles.attachments}>
                            <Text style={styles.attachmentLabel}>Attachments:</Text>
                            {answer.pdfFiles.map((file, fileIndex) => (
                              <View key={fileIndex} style={styles.attachmentItem}>
                                <Ionicons name="document-outline" size={16} color="#6366F1" />
                                <Text style={styles.attachmentName}>{file.fileName}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    )}

                    {answer.feedback && (
                      <View style={styles.feedbackBox}>
                        <Ionicons name="chatbox-outline" size={16} color="#6366F1" />
                        <Text style={styles.feedbackText}>{answer.feedback}</Text>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </>
        ) : (
          <View style={styles.noSubmissionCard}>
            <Ionicons name="document-outline" size={48} color="#9CA3AF" />
            <Text style={styles.noSubmissionTitle}>Not Submitted</Text>
            <Text style={styles.noSubmissionText}>
              This test has not been submitted yet
            </Text>
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
  scrollView: {
    flex: 1,
    padding: 16,
  },
  testInfoCard: {
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
  testInfoHeader: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  testDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  testMetaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  testMetaItem: {
    alignItems: 'center',
  },
  testMetaValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 4,
  },
  testMetaLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  scoreCard: {
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
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  submittedDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  scoreMainSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  scorePercent: {
    fontSize: 22,
    fontWeight: '700',
  },
  scoreDetails: {
    flex: 1,
  },
  scoreRatio: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  scoreSubtext: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  timeTaken: {
    fontSize: 13,
    color: '#6366F1',
    marginTop: 4,
  },
  scoreBreakdown: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 24,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  questionNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  questionNumberText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  questionInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  questionType: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  questionResult: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  questionResultText: {
    fontSize: 12,
    fontWeight: '600',
  },
  questionDetails: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  questionText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
    marginBottom: 12,
  },
  optionsContainer: {
    gap: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    gap: 10,
  },
  selectedOption: {
    backgroundColor: '#FEE2E2',
  },
  correctOption: {
    backgroundColor: '#DEF7EC',
  },
  optionBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedBullet: {
    backgroundColor: '#EF4444',
  },
  correctBullet: {
    backgroundColor: '#10B981',
  },
  optionBulletText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  whiteBulletText: {
    color: '#FFFFFF',
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  essayAnswer: {
    marginTop: 8,
  },
  answerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  answerText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  attachments: {
    marginTop: 12,
  },
  attachmentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  attachmentName: {
    fontSize: 13,
    color: '#6366F1',
  },
  feedbackBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  feedbackText: {
    flex: 1,
    fontSize: 13,
    color: '#4F46E5',
    lineHeight: 18,
  },
  noSubmissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  noSubmissionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
  },
  noSubmissionText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
});
