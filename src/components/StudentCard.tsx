import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Text, Avatar, Icon, useTheme } from '@ui-kitten/components';
import { User } from '../types';
import { spacing, borderRadius, shadows } from '../theme';

interface StudentCardProps {
  student: User;
  onPress: () => void;
}

export const StudentCard = ({ student, onPress }: StudentCardProps) => {
  const theme = useTheme();

  const totalFees = student.totalFees || 0;
  const feesPaid = student.feesPaid || 0;
  const remaining = totalFees - feesPaid;
  const isPaid = remaining <= 0;
  const progress = totalFees > 0 ? (feesPaid / totalFees) * 100 : 0;

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
            student.profileImage
              ? { uri: student.profileImage }
              : { uri: 'https://i.pravatar.cc/150?u=default' }
          }
          size="medium"
          style={styles.avatar}
        />

        <View style={styles.info}>
          <Text category="s1" style={{ fontWeight: '600' }}>
            {student.name}
          </Text>
          <Text category="c1" appearance="hint" style={{ marginTop: 2 }}>
            {student.course?.name || 'No course assigned'}
          </Text>
          <Text category="c2" appearance="hint" style={{ marginTop: 2 }}>
            {student.email}
          </Text>
        </View>

        {/* Fee Status Badge */}
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: isPaid
                ? `${theme['color-success-500']}20`
                : `${theme['color-warning-500']}20`,
            },
          ]}
        >
          <Text
            category="c2"
            style={{
              color: isPaid
                ? theme['color-success-500']
                : theme['color-warning-500'],
              fontWeight: '600',
            }}
          >
            {isPaid ? 'Paid' : `₹${remaining}`}
          </Text>
        </View>
      </View>

      {/* Fee Progress Bar */}
      {totalFees > 0 && (
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressTrack,
              { backgroundColor: theme['background-basic-color-4'] },
            ]}
          >
            <View
              style={[
                styles.progressBar,
                {
                  width: `${Math.min(progress, 100)}%`,
                  backgroundColor: isPaid
                    ? theme['color-success-500']
                    : theme['color-primary-500'],
                },
              ]}
            />
          </View>
          <Text category="c2" appearance="hint" style={{ marginLeft: spacing.sm }}>
            {Math.round(progress)}%
          </Text>
        </View>
      )}
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
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.full,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
});
