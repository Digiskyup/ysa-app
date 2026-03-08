import React, { useState } from 'react';
import { Layout, Text, Button, Spinner, useTheme } from '@ui-kitten/components';
import { StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YInput } from '../../components/YInput';
import UserService from '../../services/UserService';
import { spacing, borderRadius } from '../../theme';
import { i18n } from '../../i18n';

export const CreateStudentScreen = ({ navigation }: any) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert(i18n.t('error', { defaultValue: 'Error' }), i18n.t('err_fill_required', { defaultValue: 'Name, email and password are required' }));
      return;
    }
    setIsLoading(true);
    try {
      await UserService.createStudent({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });
      Alert.alert(i18n.t('success', { defaultValue: 'Success' }), i18n.t('msg_student_created', { defaultValue: 'Student created successfully' }));
      navigation.goBack();
    } catch (err: any) {
      Alert.alert(i18n.t('error', { defaultValue: 'Error' }), err.response?.data?.error?.message || err.message || i18n.t('err_create_student', { defaultValue: 'Failed to create student' }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Button appearance="ghost" status="basic" onPress={() => navigation.goBack()}>{i18n.t('nav_back', { defaultValue: 'Back' })}</Button>
        <Text category="h6">{i18n.t('action_add_student', { defaultValue: 'Add Student' })}</Text>
        <View style={{ width: 60 }} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formContainer}>
            <YInput label="Name" value={name} onChangeText={setName} style={styles.input} />
            <YInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={styles.input} />
            <YInput label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={styles.input} />
            <YInput label="Temporary Password" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
            <Button
              style={styles.button}
              onPress={handleCreate}
              disabled={isLoading}
              accessoryLeft={isLoading ? () => <Spinner size="small" status="control" /> : undefined}
            >
              {isLoading ? '' : i18n.t('action_create_student', { defaultValue: 'Create Student' })}
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
