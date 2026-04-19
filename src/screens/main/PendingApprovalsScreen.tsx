import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, FlatList, Alert } from 'react-native';
import { Layout, Text, Button, Spinner, Icon, useTheme } from '@ui-kitten/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, borderRadius, shadows } from '../../theme';
import { UserRole, PaymentStatus, ApprovalStatus } from '../../types';
import { UserService } from '../../services/UserService';
import { PaymentService } from '../../services/PaymentService';
import { PermissionService } from '../../services/PermissionService';
import { UnifiedApprovalCard, UnifiedApprovalItem } from '../../components/UnifiedApprovalCard';
import { ApprovalDetailModal } from '../../components/ApprovalDetailModal';

export const PendingApprovalsScreen = ({ navigation }: any) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [approvals, setApprovals] = useState<UnifiedApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState<UnifiedApprovalItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const getDisplayName = (person: any) => {
    return (person && typeof person === 'object' && 'name' in person) ? person.name : 'Unknown';
  };

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const [users, paymentsResult, permissionsResult] = await Promise.all([
        UserService.getPendingUsers(),
        PaymentService.getPayments({ status: PaymentStatus.PENDING_APPROVAL }),
        PermissionService.getApprovals({ status: ApprovalStatus.PENDING })
      ]);

      const mappedUsers: UnifiedApprovalItem[] = users.map(u => ({
        id: u._id,
        type: 'signup',
        title: u.name,
        subtitle: u.email,
        date: u.createdAt,
        status: u.status || '',
        data: u
      }));

      const mappedPayments: UnifiedApprovalItem[] = paymentsResult.data.map(p => ({
        id: p._id,
        type: 'payment',
        title: `Payment: ₹${p.amount}`,
        subtitle: `From ${getDisplayName(p.studentId)}`,
        date: p.createdAt,
        status: p.status,
        data: p
      }));

      const mappedPermissions: UnifiedApprovalItem[] = permissionsResult.data.map(r => ({
        id: r._id,
        type: 'permission',
        title: r.action,
        subtitle: `Requested by ${getDisplayName(r.requestedBy)}`,
        date: r.createdAt,
        status: r.status,
        data: r
      }));

      const all = [...mappedUsers, ...mappedPayments, ...mappedPermissions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setApprovals(all);
    } catch (err) {
      Alert.alert('Error', 'Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const renderItem = ({ item }: { item: UnifiedApprovalItem }) => (
    <UnifiedApprovalCard 
      item={item} 
      onPress={() => {
        setSelectedApproval(item);
        setModalVisible(true);
      }}
    />
  );

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
      ) : approvals.length === 0 ? (
        <View style={styles.centered}>
          <Icon name="checkmark-circle-outline" fill={theme['color-success-400']} style={{ width: 64, height: 64, marginBottom: spacing.md }} />
          <Text category="h6" appearance="hint">No pending approvals</Text>
          <Text category="c1" appearance="hint" style={{ marginTop: spacing.xs }}>
            Everything is up to date!
          </Text>
        </View>
      ) : (
        <FlatList
          data={approvals}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <ApprovalDetailModal 
        visible={modalVisible} 
        item={selectedApproval} 
        onClose={() => setModalVisible(false)} 
        onActionSuccess={fetchPending}
      />
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
