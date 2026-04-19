import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Text, Icon, useTheme } from '@ui-kitten/components';
import { spacing, borderRadius, shadows } from '../theme';
import { i18n } from '../i18n';

export type UnifiedApprovalType = 'signup' | 'payment' | 'permission';

export interface UnifiedApprovalItem {
  id: string;
  type: UnifiedApprovalType;
  title: string;
  subtitle: string;
  date: string | Date;
  status: string;
  data: any; // The original object
}

interface UnifiedApprovalCardProps {
  item: UnifiedApprovalItem;
  onPress: () => void;
}

export const UnifiedApprovalCard = ({ item, onPress }: UnifiedApprovalCardProps) => {
  const theme = useTheme();

  const getIcon = () => {
    switch (item.type) {
      case 'signup':
        return 'person-add-outline';
      case 'payment':
        return 'card-outline';
      case 'permission':
        return 'shield-outline';
      default:
        return 'question-mark-circle-outline';
    }
  };

  const getIconColor = () => {
    switch (item.type) {
      case 'signup':
        return theme['color-info-500'];
      case 'payment':
        return theme['color-success-500'];
      case 'permission':
        return theme['color-warning-500'];
      default:
        return theme['color-basic-500'];
    }
  };

  const formatDate = (dateValue: string | Date) => {
    try {
      const date = new Date(dateValue);
      return date.toLocaleDateString();
    } catch (e) {
      return '';
    }
  };

  const typeLabel = {
    signup: i18n.t('approval_type_signup', { defaultValue: 'Signup' }),
    payment: i18n.t('approval_type_payment', { defaultValue: 'Payment' }),
    permission: i18n.t('approval_type_permission', { defaultValue: 'Permission' }),
  }[item.type];

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: theme['background-basic-color-2'] }, shadows.sm]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBox, { backgroundColor: `${getIconColor()}20` }]}>
        <Icon name={getIcon()} fill={getIconColor()} style={{ width: 24, height: 24 }} />
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text category="c2" appearance="hint" style={{ fontWeight: '700', textTransform: 'uppercase' }}>
            {typeLabel}
          </Text>
          <Text category="c2" appearance="hint">
            {formatDate(item.date)}
          </Text>
        </View>
        <Text category="s1" style={{ fontWeight: '600' }} numberOfLines={1}>
          {item.title}
        </Text>
        <Text category="c1" appearance="hint" numberOfLines={1}>
          {item.subtitle}
        </Text>
      </View>
      
      <Icon name="chevron-forward-outline" fill={theme['text-hint-color']} style={{ width: 20, height: 20 }} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  }
});
