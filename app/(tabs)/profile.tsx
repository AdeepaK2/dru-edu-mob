import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/contexts/AuthContext';
import { useStudent } from '@/src/contexts/StudentContext';
import Paywall from '@/components/Paywall';

interface MenuItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  showArrow?: boolean;
  dangerous?: boolean;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, hasActiveSubscription, isLoading, logout } = useAuth();
  const { students, selectedStudent } = useStudent();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Account',
      items: [
        {
          id: 'edit-profile',
          icon: 'person-outline',
          label: 'Edit Profile',
          showArrow: true,
        },
        {
          id: 'students',
          icon: 'people-outline',
          label: 'My Students',
          subtitle: `${students.length} student${students.length !== 1 ? 's' : ''}`,
          showArrow: true,
        },
        {
          id: 'subscription',
          icon: 'card-outline',
          label: 'Subscription',
          subtitle: hasActiveSubscription ? 'Active' : 'Inactive',
          showArrow: true,
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          id: 'notifications',
          icon: 'notifications-outline',
          label: 'Notifications',
          showArrow: true,
        },
        {
          id: 'language',
          icon: 'language-outline',
          label: 'Language',
          subtitle: 'English',
          showArrow: true,
        },
        {
          id: 'theme',
          icon: 'color-palette-outline',
          label: 'Theme',
          subtitle: 'Light',
          showArrow: true,
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help',
          icon: 'help-circle-outline',
          label: 'Help & Support',
          showArrow: true,
        },
        {
          id: 'privacy',
          icon: 'shield-checkmark-outline',
          label: 'Privacy Policy',
          showArrow: true,
        },
        {
          id: 'terms',
          icon: 'document-text-outline',
          label: 'Terms of Service',
          showArrow: true,
        },
      ],
    },
    {
      title: '',
      items: [
        {
          id: 'logout',
          icon: 'log-out-outline',
          label: 'Logout',
          dangerous: true,
          onPress: handleLogout,
        },
      ],
    },
  ];

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
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0)?.toUpperCase() || 'P'}
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.editAvatarBtn}>
              <Ionicons name="camera" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{user?.name || 'Parent'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
          <Text style={styles.userPhone}>{user?.phone || ''}</Text>
        </View>

        {/* Current Student Indicator */}
        {selectedStudent && (
          <View style={styles.currentStudentCard}>
            <Text style={styles.currentStudentLabel}>Currently Viewing</Text>
            <View style={styles.currentStudentRow}>
              <View style={styles.currentStudentAvatar}>
                <Text style={styles.currentStudentAvatarText}>
                  {selectedStudent.studentName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.currentStudentName}>{selectedStudent.studentName}</Text>
            </View>
          </View>
        )}

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            {section.title && (
              <Text style={styles.sectionTitle}>{section.title}</Text>
            )}
            <View style={styles.menuCard}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem,
                    itemIndex < section.items.length - 1 && styles.menuItemBorder,
                  ]}
                  onPress={item.onPress}
                >
                  <View style={[
                    styles.menuIcon,
                    item.dangerous && styles.dangerousIcon
                  ]}>
                    <Ionicons
                      name={item.icon}
                      size={20}
                      color={item.dangerous ? '#EF4444' : '#6366F1'}
                    />
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={[
                      styles.menuLabel,
                      item.dangerous && styles.dangerousText
                    ]}>
                      {item.label}
                    </Text>
                    {item.subtitle && (
                      <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                    )}
                  </View>
                  {item.showArrow && (
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* App Version */}
        <Text style={styles.version}>Version 1.0.0</Text>

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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  currentStudentCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  currentStudentLabel: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '500',
    marginBottom: 8,
  },
  currentStudentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentStudentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentStudentAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  currentStudentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 10,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dangerousIcon: {
    backgroundColor: '#FEF2F2',
  },
  menuContent: {
    flex: 1,
    marginLeft: 12,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  dangerousText: {
    color: '#EF4444',
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  version: {
    textAlign: 'center',
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 24,
  },
});
