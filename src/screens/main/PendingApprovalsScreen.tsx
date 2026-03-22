import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, FlatList, Alert } from 'react-native';
import { Layout, Text, Button, Spinner, Icon, useTheme } from '@ui-kitten/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, borderRadius, shadows } from '../../theme';
import { UserService } from '../../services/UserService';
import { User } from '../../types';

export const PendingApprovalsScreen = ({ navigation }: any) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const pending = await UserService.getPendingUsers();
      setUsers(pending);
    } catch (err) {
      Alert.alert('Error', 'Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleApprove = async (user: User) => {
    Alert.alert(
      'Approve Account',
      `Approve account for ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setActionLoading(user._id);
            try {
              await UserService.approveUser(user._id);
              setUsers((prev) => prev.filter((u) => u._id !== user._id));
            } catch {
              Alert.alert('Error', 'Failed to approve user');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleReject = async (user: User) => {
    Alert.alert(
      'Reject Account',
      `Reject and suspend the account for ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(user._id);
            try {
              await UserService.rejectUser(user._id);
              setUsers((prev) => prev.filter((u) => u._id !== user._id));
            } catch {
              Alert.alert('Error', 'Failed to reject user');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: User }) => {
    const isActing = actionLoading === item._id;
    return (
      <View style={[styles.card, { backgroundColor: theme['background-basic-color-2'] }, shadows.sm]}>
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, { backgroundColor: theme['color-primary-100'] }]}>
            <Icon name="person-outline" fill={theme['color-primary-500']} style={{ width: 24, height: 24 }} />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text category="s1" style={{ fontWeight: '700' }}>{item.name}</Text>
            <Text category="c1" appearance="hint">{item.email}</Text>
            <Text category="c1" appearance="hint">{item.phone || ''}</Text>
          </View>
          <View style={[styles.roleBadge, { backgroundColor: item.role === 'receptionist' ? theme['color-warning-100'] : theme['color-info-100'] }]}>
            <Text category="c2" style={{ color: item.role === 'receptionist' ? theme['color-warning-700'] : theme['color-info-700'], fontWeight: '600' }}>
              {item.role === 'receptionist' ? 'Staff' : 'Student'}
            </Text>
          </View>
        </View>

        <Text category="c1" appearance="hint" style={{ marginBottom: spacing.md }}>
          Signed up: {new Date(item.createdAt).toLocaleDateString()}
        </Text>

        {isActing ? (
          <View style={styles.actions}>
            <Spinner size="small" />
          </View>
        ) : (
          <View style={styles.actions}>
            <Button
              size="small"
              status="danger"
              appearance="outline"
              style={styles.rejectBtn}
              onPress={() => handleReject(item)}
            >
              Reject
            </Button>
            <Button
              size="small"
              status="success"
              style={styles.approveBtn}
              onPress={() => handleApprove(item)}
            >
              Approve
            </Button>
          </View>
        )}
      </View>
    );
  };

  return (
    <Layout style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme['color-primary-500'] }]}>
        <Button
          appearance="ghost"
          status="control"
          accessoryLeft={(props) => <Icon {...props} name="arrow-back-outline" />}
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        />
        <Text category="h6" style={{ color: 'white', fontWeight: '700', flex: 1 }}>
          Pending Approvals
        </Text>
        <Button
          appearance="ghost"
          status="control"
          accessoryLeft={(props) => <Icon {...props} name="refresh-outline" />}
          onPress={fetchPending}
        />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <Spinner size="large" />
        </View>
      ) : users.length === 0 ? (
        <View style={styles.centered}>
          <Icon name="checkmark-circle-2-outline" fill={theme['color-success-400']} style={{ width: 64, height: 64, marginBottom: spacing.md }} />
          <Text category="h6" appearance="hint">No pending approvals</Text>
          <Text category="c1" appearance="hint" style={{ marginTop: spacing.xs }}>
            All sign-up requests have been reviewed.
          </Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  backBtn: { marginRight: spacing.xs },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  list: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.md,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rejectBtn: { flex: 1 },
  approveBtn: { flex: 1 },
});
