import React, { useState } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { Text, Button, Icon, Spinner, useTheme } from '@ui-kitten/components';
import { BottomSheetModal } from './BottomSheetModal';
import { spacing, borderRadius } from '../theme';
import { UnifiedApprovalItem } from './UnifiedApprovalCard';
import UserService from '../services/UserService';
import PaymentService from '../services/PaymentService';
import PermissionService from '../services/PermissionService';
import { i18n } from '../i18n';

interface ApprovalDetailModalProps {
  visible: boolean;
  item: UnifiedApprovalItem | null;
  onClose: () => void;
  onActionSuccess: () => void;
}

export const ApprovalDetailModal = ({ 
  visible, 
  item, 
  onClose, 
  onActionSuccess 
}: ApprovalDetailModalProps) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);

  if (!item) return null;

  const handleApprove = async () => {
    setLoading(true);
    try {
      if (item.type === 'signup') {
        await UserService.approveUser(item.id);
      } else if (item.type === 'payment') {
        await PaymentService.approvePayment(item.id, true);
      } else if (item.type === 'permission') {
        await PermissionService.processApproval(item.id, 'approved' as any);
      }
      onActionSuccess();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to approve');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      if (item.type === 'signup') {
        await UserService.rejectUser(item.id);
      } else if (item.type === 'payment') {
        await PaymentService.approvePayment(item.id, false, 'Rejected by Administrator');
      } else if (item.type === 'permission') {
        await PermissionService.processApproval(item.id, 'rejected' as any, 'Rejected by Administrator');
      }
      onActionSuccess();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to reject');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const DetailRow = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.detailRow}>
      <Text category="s2" appearance="hint">{label}</Text>
      <Text category="s1" style={{ fontWeight: '600' }}>{value}</Text>
    </View>
  );

  const getDisplayName = (person: any) => {
    return (person && typeof person === 'object' && 'name' in person) ? person.name : 'Unknown';
  };

  const renderContent = () => {
    const { data } = item;
    
    switch (item.type) {
      case 'signup':
        return (
          <>
            <DetailRow label="Name" value={data.name} />
            <DetailRow label="Email" value={data.email} />
            <DetailRow label="Phone" value={data.phone || 'N/A'} />
            <DetailRow label="Role" value={data.role} />
          </>
        );
      case 'payment':
        return (
          <>
            <DetailRow label="Student" value={getDisplayName(data.studentId)} />
            <DetailRow label="Amount" value={`₹${data.amount}`} />
            <DetailRow label="Mode" value={data.paymentMode} />
            <DetailRow label="Receipt #" value={data.receiptNumber} />
          </>
        );
      case 'permission':
        return (
          <>
            <DetailRow label="Action" value={data.action} />
            <DetailRow label="Requested By" value={getDisplayName(data.requestedBy)} />
            <DetailRow label="Resource Type" value={data.resourceType} />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <BottomSheetModal 
      visible={visible} 
      onClose={onClose} 
      title={i18n.t('approval_details', { defaultValue: 'Approval Details' })}
    >
      <View style={styles.content}>
        {renderContent()}

        <View style={styles.divider} />

        <View style={styles.actions}>
          <Button 
            style={styles.actionBtn} 
            status="danger" 
            appearance="outline"
            onPress={handleReject}
            disabled={loading}
          >
            Reject
          </Button>
          <Button 
            style={styles.actionBtn} 
            status="success" 
            onPress={handleApprove}
            disabled={loading}
            accessoryLeft={loading ? () => <Spinner size="small" status="control" /> : undefined}
          >
            {loading ? '' : 'Approve'}
          </Button>
        </View>
      </View>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.lg,
  },
  detailRow: {
    marginBottom: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionBtn: {
    flex: 1,
    borderRadius: borderRadius.lg,
  }
});
