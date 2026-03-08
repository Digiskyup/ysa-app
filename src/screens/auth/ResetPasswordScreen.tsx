import React, { useState } from 'react';
import { Layout, Text, Button, Spinner, useTheme } from '@ui-kitten/components';
import { StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YInput } from '../../components/YInput';
import { AuthService } from '../../services/AuthService';
import { spacing, borderRadius } from '../../theme';
import { i18n } from '../../i18n';

export const ResetPasswordScreen = ({ navigation }: any) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    if (!token.trim() || !password.trim()) {
      Alert.alert(i18n.t('error', { defaultValue: 'Error' }), i18n.t('err_enter_reset_token', { defaultValue: 'Please enter reset token and new password' }));
      return;
    }
    setIsLoading(true);
    try {
      await AuthService.resetPassword(token.trim(), password.trim());
      Alert.alert(i18n.t('success', { defaultValue: 'Success' }), i18n.t('msg_password_reset', { defaultValue: 'Password has been reset successfully. Please login.' }));
      navigation.navigate('Login');
    } catch (err: any) {
      Alert.alert(i18n.t('error', { defaultValue: 'Error' }), err.response?.data?.error?.message || err.message || i18n.t('err_reset_password', { defaultValue: 'Failed to reset password' }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text category="h4" style={styles.title}>{i18n.t('reset_password', { defaultValue: 'Reset Password' })}</Text>
          <Text category="s1" style={{ color: theme['text-hint-color'], marginBottom: spacing.xl, textAlign: 'center' }}>
            {i18n.t('reset_password_instruction', { defaultValue: 'Enter the token from your email and your new password' })}
          </Text>

          <View style={styles.formContainer}>
            <View style={styles.inputWrapper}>
              <YInput
                label={i18n.t('reset_token', { defaultValue: 'Reset Token' })}
                placeholder={i18n.t('placeholder_token', { defaultValue: 'Paste token here' })}
                value={token}
                onChangeText={setToken}
              />
            </View>

            <View style={styles.inputWrapper}>
              <YInput
                label={i18n.t('new_password', { defaultValue: 'New Password' })}
                placeholder={i18n.t('placeholder_new_password', { defaultValue: 'Enter new password' })}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <Button
              style={{ borderRadius: borderRadius['2xl'], marginTop: spacing.md }}
              onPress={handleReset}
              disabled={isLoading}
              size="large"
              accessoryLeft={isLoading ? () => <Spinner size="small" status="control" /> : undefined}
            >
              {isLoading ? '' : i18n.t('reset_password', { defaultValue: 'Reset Password' })}
            </Button>
            
            <Button
              appearance="ghost"
              onPress={() => navigation.goBack()}
              style={{ marginTop: spacing.sm }}
            >
              {i18n.t('back_to_login', { defaultValue: 'Back to Login' })}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: spacing.lg, justifyContent: 'center' },
  title: { fontWeight: '700', textAlign: 'center', marginBottom: spacing.xs },
  formContainer: { width: '100%', marginTop: spacing.xl },
  inputWrapper: { marginBottom: spacing.lg },
});
