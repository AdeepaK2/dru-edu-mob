import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/contexts/AuthContext';
import { useStudent, Student } from '@/src/contexts/StudentContext';
import Paywall from '@/components/Paywall';

export default function HomeScreen() {
  const { user, hasActiveSubscription, subscription, refreshSubscription, isLoading } = useAuth();
  const { students, selectedStudent, setSelectedStudent, hasMultipleStudents } = useStudent();
  const [refreshing, setRefreshing] = useState(false);
  const [showStudentPicker, setShowStudentPicker] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshSubscription();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Logo */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <Image 
              source={require('@/assets/images/Logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={styles.brandText}>
              <Text style={styles.brandName}>DRU EDU</Text>
              <Text style={styles.brandTagline}>Parent Portal</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={24} color="#1F2937" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        {/* Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.userName}>{user?.name || 'Parent'}</Text>
        </View>

        {/* Student Switcher (only if multiple students) */}
        {hasMultipleStudents && selectedStudent && (
          <TouchableOpacity 
            style={styles.studentSwitcher}
            onPress={() => setShowStudentPicker(true)}
          >
            <View style={styles.studentSwitcherLeft}>
              <View style={styles.selectedStudentAvatar}>
                <Text style={styles.selectedStudentAvatarText}>
                  {selectedStudent.studentName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.selectedStudentInfo}>
                <Text style={styles.selectedStudentLabel}>Currently viewing</Text>
                <Text style={styles.selectedStudentName}>{selectedStudent.studentName}</Text>
              </View>
            </View>
            <View style={styles.switcherButton}>
              <Text style={styles.switcherButtonText}>Switch</Text>
              <Ionicons name="chevron-down" size={16} color="#6366F1" />
            </View>
          </TouchableOpacity>
        )}

        {/* Single Student Display (if only one student) */}
        {!hasMultipleStudents && selectedStudent && (
          <View style={styles.singleStudentCard}>
            <View style={styles.selectedStudentAvatar}>
              <Text style={styles.selectedStudentAvatarText}>
                {selectedStudent.studentName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.selectedStudentInfo}>
              <Text style={styles.selectedStudentLabel}>Your Student</Text>
              <Text style={styles.selectedStudentName}>{selectedStudent.studentName}</Text>
            </View>
          </View>
        )}

        {/* Subscription Status Card */}
        <View style={styles.subscriptionCard}>
          <View style={styles.subscriptionHeader}>
            <View style={styles.subscriptionBadge}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text style={styles.subscriptionBadgeText}>Active</Text>
            </View>
            <Text style={styles.subscriptionPlan}>Yearly Plan</Text>
          </View>
          <View style={styles.subscriptionDetails}>
            <View style={styles.subscriptionDetailItem}>
              <Text style={styles.subscriptionDetailLabel}>Students</Text>
              <Text style={styles.subscriptionDetailValue}>{students.length}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.subscriptionDetailItem}>
              <Text style={styles.subscriptionDetailLabel}>Expires</Text>
              <Text style={styles.subscriptionDetailValue}>
                {formatExpiryDate(subscription?.expiryDate)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.subscriptionDetailItem}>
              <Text style={styles.subscriptionDetailLabel}>Days Left</Text>
              <Text style={styles.subscriptionDetailValue}>
                {subscription?.daysRemaining || '-'}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Stats for Selected Student */}
        {selectedStudent && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {selectedStudent.studentName}'s Overview
            </Text>
            <View style={styles.statsContainer}>
              <View style={[styles.statCard, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="book" size={24} color="#6366F1" />
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Assignments</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="trophy" size={24} color="#F59E0B" />
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Grades</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="calendar" size={24} color="#10B981" />
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Events</Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="person-add" size={22} color="#6366F1" />
              </View>
              <Text style={styles.actionText}>Add Student</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="document-text" size={22} color="#F59E0B" />
              </View>
              <Text style={styles.actionText}>View Reports</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="chatbubbles" size={22} color="#10B981" />
              </View>
              <Text style={styles.actionText}>Messages</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: '#FCE7F3' }]}>
                <Ionicons name="calendar" size={22} color="#EC4899" />
              </View>
              <Text style={styles.actionText}>Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* All Students Section */}
        {students.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Students</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllBtn}>Manage</Text>
              </TouchableOpacity>
            </View>
            {students.map((student) => (
              <TouchableOpacity 
                key={student.studentId} 
                style={[
                  styles.studentCard,
                  selectedStudent?.studentId === student.studentId && styles.studentCardSelected
                ]}
                onPress={() => hasMultipleStudents && setSelectedStudent(student)}
              >
                <View style={[
                  styles.studentAvatar,
                  selectedStudent?.studentId === student.studentId && styles.studentAvatarSelected
                ]}>
                  <Text style={styles.studentAvatarText}>
                    {student.studentName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{student.studentName}</Text>
                  {student.studentEmail && (
                    <Text style={styles.studentEmail}>{student.studentEmail}</Text>
                  )}
                </View>
                {selectedStudent?.studentId === student.studentId && (
                  <View style={styles.selectedBadge}>
                    <Ionicons name="checkmark-circle" size={20} color="#6366F1" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* No Students State */}
        {students.length === 0 && (
          <View style={styles.section}>
            <View style={styles.emptyState}>
              <Ionicons name="person-add-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No students linked yet</Text>
              <TouchableOpacity style={styles.addStudentBtn}>
                <Text style={styles.addStudentBtnText}>Link a Student</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Student Picker Modal */}
      <Modal
        visible={showStudentPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStudentPicker(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowStudentPicker(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Switch Student</Text>
              <TouchableOpacity onPress={() => setShowStudentPicker(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {students.map((student) => (
                <TouchableOpacity
                  key={student.studentId}
                  style={[
                    styles.modalStudentItem,
                    selectedStudent?.studentId === student.studentId && styles.modalStudentItemSelected
                  ]}
                  onPress={() => handleSelectStudent(student)}
                >
                  <View style={[
                    styles.modalStudentAvatar,
                    selectedStudent?.studentId === student.studentId && styles.modalStudentAvatarSelected
                  ]}>
                    <Text style={styles.modalStudentAvatarText}>
                      {student.studentName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.modalStudentInfo}>
                    <Text style={styles.modalStudentName}>{student.studentName}</Text>
                    {student.studentEmail && (
                      <Text style={styles.modalStudentEmail}>{student.studentEmail}</Text>
                    )}
                  </View>
                  {selectedStudent?.studentId === student.studentId && (
                    <Ionicons name="checkmark-circle" size={24} color="#6366F1" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  brandText: {
    marginLeft: 12,
  },
  brandName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 0.5,
  },
  brandTagline: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  notificationBtn: {
    position: 'relative',
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  greetingSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  greeting: {
    fontSize: 14,
    color: '#6B7280',
  },
  userName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 2,
  },
  studentSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 2,
    borderColor: '#E0E7FF',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  studentSwitcherLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  singleStudentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  selectedStudentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedStudentAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  selectedStudentInfo: {
    marginLeft: 12,
    flex: 1,
  },
  selectedStudentLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  selectedStudentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 2,
  },
  switcherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  switcherButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
    marginRight: 4,
  },
  subscriptionCard: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  subscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  subscriptionBadgeText: {
    marginLeft: 5,
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
  },
  subscriptionPlan: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  subscriptionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subscriptionDetailItem: {
    flex: 1,
    alignItems: 'center',
  },
  subscriptionDetailLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  subscriptionDetailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E7EB',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  seeAllBtn: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1F2937',
  },
  studentCard: {
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
  studentCardSelected: {
    borderWidth: 2,
    borderColor: '#6366F1',
    backgroundColor: '#FAFBFF',
  },
  studentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentAvatarSelected: {
    backgroundColor: '#6366F1',
  },
  studentAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  studentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  studentEmail: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  selectedBadge: {
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 16,
  },
  addStudentBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  addStudentBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalList: {
    padding: 16,
  },
  modalStudentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  modalStudentItemSelected: {
    backgroundColor: '#EEF2FF',
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  modalStudentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalStudentAvatarSelected: {
    backgroundColor: '#6366F1',
  },
  modalStudentAvatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalStudentInfo: {
    flex: 1,
    marginLeft: 14,
  },
  modalStudentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalStudentEmail: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
});
