import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Text, CheckBox, Icon, useTheme } from '@ui-kitten/components';
import { Payment, PaymentStatus, User } from '../types';
import { spacing, borderRadius, shadows } from '../theme';
import { i18n } from '../i18n';

interface PaymentCardProps {
  payment: Payment;
  onPress: () => void;
  showCheckbox?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

export const PaymentCard = ({
  payment,
  onPress,
  showCheckbox = false,
  isSelected = false,
  onToggleSelect,
}: PaymentCardProps) => {
  const theme = useTheme();

  const getStatusColor = () => {
    switch (payment.status) {
      case PaymentStatus.APPROVED:
        return theme['color-success-500'];
      case PaymentStatus.REJECTED:
        return theme['color-danger-500'];
      default:
        return theme['color-warning-500'];
    }
  };

  const getStatusText = () => {
    switch (payment.status) {
      case PaymentStatus.APPROVED:
        return i18n.t('payment_approved');
      case PaymentStatus.REJECTED:
        return i18n.t('payment_rejected');
      default:
        return i18n.t('payment_pending');
    }
  };

  const formatCurrency = (amount: number) => `₹${amount}`;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(i18n.locale, {
      day: 'numeric',
      month: 'short',
    });
  };

  const studentName =
    typeof payment.studentId === 'object'
      ? (payment.studentId as User).name
      : 'Unknown';

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: theme['background-basic-color-2'],
          borderColor: isSelected
            ? theme['color-primary-500']
            : theme['border-basic-color-1'],
          borderWidth: isSelected ? 2 : 1,
        },
        shadows.sm,
      ]}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* Checkbox */}
        {showCheckbox && (
          <CheckBox
            checked={isSelected}
            onChange={onToggleSelect}
            style={styles.checkbox}
          />
        )}

        {/* Payment Icon */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${theme['color-primary-500']}20` },
          ]}
        >
          <Icon
            name="card-outline"
            fill={theme['color-primary-500']}
            style={styles.icon}
          />
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text category="s1" style={{ fontWeight: '600' }}>
            {formatCurrency(payment.amount)}
          </Text>
          <Text category="c1" appearance="hint" style={{ marginTop: 2 }}>
            {studentName} • {formatDate(payment.paymentDate)}
          </Text>
          <Text category="c2" appearance="hint" style={{ marginTop: 2, textTransform: 'uppercase' }}>
            {payment.paymentMode}
          </Text>
        </View>

        {/* Status Badge */}
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: `${getStatusColor()}20` },
          ]}
        >
          <View
            style={[styles.statusDot, { backgroundColor: getStatusColor() }]}
          />
          <Text
            category="c2"
            style={{ color: getStatusColor(), fontWeight: '600' }}
          >
            {getStatusText()}
          </Text>
        </View>
      </View>

      {/* Receipt Number */}
      <View style={styles.footer}>
        <Icon
          name="document-outline"
          fill={theme['text-hint-color']}
          style={styles.receiptIcon}
        />
        <Text category="c2" appearance="hint">
          {payment.receiptNumber}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    marginRight: spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  icon: {
    width: 24,
    height: 24,
  },
  info: {
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xxs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  receiptIcon: {
    width: 14,
    height: 14,
    marginRight: spacing.xs,
  },
});
