import React, { useState, useCallback, useEffect } from 'react';
import {
  Layout,
  Text,
  Button,
  Icon,
  useTheme,
  Modal,
  Card,
  Spinner,
} from '@ui-kitten/components';
import { NotificationBell } from '../../components/NotificationBell';
import { selectLocale } from '../../redux/slices/appSlice';
import { useAppSelector } from '../../redux/hooks';
import { i18n } from '../../i18n';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FilterChip } from '../../components/FilterChip';
import { ApprovalCard } from '../../components/ApprovalCard';
import { BottomSheetModal } from '../../components/BottomSheetModal';
import { EmptyState } from '../../components/EmptyState';
import { ApprovalRequest, ApprovalStatus, User } from '../../types';
import PermissionService from '../../services/PermissionService';
import { spacing, borderRadius } from '../../theme';

// Mock data for approvals


type StatusFilter = 'all' | ApprovalStatus;

const STATUS_FILTERS = [
  { label: 'all', getLabel: () => i18n.t('all') },
  { label: ApprovalStatus.PENDING, getLabel: () => i18n.t('approvals_pending') },
  { label: ApprovalStatus.APPROVED, getLabel: () => i18n.t('approvals_approved') },
  { label: ApprovalStatus.REJECTED, getLabel: () => i18n.t('approvals_rejected') },
];

export const ApprovalsScreen = ({ isTabMode = false }: any) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAppSelector((state: any) => state.auth.user);
  const locale = useAppSelector(selectLocale); // Listen for language changes

  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [filters] = useState(STATUS_FILTERS);
  const [isLoading, setIsLoading] = useState(false);

  const fetchApprovals = async () => {
    setIsLoading(true);
    try {
      const { data } = await PermissionService.getApprovals();
      setApprovals(data);
    } catch (error) {
      console.error('Failed to fetch approvals', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const filteredApprovals = approvals.filter((approval) => {
    if (selectedStatus === 'all') return true;
    return approval.status === selectedStatus;
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchApprovals();
  }, []);

  const handleApprovalPress = (approval: ApprovalRequest) => {
    setSelectedApproval(approval);
    setModalVisible(true);
  };

  const handleApprove = async (approvalId: string) => {
    setProcessing(true);
    try {
      await PermissionService.processApproval(approvalId, ApprovalStatus.APPROVED);
      // Refresh list
      fetchApprovals();
      setModalVisible(false);
    } catch (error) {
      console.error('Failed to approve', error);
      // Alert.alert('Error', 'Failed to approve request');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeny = async (approvalId: string) => {
    setProcessing(true);
    try {
      await PermissionService.processApproval(approvalId, ApprovalStatus.REJECTED);
      // Refresh list
      fetchApprovals();
      setModalVisible(false);
    } catch (error) {
       console.error('Failed to deny', error);
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return i18n.t('just_now', { defaultValue: 'Just now' });
    if (hours < 24) return `${hours}${i18n.t('ago_h', { defaultValue: 'h ago' })}`;
    if (days < 7) return `${days}${i18n.t('ago_d', { defaultValue: 'd ago' })}`;
    return date.toLocaleDateString();
  };

  const renderApproval = ({ item }: { item: ApprovalRequest }) => (
    <ApprovalCard
      approval={item}
      onPress={() => handleApprovalPress(item)}
      onApprove={() => handleApprove(item._id)}
      onDeny={() => handleDeny(item._id)}
    />
  );

  return (
    <Layout style={[styles.container, !isTabMode && { paddingTop: insets.top }]}>
      {/* Header */}
      {!isTabMode && (
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Text category="h5" style={{ fontWeight: '700' }}>
              {i18n.t('approvals_title')}
            </Text>
            <View style={styles.badgeContainer}>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: theme['color-primary-500'] },
                ]}
              >
                <Text category="c2" style={{ color: '#FFFFFF', fontWeight: '600' }}>
                  {approvals.filter((a) => a.status === ApprovalStatus.PENDING).length}
                </Text>
              </View>
            </View>
          </View>
          <NotificationBell />
        </View>
      )}

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={filters}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <FilterChip
              label={item.getLabel()}
              selected={selectedStatus === item.label}
              onPress={() => setSelectedStatus(item.label as StatusFilter)}
            />
          )}
          keyExtractor={(item) => item.label}
          contentContainerStyle={{ paddingHorizontal: spacing.lg }}
        />
      </View>

      {/* Approvals List */}
      <FlatList
        data={filteredApprovals}
        renderItem={renderApproval}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme['color-primary-500']}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="checkmark-circle-outline"
            title={i18n.t('no_results')}
            message={i18n.t('no_data')}
          />
        }
      />

      {/* Detail Modal */}
      <BottomSheetModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={i18n.t('approval_details', { defaultValue: 'Approval Details' })}
      >
        {selectedApproval && (
          <View style={styles.modalContent}>
            <View style={styles.detailRow}>
              <Text category="s2" appearance="hint">
                Action
              </Text>
              <Text category="s1" style={{ fontWeight: '600' }}>
                {selectedApproval.action}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text category="s2" appearance="hint">
                Requested By
              </Text>
              <Text category="s1">
                {typeof selectedApproval.requestedBy === 'object'
                  ? (selectedApproval.requestedBy as User).name
                  : selectedApproval.requestedBy}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text category="s2" appearance="hint">
                Resource Type
              </Text>
              <Text category="s1" style={{ textTransform: 'capitalize' }}>
                {selectedApproval.resourceType}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text category="s2" appearance="hint">
                Requested
              </Text>
              <Text category="s1">{formatDate(selectedApproval.createdAt)}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text category="s2" appearance="hint">
                Details
              </Text>
              <Text category="c1" style={styles.payloadText}>
                {JSON.stringify(selectedApproval.payload, null, 2)}
              </Text>
            </View>

            {selectedApproval.status === ApprovalStatus.PENDING && (
              <View style={styles.actionButtons}>
                <Button
                  style={styles.denyButton}
                  appearance="outline"
                  status="danger"
                  onPress={() => handleDeny(selectedApproval._id)}
                  disabled={processing}
                >
                  {i18n.t('deny')}
                </Button>
                <Button
                  style={styles.approveButton}
                  status="success"
                  onPress={() => handleApprove(selectedApproval._id)}
                  disabled={processing}
                  accessoryLeft={
                    processing ? () => <Spinner size="small" status="control" /> : undefined
                  }
                >
                  {processing ? '' : i18n.t('approve')}
                </Button>
              </View>
            )}

            {selectedApproval.status !== ApprovalStatus.PENDING && (
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      selectedApproval.status === ApprovalStatus.APPROVED
                        ? theme['color-success-500']
                        : theme['color-danger-500'],
                  },
                ]}
              >
                <Text category="s2" style={{ color: '#FFFFFF', fontWeight: '600' }}>
                  {selectedApproval.status === ApprovalStatus.APPROVED ? 'Approved' : 'Rejected'}
                </Text>
              </View>
            )}
          </View>
        )}
      </BottomSheetModal>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  badgeContainer: {
    marginLeft: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.full,
    minWidth: 24,
    alignItems: 'center',
  },
  filterContainer: {
    marginBottom: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
  },
  modalContent: {
    paddingTop: spacing.md,
  },
  detailRow: {
    marginBottom: spacing.lg,
  },
  payloadText: {
    marginTop: spacing.xs,
    fontFamily: 'monospace',
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  denyButton: {
    flex: 1,
    borderRadius: borderRadius.xl,
  },
  approveButton: {
    flex: 1,
    borderRadius: borderRadius.xl,
  },
  statusBadge: {
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginTop: spacing.lg,
  },
});
