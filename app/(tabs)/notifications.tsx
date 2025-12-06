import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../../src/contexts/NotificationContext';
import { Notification, NotificationType } from '../../src/services/notificationService';
import { useThemeColor } from '@/hooks/use-theme-color';

const getNotificationIcon = (type: NotificationType): keyof typeof Ionicons.glyphMap => {
  switch (type) {
    case NotificationType.CLASS:
      return 'school-outline';
    case NotificationType.TEST:
      return 'document-text-outline';
    case NotificationType.ATTENDANCE:
      return 'calendar-outline';
    case NotificationType.MESSAGE:
      return 'chatbubble-outline';
    case NotificationType.ANNOUNCEMENT:
      return 'megaphone-outline';
    case NotificationType.REMINDER:
      return 'alarm-outline';
    default:
      return 'notifications-outline';
  }
};

const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

function NotificationItem({
  notification,
  onPress,
  onDelete,
  textColor,
  backgroundColor,
  borderColor,
}: {
  notification: Notification;
  onPress: () => void;
  onDelete: () => void;
  textColor: string;
  backgroundColor: string;
  borderColor: string;
}) {
  const iconColor = notification.read ? '#9CA3AF' : '#3B82F6';

  return (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        {
          backgroundColor: notification.read ? backgroundColor : `${backgroundColor}F0`,
          borderColor,
          opacity: notification.read ? 0.8 : 1,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
        <Ionicons
          name={getNotificationIcon(notification.type)}
          size={24}
          color={iconColor}
        />
      </View>
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text
            style={[
              styles.title,
              { color: textColor, fontWeight: notification.read ? '500' : '600' },
            ]}
            numberOfLines={1}
          >
            {notification.title}
          </Text>
          <Text style={styles.time}>{getRelativeTime(notification.createdAt)}</Text>
        </View>
        <Text style={[styles.body, { color: `${textColor}99` }]} numberOfLines={2}>
          {notification.body}
        </Text>
        {!notification.read && <View style={styles.unreadDot} />}
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={onDelete}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="trash-outline" size={18} color="#EF4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const {
    notifications,
    unreadCount,
    isLoading,
    refreshNotifications,
    loadMoreNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({ light: '#E5E7EB', dark: '#374151' }, 'background');

  const handleNotificationPress = useCallback(
    async (notification: Notification) => {
      if (!notification.read) {
        await markAsRead(notification.id);
      }
      // Add navigation logic based on notification type/data here
    },
    [markAsRead]
  );

  const renderNotification = useCallback(
    ({ item }: { item: Notification }) => (
      <NotificationItem
        notification={item}
        onPress={() => handleNotificationPress(item)}
        onDelete={() => deleteNotification(item.id)}
        textColor={textColor}
        backgroundColor={backgroundColor}
        borderColor={borderColor}
      />
    ),
    [handleNotificationPress, deleteNotification, textColor, backgroundColor, borderColor]
  );

  const renderHeader = () => (
    <View style={[styles.header, { borderBottomColor: borderColor }]}>
      <View style={styles.headerLeft}>
        <Text style={[styles.headerTitle, { color: textColor }]}>Notifications</Text>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>
      {unreadCount > 0 && (
        <TouchableOpacity onPress={() => markAllAsRead()} style={styles.markAllButton}>
          <Text style={styles.markAllText}>Mark all as read</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={64} color="#9CA3AF" />
      <Text style={[styles.emptyTitle, { color: textColor }]}>No notifications</Text>
      <Text style={styles.emptySubtitle}>
        You're all caught up! New notifications will appear here.
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!isLoading) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#3B82F6" />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {renderHeader()}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          notifications.length === 0 && styles.emptyList,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && notifications.length === 0}
            onRefresh={refreshNotifications}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }
        onEndReached={loadMoreNotifications}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={!isLoading ? renderEmpty : null}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  markAllButton: {
    padding: 8,
  },
  markAllText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyList: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
