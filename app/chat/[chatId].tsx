import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

export default function ChatScreen() {
  const params = useLocalSearchParams<{
    chatId: string;
    name: string;
    type: string;
    avatar: string;
    subjects?: string;
  }>();

  const { name, type, avatar, subjects } = params;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        
        <View style={[
          styles.headerAvatar, 
          type === 'admin' ? styles.adminAvatar : null
        ]}>
          <Text style={styles.headerAvatarText}>{avatar}</Text>
        </View>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{name}</Text>
          {type === 'teacher' && subjects ? (
            <Text style={styles.headerSubtitle}>{subjects}</Text>
          ) : type === 'admin' ? (
            <Text style={styles.headerSubtitle}>System Administrator</Text>
          ) : null}
        </View>
      </View>

      {/* Coming Soon Content */}
      <View style={styles.comingSoonContainer}>
        <View style={styles.comingSoonIcon}>
          <Ionicons name="chatbubbles-outline" size={64} color="#6366F1" />
        </View>
        <Text style={styles.comingSoonTitle}>Chat Coming Soon</Text>
        <Text style={styles.comingSoonText}>
          Direct messaging with {type === 'teacher' ? 'teachers' : 'administrators'} will be available in an upcoming update.
        </Text>
        <Text style={styles.comingSoonNote}>
          For now, you can view announcements and messages from the class details page.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminAvatar: {
    backgroundColor: '#059669',
  },
  headerAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 1,
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  comingSoonIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  comingSoonText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  comingSoonNote: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
