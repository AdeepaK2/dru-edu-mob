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
import Paywall from '@/components/Paywall';

interface ClassItem {
  id: string;
  name: string;
  teacher: string;
  schedule: string;
  room: string;
  color: string;
}

export default function ClassesScreen() {
  const { hasActiveSubscription, isLoading } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  // Mock data - replace with actual API call
  const classes: ClassItem[] = [
    {
      id: '1',
      name: 'Mathematics',
      teacher: 'Mr. Johnson',
      schedule: 'Mon, Wed, Fri - 9:00 AM',
      room: 'Room 101',
      color: '#6366F1',
    },
    {
      id: '2',
      name: 'English',
      teacher: 'Ms. Smith',
      schedule: 'Tue, Thu - 10:30 AM',
      room: 'Room 203',
      color: '#10B981',
    },
    {
      id: '3',
      name: 'Science',
      teacher: 'Dr. Williams',
      schedule: 'Mon, Wed - 1:00 PM',
      room: 'Lab 1',
      color: '#F59E0B',
    },
    {
      id: '4',
      name: 'History',
      teacher: 'Mrs. Brown',
      schedule: 'Tue, Thu - 2:30 PM',
      room: 'Room 105',
      color: '#EF4444',
    },
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    // Fetch classes from API
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Classes</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="filter-outline" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {classes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="school-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>No Classes Yet</Text>
            <Text style={styles.emptyStateText}>
              Classes will appear here once your child is enrolled
            </Text>
          </View>
        ) : (
          classes.map((classItem) => (
            <TouchableOpacity key={classItem.id} style={styles.classCard}>
              <View style={[styles.classAccent, { backgroundColor: classItem.color }]} />
              <View style={styles.classContent}>
                <View style={styles.classHeader}>
                  <Text style={styles.className}>{classItem.name}</Text>
                  <View style={[styles.liveBadge, { backgroundColor: `${classItem.color}20` }]}>
                    <View style={[styles.liveDot, { backgroundColor: classItem.color }]} />
                    <Text style={[styles.liveText, { color: classItem.color }]}>Active</Text>
                  </View>
                </View>
                <View style={styles.classDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="person-outline" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>{classItem.teacher}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>{classItem.schedule}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>{classItem.room}</Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
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
  filterBtn: {
    padding: 8,
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
  classCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
    height: '100%',
  },
  classContent: {
    flex: 1,
    padding: 16,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  className: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  liveText: {
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
});
