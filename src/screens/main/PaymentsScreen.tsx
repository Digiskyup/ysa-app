import React, { useState, useCallback, useEffect } from 'react';
import {
  Layout,
  Text,
  Button,
  Icon,
  CheckBox,
  useTheme,
  Select,
  SelectItem,
  IndexPath,
  Datepicker,
  Spinner,
} from '@ui-kitten/components';
import { NotificationBell } from '../../components/NotificationBell';
import { selectLocale } from '../../redux/slices/appSlice';
import { i18n } from '../../i18n';
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FilterChip } from '../../components/FilterChip';
import { PaymentCard } from '../../components/PaymentCard';
import { BottomSheetModal } from '../../components/BottomSheetModal';
import { YInput } from '../../components/YInput';
import { EmptyState } from '../../components/EmptyState';
import { useAppSelector } from '../../redux/hooks';
import { Payment, PaymentStatus, PaymentMode, UserRole, User } from '../../types';
import PaymentService from '../../services/PaymentService';
import apiClient from '../../services/api/client';
import * as FileSystem from 'expo-file-system';
import { spacing, borderRadius } from '../../theme';

// Mock payment data


type StatusFilter = 'all' | PaymentStatus;

const PAYMENT_FILTERS = [
  { label: 'all', getLabel: () => i18n.t('all') },
  { label: 'approved', getLabel: () => i18n.t('payment_approved') },
  { label: 'pending', getLabel: () => i18n.t('payment_pending') },
  { label: 'rejected', getLabel: () => i18n.t('payment_rejected') },
];

