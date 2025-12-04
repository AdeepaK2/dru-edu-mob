import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/contexts/AuthContext';
import { useStudent } from '@/src/contexts/StudentContext';
import Paywall from '@/components/Paywall';

interface Message {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
  avatar: string;
}

export default function MessagesScreen() {
  const { hasActiveSubscription, isLoading } = useAuth();
  const { selectedStudent } = useStudent();
  const [refreshing, setRefreshing] = React.useState(false);

  // Mock data - replace with actual API call
  const messages: Message[] = [
    {
      id: '1',
      sender: 'Mr. Johnson',
      subject: 'Math Assignment Update',
      preview: 'The deadline for the algebra assignment has been extended to...',
      time: '10:30 AM',
      unread: true,
      avatar: 'J',
    },
    {
      id: '2',
      sender: 'School Admin',
      subject: 'Parent-Teacher Meeting',
      preview: 'We would like to invite you to the upcoming parent-teacher...',
      time: 'Yesterday',
      unread: true,
      avatar: 'A',
    },
    {
      id: '3',
      sender: 'Ms. Smith',
      subject: 'English Project Submission',
      preview: 'Your child has successfully submitted the English project...',
      time: 'Mon',
      unread: false,
      avatar: 'S',
    },
    {
      id: '4',
      sender: 'Dr. Williams',
      subject: 'Science Fair',
      preview: 'Congratulations! Your child has been selected for the...',
      time: 'Dec 1',
      unread: false,
      avatar: 'W',
    },
  ];

  const unreadCount = messages.filter(m => m.unread).length;

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
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
          <Text style={styles.headerTitle}>Messages</Text>
          {selectedStudent ? (
            <Text style={styles.studentIndicator}>{selectedStudent.studentName}</Text>
          ) : unreadCount > 0 ? (
            <Text style={styles.unreadCount}>{unreadCount} unread</Text>
          ) : null}
        </View>
        <TouchableOpacity style={styles.composeBtn}>
          <Ionicons name="create-outline" size={24} color="#6366F1" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="mail-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>No Messages</Text>
            <Text style={styles.emptyStateText}>
              Messages from teachers will appear here
            </Text>
          </View>
        ) : (
          messages.map((message) => (
            <TouchableOpacity 
              key={message.id} 
              style={[styles.messageCard, message.unread && styles.unreadCard]}
            >
              <View style={[styles.avatar, message.unread && styles.unreadAvatar]}>
                <Text style={styles.avatarText}>{message.avatar}</Text>
              </View>
              <View style={styles.messageContent}>
                <View style={styles.messageHeader}>
                  <Text style={[styles.sender, message.unread && styles.unreadText]}>
                    {message.sender}
                  </Text>
                  <Text style={styles.time}>{message.time}</Text>
                </View>
                <Text style={[styles.subject, message.unread && styles.unreadText]} numberOfLines={1}>
                  {message.subject}
                </Text>
                <Text style={styles.preview} numberOfLines={1}>
                  {message.preview}
                </Text>
              </View>
              {message.unread && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          ))
        )}

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
  unreadCount: {
    fontSize: 14,
    color: '#6366F1',
    marginTop: 2,
  },
  composeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
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
  },
  messageCard: {
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
  unreadCard: {
    backgroundColor: '#FAFBFF',
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadAvatar: {
    backgroundColor: '#6366F1',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  messageContent: {
    flex: 1,
    marginLeft: 12,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sender: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  unreadText: {
    fontWeight: '600',
  },
  time: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  subject: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 2,
  },
  preview: {
    fontSize: 13,
    color: '#6B7280',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6366F1',
    marginLeft: 8,
  },
});
