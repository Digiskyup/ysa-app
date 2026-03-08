import React, { useState, useEffect } from 'react';
import { Layout, Text, Button, Spinner, useTheme } from '@ui-kitten/components';
import { StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YInput } from '../../components/YInput';
import UserService from '../../services/UserService';
import { spacing, borderRadius } from '../../theme';
import { i18n } from '../../i18n';

export const EditStudentScreen = ({ route, navigation }: any) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { studentId } = route.params || {};
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (studentId) {
      loadStudent();
    } else {
      Alert.alert(i18n.t('error', { defaultValue: 'Error' }), i18n.t('err_no_student_id', { defaultValue: 'No student ID provided' }));
      navigation.goBack();
    }
  }, [studentId]);

  const loadStudent = async () => {
    setIsLoading(true);
    try {
      const student = await UserService.getStudent(studentId);
      setName(student.name);
      setEmail(student.email);
      setPhone(student.phone || '');
    } catch (err: any) {
      Alert.alert(i18n.t('error', { defaultValue: 'Error' }), i18n.t('err_load_student', { defaultValue: 'Failed to load student details' }));
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert(i18n.t('error', { defaultValue: 'Error' }), i18n.t('err_fill_required', { defaultValue: 'Name and email are required' }));
      return;
    }
    setIsSaving(true);
    try {
      await UserService.updateStudent(studentId, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
      Alert.alert(i18n.t('success', { defaultValue: 'Success' }), i18n.t('msg_student_updated', { defaultValue: 'Student updated successfully' }));
      navigation.goBack();
    } catch (err: any) {
      Alert.alert(i18n.t('error', { defaultValue: 'Error' }), err.response?.data?.error?.message || err.message || i18n.t('err_update_student', { defaultValue: 'Failed to update student' }));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Layout style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <Spinner size="giant" />
      </Layout>
    );
  }

  return (
    <Layout style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Button appearance="ghost" status="basic" onPress={() => navigation.goBack()}>{i18n.t('nav_back', { defaultValue: 'Back' })}</Button>
        <Text category="h6">{i18n.t('action_edit_student', { defaultValue: 'Edit Student' })}</Text>
        <View style={{ width: 60 }} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formContainer}>
            <YInput label="Name" value={name} onChangeText={setName} style={styles.input} />
            <YInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={styles.input} />
            <YInput label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={styles.input} />
            
            <Button
              style={styles.button}
              onPress={handleUpdate}
              disabled={isSaving}
              accessoryLeft={isSaving ? () => <Spinner size="small" status="control" /> : undefined}
            >
              {isSaving ? '' : i18n.t('action_update_student', { defaultValue: 'Update Student' })}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: spacing.lg, paddingBottom: spacing.sm },
  keyboardView: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing['3xl'] },
  formContainer: { width: '100%' },
  input: { marginBottom: spacing.lg },
  button: { marginTop: spacing.md, borderRadius: borderRadius.xl },
});
