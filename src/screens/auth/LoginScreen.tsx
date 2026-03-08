import React, { useState } from 'react';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { i18n } from '../../i18n';
import {
  Layout,
  Text,
  Button,
  Icon,
  Select,
  SelectItem,
  IndexPath,
  Spinner,
  useTheme,
} from '@ui-kitten/components';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YInput } from '../../components/YInput';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { loginSuccess, setLoading, setError } from '../../redux/slices/authSlice';
import { UserRole, User } from '../../types';
import { AuthService } from '../../services/AuthService';
import { spacing, borderRadius } from '../../theme';

export const LoginScreen = ({ navigation }: any) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert(i18n.t('email_required', { defaultValue: 'Email Required' }), i18n.t('err_email_reset', { defaultValue: 'Please enter your email address to reset your password.' }));
      return;
    }
    dispatch(setLoading(true));
    try {
      await AuthService.forgotPassword(email.trim());
      Alert.alert(i18n.t('success', { defaultValue: 'Success' }), i18n.t('msg_password_reset_sent', { defaultValue: 'Password reset instructions have been sent to your email.' }));
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to send reset email.';
      Alert.alert(i18n.t('error', { defaultValue: 'Error' }), errorMessage);
    } finally {
      dispatch(setLoading(false));
    }
  };

  React.useEffect(() => {
    GoogleSignin.configure({
      webClientId: '252145337666-jvhc0dgsp5n475a3l1oj4a0ericm49i9.apps.googleusercontent.com',
      offlineAccess: true,
    });
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      dispatch(setError('Please enter email and password'));
      return;
    }

    dispatch(setLoading(true));

    try {
      const response = await AuthService.login(email.trim(), password.trim());
      dispatch(loginSuccess(response));
      // Navigation is handled automatically by AppNavigator
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Login failed. Please try again.';
      dispatch(setError(errorMessage));
      Alert.alert(i18n.t('login_failed', { defaultValue: 'Login Failed' }), errorMessage);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleGoogleSignIn = async () => {
    dispatch(setLoading(true));
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      if (userInfo.data?.idToken) {
         handleGoogleAuth(userInfo.data.idToken);
      } else {
         throw new Error('No idToken found');
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled the login flow
        dispatch(setLoading(false));
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // operation (e.g. sign in) is in progress already
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // play services not available or outdated
        dispatch(setError('Play services not available'));
        dispatch(setLoading(false));
      } else {
        // some other error happened
        dispatch(setError(error.message || 'Google Sign-In failed'));
        dispatch(setLoading(false));
      }
    }
  };

  const handleGoogleAuth = async (idToken: string) => {
    dispatch(setLoading(true));
    try {
       const res = await AuthService.googleAuth(idToken);
       dispatch(loginSuccess(res));
    } catch (err: any) {
       // Extract error message from backend response
       const errorMessage = err.response?.data?.error?.message || err.message || 'Google Sign-In failed';
       dispatch(setError(errorMessage));
       Alert.alert(i18n.t('google_signin_failed', { defaultValue: 'Google Sign-In Failed' }), errorMessage);
    } finally {
       dispatch(setLoading(false));
    }
  };



  const GoogleIcon = (props: any) => (
    <Image
      source={{
        uri: 'https://www.google.com/favicon.ico',
      }}
      style={{ width: 20, height: 20 }}
    />
  );

  const EyeIcon = (props: any) => (
    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
      <Icon
        {...props}
        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
        fill={theme['text-hint-color']}
      />
    </TouchableOpacity>
  );

  return (
    <Layout style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo/Brand Section */}
          <View style={styles.headerContainer}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../../assets/icon.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text category="h4" style={[styles.title, { color: theme['text-basic-color'] }]}>
              Your Success Academy
            </Text>
            <Text
              category="s1"
              style={{ color: theme['text-hint-color'], marginTop: spacing.xs }}
            >
              {i18n.t('signin_to_continue', { defaultValue: 'Sign in to continue' })}
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <YInput
                label={i18n.t('email')}
                placeholder={i18n.t('email')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                accessoryLeft={(props: any) => (
                  <Icon {...props} name="mail-outline" fill={theme['text-hint-color']} />
                )}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <YInput
                label={i18n.t('password')}
                placeholder={i18n.t('password')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                accessoryLeft={(props: any) => (
                  <Icon {...props} name="lock-closed-outline" fill={theme['text-hint-color']} />
                )}
                accessoryRight={EyeIcon}
              />
            </View>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
              <Text
                category="s2"
                style={{ color: theme['color-primary-500'] }}
              >
                {i18n.t('forgot_password', { defaultValue: 'Forgot Password?' })}
              </Text>
            </TouchableOpacity>

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Text status="danger" category="c1">
                  {error}
                </Text>
              </View>
            )}

            {/* Login Button */}
            <Button
              style={[styles.loginButton, { backgroundColor: theme['color-primary-500'] }]}
              onPress={handleLogin}
              disabled={isLoading}
              size="large"
              accessoryLeft={isLoading ? () => <Spinner size="small" status="control" /> : undefined}
            >
              {isLoading ? '' : i18n.t('login')}
            </Button>



            {/* Sign Up Link */}
            <View style={styles.signupContainer}>
              <Text category="s1" style={{ color: theme['text-hint-color'] }}>
                {`${i18n.t('no_account', { defaultValue: "Don't have an account?" })} `}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text category="s1"
                  style={{ color: theme['color-primary-500'], fontWeight: '600' }}
                >
                  {i18n.t('signup')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: spacing['3xl'],
    marginBottom: spacing['3xl'],
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    marginBottom: spacing.lg,
  },
  label: {
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  select: {
    borderRadius: borderRadius.lg,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
  },
  errorContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  loginButton: {
    borderRadius: borderRadius['2xl'],
    marginBottom: spacing.lg,
    borderWidth: 0,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  googleButton: {
    borderRadius: borderRadius['2xl'],
    marginBottom: spacing['2xl'],
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
