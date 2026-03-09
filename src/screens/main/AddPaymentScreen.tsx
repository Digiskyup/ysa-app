import React, { useState } from 'react';
import { Layout, Text, Button, Select, SelectItem, IndexPath, Datepicker, useTheme } from '@ui-kitten/components';
import { StyleSheet, View, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YInput } from '../../components/YInput';
import { PaymentMode, UserRole } from '../../types';
import PaymentService from '../../services/PaymentService';
import { spacing } from '../../theme';
import { selectLocale } from '../../redux/slices/appSlice';
import { i18n } from '../../i18n';
import { useAppDispatch, useAppSelector } from '../../redux/hooks'; // Added import for hooks

export const AddPaymentScreen = ({ navigation }: any) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch(); // Added dispatch hook
  const locale = useAppSelector(selectLocale); // Added locale selector

  const user = useAppSelector((state) => state.auth.user);
  const isStudent = user?.role === UserRole.STUDENT;

  const [studentId, setStudentId] = useState(isStudent ? user?.email || user?._id || '' : '');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date());
  const [paymentModeIndex, setPaymentModeIndex] = useState<IndexPath | IndexPath[]>(new IndexPath(0));
  const [isLoading, setIsLoading] = useState(false);

  const paymentModes = Object.values(PaymentMode);
  const selectedPaymentMode = paymentModes[(paymentModeIndex as IndexPath).row];

  const handleCreatePayment = async () => {
    if (!studentId || !amount) {
      Alert.alert(i18n.t('error', { defaultValue: 'Error' }), i18n.t('err_fill_required', { defaultValue: 'Please fill in all required fields' }));
      return;
    }

    setIsLoading(true);
    try {
      await PaymentService.createPayment({
        studentId,
        amount: parseFloat(amount),
        paymentDate: date.toISOString(),
        paymentMode: selectedPaymentMode,
        notes,
      });
      Alert.alert(i18n.t('success', { defaultValue: 'Success' }), i18n.t('msg_payment_recorded', { defaultValue: 'Payment recorded successfully' }), [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
       console.error('Failed to create payment', error);
       Alert.alert(i18n.t('error', { defaultValue: 'Error' }), i18n.t('err_create_payment', { defaultValue: 'Failed to create payment' }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text category="h5" style={{ fontWeight: '700', marginBottom: spacing.xl }}>
          {`${i18n.t('add')} ${i18n.t('nav_payments')}`}
        </Text>
        
        {!isStudent && (
          <YInput
            label="Student ID (Email or ID)"
            placeholder={i18n.t('placeholder_student_id', { defaultValue: 'Enter student identifier' })}
            value={studentId}
            onChangeText={setStudentId}
            style={{ marginBottom: spacing.lg }}
          />
        )}

        <YInput
          label="Amount"
          placeholder={i18n.t('placeholder_amount', { defaultValue: 'Enter amount' })}
          value={amount}
          onChangeText={setAmount}
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
             date={date}
             onSelect={setDate}
           />
        </View>

        <YInput
          label="Notes"
          placeholder={i18n.t('placeholder_notes', { defaultValue: 'Optional notes' })}
          value={notes}
          onChangeText={setNotes}
          multiline
          style={{ marginBottom: spacing.xl }}
        />

        <Button 
          onPress={handleCreatePayment} 
          disabled={isLoading}
        >
          {isLoading ? 'Recording...' : 'Record Payment'}
        </Button>
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
});