export const PaymentsScreen = ({ navigation, isTabMode = false, triggerAdd = 0 }: any) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const userRole = useAppSelector((state) => state.auth.role);
  const user = useAppSelector((state) => state.auth.user);
  const locale = useAppSelector(selectLocale); // Listen for language changes
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  const isStaff = userRole === UserRole.ADMIN || userRole === UserRole.RECEPTIONIST || userRole === UserRole.SUPER_ADMIN;
  const canBulkNotify = userRole === UserRole.SUPER_ADMIN || userRole === UserRole.ADMIN;
  const isStudent = userRole === UserRole.STUDENT;

  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<PaymentStatus | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [filters] = useState(PAYMENT_FILTERS);
  const [isLoading, setIsLoading] = useState(false);

  // Add Payment Modal State
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [formStudentId, setFormStudentId] = useState(isStudent ? user?._id || '' : '');
  const [formAmount, setFormAmount] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formDate, setFormDate] = useState(new Date());
  const [paymentModeIndex, setPaymentModeIndex] = useState<IndexPath | IndexPath[]>(new IndexPath(0));
  const [isSaving, setIsSaving] = useState(false);

  const paymentModes = Object.values(PaymentMode);
  const selectedPaymentMode = paymentModes[(paymentModeIndex as IndexPath).row];

  useEffect(() => {
    if (triggerAdd > 0) {
      handleAddPayment();
    }
  }, [triggerAdd]);

  const handleAddPayment = () => {
    setFormStudentId(isStudent ? user?._id || '' : '');
    setFormAmount('');
    setFormNotes('');
    setFormDate(new Date());
    setPaymentModeIndex(new IndexPath(0));
    setFormModalVisible(true);
  };

  const handleSavePayment = async () => {
    if (!formStudentId || !formAmount) {
      Alert.alert(i18n.t('error', { defaultValue: 'Error' }), i18n.t('err_fill_required', { defaultValue: 'Please fill in all required fields' }));
      return;
    }

    setIsSaving(true);
    try {
      await PaymentService.createPayment({
        studentId: formStudentId,
        amount: parseFloat(formAmount),
        paymentDate: formDate.toISOString(),
        paymentMode: selectedPaymentMode as PaymentMode,
        notes: formNotes,
      });
      Alert.alert(i18n.t('success', { defaultValue: 'Success' }), i18n.t('msg_payment_recorded', { defaultValue: 'Payment recorded successfully' }));
      setFormModalVisible(false);
      fetchPayments();
    } catch (error) {
       console.error('Failed to create payment', error);
       Alert.alert(i18n.t('error', { defaultValue: 'Error' }), i18n.t('err_create_payment', { defaultValue: 'Failed to create payment' }));
    } finally {
      setIsSaving(false);
    }
  };

  const fetchPayments = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const { data } = await PaymentService.getPayments();
      setPayments(data);
    } catch (error) {
      console.error('Failed to fetch payments', error);
      Alert.alert(i18n.t('error', { defaultValue: 'Error' }), i18n.t('err_fetch_payments', { defaultValue: 'Failed to fetch payments' }));
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter((payment) => {
    if (selectedStatus === 'all') return true;
    return payment.status === selectedStatus;
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPayments();
  }, []);

  const handlePaymentPress = (payment: Payment) => {
    if (selectMode) {
      togglePaymentSelection(payment._id);
    } else {
      setSelectedPayment(payment);
      setModalVisible(true);
    }
  };

  const togglePaymentSelection = (paymentId: string) => {
    setSelectedPayments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(paymentId)) {
        newSet.delete(paymentId);
      } else {
        newSet.add(paymentId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedPayments.size === filteredPayments.length) {
      setSelectedPayments(new Set());
    } else {
      setSelectedPayments(new Set(filteredPayments.map((p) => p._id)));
    }
  };

  const handleBulkNotify = () => {
    Alert.alert(
      'Send Reminders',
      `Send payment reminders to ${selectedPayments.size} students?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
             setIsLoading(true);
             try {
                await apiClient.post('/payments/reminders', { paymentIds: Array.from(selectedPayments) });
                Alert.alert(i18n.t('success', { defaultValue: 'Success' }), i18n.t('msg_reminders_sent', { defaultValue: 'Payment reminders sent!' }));
                setSelectedPayments(new Set());
                setSelectMode(false);
             } catch (err) {
                Alert.alert(i18n.t('error', { defaultValue: 'Error' }), i18n.t('err_send_reminders', { defaultValue: 'Failed to send reminders' }));
             } finally {
                setIsLoading(false);
             }
          },
        },
      ]
    );
  };

  const handleDownloadReceipt = async (payment: Payment) => {
    if (payment.status !== PaymentStatus.APPROVED) {
      Alert.alert(i18n.t('error', { defaultValue: 'Error' }), i18n.t('err_receipt_not_approved', { defaultValue: 'Receipt is only available for approved payments.' }));
      return;
    }
    try {
      const fileUri = `${FileSystem.documentDirectory}receipt_${payment.receiptNumber}.pdf`;
      const baseUrl = apiClient.defaults.baseURL || 'http://localhost:3000/api/v1';
      const downloadRes = await FileSystem.downloadAsync(
        `${baseUrl}/payments/${payment._id}/receipt`,
        fileUri,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      Alert.alert(i18n.t('success', { defaultValue: 'Success' }), `${i18n.t('msg_receipt_saved', { defaultValue: 'Receipt saved to: ' })}${downloadRes.uri}`);
    } catch (err) {
      Alert.alert(i18n.t('error', { defaultValue: 'Error' }), i18n.t('err_download_receipt', { defaultValue: 'Could not download the receipt.' }));
    }
  };

  const formatCurrency = (amount: number) => `₹${amount}`;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderPayment = ({ item }: { item: Payment }) => (
    <PaymentCard
      payment={item}
      onPress={() => handlePaymentPress(item)}
      showCheckbox={selectMode && canBulkNotify}
      isSelected={selectedPayments.has(item._id)}
      onToggleSelect={() => togglePaymentSelection(item._id)}
    />
  );

  return (
    <Layout style={[styles.container, !isTabMode && { paddingTop: insets.top }]}>
      {/* Header */}
      {!isTabMode && (
        <View style={styles.header}>
          <Text category="h5" style={{ fontWeight: '700' }}>
            {i18n.t('payments_title')}
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
            <TouchableOpacity onPress={handleAddPayment} style={{ padding: 4 }}>
              <Icon name="add-outline" fill={theme['text-basic-color']} style={{ width: 26, height: 26 }} />
            </TouchableOpacity>
            {canBulkNotify && (
              <Button
                size="small"
                appearance={selectMode ? 'filled' : 'ghost'}
                status="basic"
                onPress={() => {
                  setSelectMode(!selectMode);
                  setSelectedPayments(new Set());
                }}
              >
                {selectMode ? 'Cancel' : 'Select'}
              </Button>
            )}
            <NotificationBell />
          </View>
        </View>
      )}


      {/* Bulk Actions */}
      {selectMode && canBulkNotify && (
        <View
          style={[
            styles.bulkActions,
            { backgroundColor: theme['background-basic-color-2'] },
          ]}
        >
          <CheckBox
            checked={selectedPayments.size === filteredPayments.length}
            indeterminate={selectedPayments.size > 0 && selectedPayments.size < filteredPayments.length}
            onChange={handleSelectAll}
          >
            {() => (
              <Text category="s2" style={{ marginLeft: spacing.sm }}>
                Select All ({selectedPayments.size})
              </Text>
            )}
          </CheckBox>
          <Button
            size="small"
            status="info"
            disabled={selectedPayments.size === 0}
            onPress={handleBulkNotify}
            accessoryLeft={(props: any) => <Icon {...props} name="notifications" />}
          >
            Notify
          </Button>
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
              selected={selectedStatus === (item.label === 'all' ? 'all' : item.label as PaymentStatus)} // Logic adjustment needed here due to type change
              onPress={() => setSelectedStatus(item.label === 'all' ? 'all' : item.label as unknown as PaymentStatus)} // Quick fix for type mismatch
            />
          )}
          keyExtractor={(item) => item.label}
          contentContainerStyle={{ paddingHorizontal: spacing.lg }}
        />
      </View>

      {/* Payments List */}
      <FlatList
        data={filteredPayments}
        renderItem={renderPayment}
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
            icon="card-outline"
            title={i18n.t('no_payments', { defaultValue: 'No payments' })}
            message={isStaff ? 'No payments recorded yet' : 'No payment history found'}
          />
        }
      />

      {/* Payment Detail Modal */}
      <BottomSheetModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={i18n.t('payment_details', { defaultValue: 'Payment Details' })}
      >
        {selectedPayment && (
          <View style={styles.modalContent}>
            {/* Amount */}
            <View style={styles.amountSection}>
              <Text category="h3" style={{ fontWeight: '700' }}>
                {formatCurrency(selectedPayment.amount)}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      selectedPayment.status === PaymentStatus.APPROVED
                        ? `${theme['color-success-500']}20`
                        : selectedPayment.status === PaymentStatus.PENDING_APPROVAL
                        ? `${theme['color-warning-500']}20`
                        : `${theme['color-danger-500']}20`,
                  },
                ]}
              >
                <Text
                  category="c2"
                  style={{
                    fontWeight: '600',
                    color:
                      selectedPayment.status === PaymentStatus.APPROVED
                        ? theme['color-success-500']
                        : selectedPayment.status === PaymentStatus.PENDING_APPROVAL
                        ? theme['color-warning-500']
                        : theme['color-danger-500'],
                  }}
                >
                  {selectedPayment.status === PaymentStatus.APPROVED
                    ? 'Approved'
                    : selectedPayment.status === PaymentStatus.PENDING_APPROVAL
                    ? 'Pending'
                    : 'Rejected'}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text category="s2" appearance="hint">
                Receipt Number
              </Text>
              <Text category="s1" style={{ fontWeight: '600' }}>
                {selectedPayment.receiptNumber}
              </Text>
            </View>

            {isStaff && (
              <View style={styles.detailRow}>
                <Text category="s2" appearance="hint">
                  Student
                </Text>
                <Text category="s1">
                  {(selectedPayment.studentId as User)?.name || 'N/A'}
                </Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text category="s2" appearance="hint">
                Payment Date
              </Text>
              <Text category="s1">{formatDate(selectedPayment.paymentDate)}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text category="s2" appearance="hint">
                Payment Mode
              </Text>
              <Text category="s1" style={{ textTransform: 'uppercase' }}>
                {selectedPayment.paymentMode}
              </Text>
            </View>

            {selectedPayment.rejectionReason && (
              <View style={styles.detailRow}>
                <Text category="s2" appearance="hint">
                  Rejection Reason
                </Text>
                <Text category="s1" status="danger">
                  {selectedPayment.rejectionReason}
                </Text>
              </View>
            )}

            {/* Download Receipt Button (for approved payments) */}
            {selectedPayment.status === PaymentStatus.APPROVED && (
              <Button
                style={styles.downloadButton}
                appearance="outline"
                status="info"
                accessoryLeft={(props: any) => <Icon {...props} name="download-outline" />}
                onPress={() => handleDownloadReceipt(selectedPayment)}
              >
                Download Receipt
              </Button>
            )}

            {isStaff && selectedPayment.status === PaymentStatus.PENDING_APPROVAL && (
              <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
                <Button style={{ flex: 1 }} appearance="outline" onPress={() => {
                  Alert.prompt('Reject Payment', 'Enter rejection reason:', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Reject', style: 'destructive', onPress: async (reason) => {
                      try {
                        await apiClient.put(`/payments/${selectedPayment._id}/approval`, { approved: false, rejectionReason: reason });
                        setModalVisible(false); fetchPayments();
                        Alert.alert(i18n.t('success', { defaultValue: 'Success' }), i18n.t('msg_payment_rejected_success', { defaultValue: 'Payment rejected successfully!' }));
                      } catch (e) { Alert.alert(i18n.t('error', { defaultValue: 'Error' }), i18n.t('err_reject_payment', { defaultValue: 'Failed to reject payment' })); }
                    }}
                  ])
                }}>{i18n.t('action_reject', { defaultValue: 'Reject' })}</Button>
                <Button style={{ flex: 1 }} status="success" onPress={async () => {
                  try {
                    await apiClient.put(`/payments/${selectedPayment._id}/approval`, { approved: true });
                    setModalVisible(false); fetchPayments();
                    Alert.alert(i18n.t('success', { defaultValue: 'Success' }), i18n.t('msg_payment_approved_success', { defaultValue: 'Payment approved successfully!' }));
                  } catch (e) { Alert.alert(i18n.t('error', { defaultValue: 'Error' }), i18n.t('err_approve_payment', { defaultValue: 'Failed to approve payment' })); }
                }}>{i18n.t('action_approve', { defaultValue: 'Approve' })}</Button>
              </View>
            )}
          </View>
        )}
      </BottomSheetModal>

      {/* Add Payment Modal */}
      <BottomSheetModal
        visible={formModalVisible}
        onClose={() => setFormModalVisible(false)}
        title={`${i18n.t('add')} ${i18n.t('nav_payments')}`}
      >
        <View style={styles.modalContent}>
          {!isStudent && (
            <YInput
              label="Student ID (Email or ID)"
              placeholder={i18n.t('placeholder_student_id', { defaultValue: 'Enter student identifier' })}
              value={formStudentId}
              onChangeText={setFormStudentId}
              style={{ marginBottom: spacing.lg }}
            />
          )}

          <YInput
            label="Amount"
            placeholder={i18n.t('placeholder_amount', { defaultValue: 'Enter amount' })}
            value={formAmount}
            onChangeText={setFormAmount}
            keyboardType="numeric"
            style={{ marginBottom: spacing.lg }}
          />

          <View style={{ marginBottom: spacing.lg }}>
            <Text category="label" style={{ marginBottom: spacing.xs }}>{i18n.t('label_payment_mode', { defaultValue: 'Payment Mode' })}</Text>
            <Select
              selectedIndex={paymentModeIndex}
              onSelect={setPaymentModeIndex}
              value={selectedPaymentMode.toUpperCase()}
            >
              {paymentModes.map((mode) => (
                <SelectItem key={mode} title={mode.toUpperCase()} />
              ))}
            </Select>
          </View>

          <View style={{ marginBottom: spacing.lg }}>
             <Text category="label" style={{ marginBottom: spacing.xs }}>{i18n.t('label_date', { defaultValue: 'Date' })}</Text>
             <Datepicker
               date={formDate}
               onSelect={setFormDate}
             />
          </View>

          <YInput
            label="Notes"
            placeholder={i18n.t('placeholder_notes', { defaultValue: 'Optional notes' })}
            value={formNotes}
            onChangeText={setFormNotes}
            multiline
            style={{ marginBottom: spacing.xl }}
          />

          <Button 
            style={styles.saveButton}
            onPress={handleSavePayment} 
            disabled={isSaving}
            accessoryLeft={isSaving ? () => <Spinner size="small" status="control" /> : undefined}
          >
            {isSaving ? '' : 'Record Payment'}
          </Button>
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  bulkActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
  },
  filterContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
  },
  modalContent: {
    paddingTop: spacing.md,
  },
  amountSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  detailRow: {
    marginBottom: spacing.lg,
  },
  downloadButton: {
    marginTop: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  saveButton: {
    marginTop: spacing.xl,
    borderRadius: borderRadius.xl,
  },
});
