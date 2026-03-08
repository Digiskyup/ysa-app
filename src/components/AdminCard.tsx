import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Text, Avatar, Icon, useTheme } from '@ui-kitten/components';
import { User, UserRole } from '../types';
import { spacing, borderRadius, shadows } from '../theme';

interface AdminCardProps {
  admin: User & { permissions: string[] };
  onPress: () => void;
}

export const AdminCard = ({ admin, onPress }: AdminCardProps) => {
  const theme = useTheme();

  const isAdmin = admin.role === UserRole.ADMIN;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: theme['background-basic-color-2'],
          borderColor: theme['border-basic-color-1'],
        },
        shadows.sm,
      ]}
      activeOpacity={0.7}
    >
      {/* Avatar and Info */}
      <View style={styles.mainContent}>
        <Avatar
          source={
            admin.profileImage
              ? { uri: admin.profileImage }
              : { uri: 'https://i.pravatar.cc/150?u=admin' }
          }
          size="medium"
          style={styles.avatar}
        />

        <View style={styles.info}>
          <Text category="s1" style={{ fontWeight: '600' }}>
            {admin.name}
          </Text>
          <Text category="c1" appearance="hint" style={{ marginTop: 2 }}>
            {admin.email}
          </Text>
          <View style={styles.permissionsRow}>
            <Icon
              name="shield-outline"
              fill={theme['text-hint-color']}
              style={styles.permissionIcon}
            />
            <Text category="c2" appearance="hint">
              {admin.permissions?.length || 0} permissions
            </Text>
          </View>
        </View>

        {/* Role Badge */}
        <View
          style={[
            styles.roleBadge,
            {
              backgroundColor: isAdmin
                ? `${theme['color-info-500']}20`
                : `${theme['color-primary-500']}20`,
            },
          ]}
        >
          <Text
            category="c2"
            style={{
              color: isAdmin
                ? theme['color-info-500']
                : theme['color-primary-500'],
              fontWeight: '600',
              textTransform: 'capitalize',
            }}
          >
            {admin.role}
          </Text>
        </View>
      </View>

      {/* Edit indicator */}
      <View style={styles.editHint}>
        <Text category="c2" appearance="hint">
          Tap to edit permissions
        </Text>
        <Icon
          name="chevron-forward-outline"
          fill={theme['text-hint-color']}
          style={styles.chevron}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
  },
  permissionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  permissionIcon: {
    width: 12,
    height: 12,
    marginRight: spacing.xxs,
  },
  roleBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.full,
  },
  editHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  chevron: {
    width: 16,
    height: 16,
    marginLeft: spacing.xxs,
  },
});
