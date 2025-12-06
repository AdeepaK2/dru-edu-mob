import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PerformanceCardProps {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  indicator: {
    label: string;
    color: string;
    icon: keyof typeof Ionicons.glyphMap;
  };
  subtext: string;
}

export function PerformanceCard({
  title,
  value,
  icon,
  iconColor,
  indicator,
  subtext,
}: PerformanceCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name={icon} size={20} color={iconColor} />
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
      <View style={[styles.indicatorBadge, { backgroundColor: `${indicator.color}20` }]}>
        <Ionicons name={indicator.icon} size={14} color={indicator.color} />
        <Text style={[styles.indicatorText, { color: indicator.color }]}>
          {indicator.label}
        </Text>
      </View>
      <Text style={styles.subtext}>{subtext}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 6,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  indicatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  indicatorText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  subtext: {
    fontSize: 11,
    color: '#9CA3AF',
  },
});
