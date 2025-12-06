import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../src/contexts/NotificationContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { NotificationSettings } from '../src/services/notificationService';

interface SettingRowProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  textColor: string;
}

function SettingRow({
  label,
  description,
  value,
  onValueChange,
  disabled,
  textColor,
}: SettingRowProps) {
  return (
    <View style={[styles.settingRow, disabled && styles.disabled]}>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingLabel, { color: textColor }]}>{label}</Text>
        {description && (
          <Text style={styles.settingDescription}>{description}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
        thumbColor={value ? '#3B82F6' : '#9CA3AF'}
      />
    </View>
  );
}

export default function NotificationSettingsScreen() {
  const { settings, updateSettings } = useNotifications();
  const [localSettings, setLocalSettings] = useState<Partial<NotificationSettings>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({ light: '#E5E7EB', dark: '#374151' }, 'background');

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleChange = (key: keyof NotificationSettings, value: boolean) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings(localSettings);
      setHasChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  const allNotificationsEnabled = localSettings.enabled ?? true;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Notification Settings',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={textColor} />
            </TouchableOpacity>
          ),
          headerRight: () =>
            hasChanges ? (
              <TouchableOpacity onPress={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : (
                  <Text style={styles.saveButton}>Save</Text>
                )}
              </TouchableOpacity>
            ) : null,
        }}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Master Switch */}
        <View style={[styles.section, { borderBottomColor: borderColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>General</Text>
          <SettingRow
            label="Enable Notifications"
            description="Turn all notifications on or off"
            value={allNotificationsEnabled}
            onValueChange={(value) => handleChange('enabled', value)}
            textColor={textColor}
          />
        </View>

        {/* Notification Types */}
        <View style={[styles.section, { borderBottomColor: borderColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Notification Types
          </Text>
          <SettingRow
            label="Class Notifications"
            description="Updates about your classes"
            value={localSettings.classNotifications ?? true}
            onValueChange={(value) => handleChange('classNotifications', value)}
            disabled={!allNotificationsEnabled}
            textColor={textColor}
          />
          <SettingRow
            label="Test Notifications"
            description="Reminders about upcoming tests and results"
            value={localSettings.testNotifications ?? true}
            onValueChange={(value) => handleChange('testNotifications', value)}
            disabled={!allNotificationsEnabled}
            textColor={textColor}
          />
          <SettingRow
            label="Attendance Notifications"
            description="Daily attendance updates"
            value={localSettings.attendanceNotifications ?? true}
            onValueChange={(value) => handleChange('attendanceNotifications', value)}
            disabled={!allNotificationsEnabled}
            textColor={textColor}
          />
          <SettingRow
            label="Message Notifications"
            description="New messages from teachers"
            value={localSettings.messageNotifications ?? true}
            onValueChange={(value) => handleChange('messageNotifications', value)}
            disabled={!allNotificationsEnabled}
            textColor={textColor}
          />
          <SettingRow
            label="Announcement Notifications"
            description="School and class announcements"
            value={localSettings.announcementNotifications ?? true}
            onValueChange={(value) => handleChange('announcementNotifications', value)}
            disabled={!allNotificationsEnabled}
            textColor={textColor}
          />
          <SettingRow
            label="Reminder Notifications"
            description="Assignment and event reminders"
            value={localSettings.reminderNotifications ?? true}
            onValueChange={(value) => handleChange('reminderNotifications', value)}
            disabled={!allNotificationsEnabled}
            textColor={textColor}
          />
        </View>

        {/* Info Note */}
        <View style={styles.infoSection}>
          <Ionicons name="information-circle-outline" size={20} color="#9CA3AF" />
          <Text style={styles.infoText}>
            Changes will take effect immediately. Some notifications may still be
            delivered if they were already queued.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  saveButton: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  disabled: {
    opacity: 0.5,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
});
