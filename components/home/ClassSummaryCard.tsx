import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ClassSummaryCardProps {
  className: string;
  subject: string;
  avgTestScore: number;
  testCount: number;
  attendanceRate: number;
  present: number;
  totalClasses: number;
  scoreIndicator: {
    label: string;
    color: string;
    icon: keyof typeof Ionicons.glyphMap;
  };
  attendanceIndicator: {
    label: string;
    color: string;
    icon: keyof typeof Ionicons.glyphMap;
  };
  onPress: () => void;
}

export function ClassSummaryCard({
  className,
  subject,
  avgTestScore,
  testCount,
  attendanceRate,
  present,
  totalClasses,
  scoreIndicator,
  attendanceIndicator,
  onPress,
}: ClassSummaryCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View>
          <Text style={styles.name}>{className}</Text>
          <Text style={styles.subject}>{subject}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Tests:</Text>
            <Text style={[styles.statValue, { color: scoreIndicator.color }]}>
              {testCount > 0 ? `${avgTestScore}%` : '-'}
            </Text>
            <Ionicons name={scoreIndicator.icon} size={16} color={scoreIndicator.color} />
          </View>
          <Text style={styles.statSubtext}>{testCount} completed</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.stat}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Attendance:</Text>
            <Text style={[styles.statValue, { color: attendanceIndicator.color }]}>
              {attendanceRate > 0 ? `${Math.round(attendanceRate)}%` : '-'}
            </Text>
            <Ionicons name={attendanceIndicator.icon} size={16} color={attendanceIndicator.color} />
          </View>
          <Text style={styles.statSubtext}>{present}/{totalClasses} classes</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  subject: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  stats: {
    flexDirection: 'row',
  },
  stat: {
    flex: 1,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  statSubtext: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  divider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
});
