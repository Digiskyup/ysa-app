import React from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity } from 'react-native';
import { Text, Icon, useTheme, Button } from '@ui-kitten/components';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import {
  selectNotifications,
  selectUnreadCount,
  markAsRead,
  markAllAsRead,
} from '../redux/slices/notificationSlice';
import { AppNotification } from '../types';
import { spacing, borderRadius } from '../theme';
import { i18n } from '../i18n';

interface NotificationListProps {
  onItemPress?: (item: AppNotification) => void;
}

export const NotificationList = ({ onItemPress }: NotificationListProps) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectNotifications);
  const unreadCount = useAppSelector(selectUnreadCount);

  const handleNotificationPress = (notification: AppNotification) => {
    dispatch(markAsRead(notification._id));
    onItemPress?.(notification);
  };

  const handleMarkAllRead = () => {
    dispatch(markAllAsRead());
  };

  const getNotificationIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'payment':
        return 'card-outline';
      case 'approval':
        return 'checkmark-circle-outline';
      case 'reminder':
        return 'notifications-outline';
      default:
        return 'info-outline';
    }
  };

  const getNotificationColor = (type: AppNotification['type']) => {
    switch (type) {
      case 'payment':
        return theme['color-success-500'];
      case 'approval':
        return theme['color-info-500'];
      case 'reminder':
        return theme['color-warning-500'];
      default:
        return theme['color-primary-500'];
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return i18n.t('just_now');
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}${i18n.t('ago_h')}`;
    if (days < 7) return `${days}${i18n.t('ago_d')}`;
    return date.toLocaleDateString(i18n.locale);
  };

  const renderNotification = ({ item }: { item: AppNotification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        {
          backgroundColor: item.read
            ? 'transparent'
            : `${theme['color-primary-500']}08`,
        },
      ]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.notificationIcon,
          { backgroundColor: `${getNotificationColor(item.type)}20` },
        ]}
      >
        <Icon
          name={getNotificationIcon(item.type)}
          fill={getNotificationColor(item.type)}
          style={{ width: 20, height: 20 }}
        />
      </View>
      <View style={styles.notificationContent}>
        <Text category="s2" style={{ fontWeight: item.read ? '400' : '600' }}>
          {item.title}
        </Text>
        <Text category="c1" appearance="hint" numberOfLines={2}>
          {item.body}
        </Text>
        <Text category="c2" appearance="hint" style={{ marginTop: spacing.xxs }}>
          {formatTime(item.createdAt)}
        </Text>
      </View>
      {!item.read && (
        <View
          style={[
            styles.unreadDot,
            { backgroundColor: theme['color-primary-500'] },
          ]}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text category="s1" style={{ fontWeight: '700' }}>
          {i18n.t('notifications')}
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text category="c1" status="primary">
              Mark all read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon
              name="notifications-off-outline"
              fill={theme['text-hint-color']}
              style={{ width: 48, height: 48, marginBottom: spacing.md }}
            />
            <Text category="c1" appearance="hint">
              No notifications yet
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  listContent: {
    paddingBottom: spacing.md,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  notificationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  notificationContent: {
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: spacing.sm,
    marginTop: spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
});
