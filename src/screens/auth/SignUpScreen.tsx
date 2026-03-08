import React, { useState } from 'react';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import {
  Layout,
  Text,
  Button,
  Icon,
  Select,
  SelectItem,
  IndexPath,
  Spinner,
  CheckBox,
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YInput } from '../../components/YInput';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { loginSuccess, setLoading, setError, clearError } from '../../redux/slices/authSlice';
import { UserRole, User } from '../../types';
import { AuthService } from '../../services/AuthService';
import { spacing, borderRadius } from '../../theme';
import { i18n } from '../../i18n';

// Only student self-signup by default
const SIGNUP_ROLES = [
  { label: 'Student', value: UserRole.STUDENT },
];

export const SignUpScreen = ({ navigation }: any) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRoleIndex, setSelectedRoleIndex] = useState<IndexPath>(new IndexPath(0));
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const selectedRole = SIGNUP_ROLES[selectedRoleIndex.row];

  React.useEffect(() => {
    GoogleSignin.configure({
      webClientId: '252145337666-jvhc0dgsp5n475a3l1oj4a0ericm49i9.apps.googleusercontent.com',
      offlineAccess: true,
    });
  }, []);

  const validateForm = (): boolean => {
    dispatch(clearError());

    if (!name.trim()) {
      dispatch(setError('Please enter your name'));
      return false;
    }

    if (!email.trim()) {
      dispatch(setError('Please enter your email'));
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      dispatch(setError('Please enter a valid email address'));
      return false;
    }

    if (!phone.trim()) {
      dispatch(setError('Please enter your phone number'));
      return false;
    }

    if (password.length < 8) {
      dispatch(setError('Password must be at least 8 characters'));
      return false;
    }

    if (password !== confirmPassword) {
      dispatch(setError('Passwords do not match'));
      return false;
    }

    if (!acceptTerms) {
      dispatch(setError('Please accept the terms and conditions'));
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    dispatch(setLoading(true));

    try {
      const response = await AuthService.signup({
        name: name.trim(),
        email: email.trim(),
        password: password,
        phone: phone.trim(),
        role: selectedRole.value,
      });
      
      dispatch(loginSuccess(response));
      // Navigation is handled automatically by AppNavigator
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || i18n.t('signup_failed', { defaultValue: 'Signup failed. Please try again.' });
      dispatch(setError(errorMessage));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleGoogleSignUp = async () => {
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
        dispatch(setLoading(false));
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // operation (e.g. sign in) is in progress already
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        dispatch(setError('Play services not available'));
        dispatch(setLoading(false));
      } else {
        dispatch(setError(error.message || i18n.t('google_signup_failed', { defaultValue: 'Google Sign-Up failed' })));
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
       dispatch(setError(err.message || i18n.t('google_signup_failed', { defaultValue: 'Google Sign-Up failed' })));
    } finally {
       dispatch(setLoading(false));
    }
  };

  const GoogleIcon = () => (
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
    <Layout style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header with Back Button */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Icon
                name="arrow-back"
                fill={theme['text-basic-color']}
                style={{ width: 24, height: 24 }}
              />
            </TouchableOpacity>
          </View>

          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Title Section */}
          <View style={styles.titleContainer}>
            <Text
              category="h4"
              style={[styles.title, { color: theme['text-basic-color'] }]}
            >
              {i18n.t('create_account', { defaultValue: 'Create Account' })}
            </Text>
            <Text
              category="s1"
              style={{ color: theme['text-hint-color'], marginTop: spacing.xs }}
            >
              {i18n.t('signup_to_start', { defaultValue: 'Sign up to get started' })}
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            {/* Name Input */}
            <View style={styles.inputWrapper}>
              <YInput
                label={i18n.t('full_name', { defaultValue: 'Full Name' })}
                placeholder={i18n.t('placeholder_fullname', { defaultValue: 'Enter your full name' })}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                accessoryLeft={(props: any) => (
                  <Icon {...props} name="person-outline" fill={theme['text-hint-color']} />
                )}
              />
            </View>

            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <YInput
                label={i18n.t('email', { defaultValue: 'Email' })}
                placeholder={i18n.t('placeholder_email', { defaultValue: 'Enter your email' })}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                accessoryLeft={(props: any) => (
                  <Icon {...props} name="mail-outline" fill={theme['text-hint-color']} />
                )}
              />
            </View>

            {/* Phone Input */}
            <View style={styles.inputWrapper}>
              <YInput
                label={i18n.t('phone', { defaultValue: 'Phone Number' })}
                placeholder={i18n.t('placeholder_phone', { defaultValue: 'Enter your phone number' })}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                accessoryLeft={(props: any) => (
                  <Icon {...props} name="call-outline" fill={theme['text-hint-color']} />
                )}
              />
            </View>

            {/* Role Selector */}
            <View style={styles.inputWrapper}>
              <Text category="label" style={styles.label}>
                {i18n.t('register_as', { defaultValue: 'Register As' })}
              </Text>
              <Select
                selectedIndex={selectedRoleIndex}
                onSelect={(index) => setSelectedRoleIndex(index as IndexPath)}
                value={selectedRole.label}
                style={styles.select}
                size="large"
                accessoryLeft={(props: any) => (
                  <Icon {...props} name="person-outline" fill={theme['text-hint-color']} />
                )}
              >
                {SIGNUP_ROLES.map((role) => (
                  <SelectItem key={role.value} title={role.label} />
                ))}
              </Select>
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <YInput
                label={i18n.t('password', { defaultValue: 'Password' })}
                placeholder={i18n.t('placeholder_create_password', { defaultValue: 'Create a password' })}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                accessoryLeft={(props: any) => (
                  <Icon {...props} name="lock-closed-outline" fill={theme['text-hint-color']} />
                )}
                accessoryRight={EyeIcon}
              />
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputWrapper}>
              <YInput
                label={i18n.t('confirm_password', { defaultValue: 'Confirm Password' })}
                placeholder={i18n.t('placeholder_confirm_password', { defaultValue: 'Confirm your password' })}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                accessoryLeft={(props: any) => (
                  <Icon {...props} name="lock-closed-outline" fill={theme['text-hint-color']} />
                )}
              />
            </View>

            {/* Terms Checkbox */}
            <View style={styles.termsContainer}>
              <CheckBox
                checked={acceptTerms}
                onChange={setAcceptTerms}
                status="primary"
              >
                {() => (
                  <Text category="c1" style={styles.termsText}>
                    {`${i18n.t('agree_to', { defaultValue: 'I agree to the' })} `}
                    <Text
                      style={{ color: theme['color-primary-500'] }}
                      category="c1"
                    >
                      {i18n.t('terms_of_service', { defaultValue: 'Terms of Service' })}
                    </Text>
                    {` ${i18n.t('and', { defaultValue: 'and' })} `}
                    <Text
                      style={{ color: theme['color-primary-500'] }}
                      category="c1"
                    >
                      {i18n.t('privacy_policy', { defaultValue: 'Privacy Policy' })}
                    </Text>
                  </Text>
                )}
              </CheckBox>
            </View>

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Text status="danger" category="c1">
                  {error}
                </Text>
              </View>
            )}

            {/* Sign Up Button */}
            <Button
              style={[styles.signupButton, { backgroundColor: theme['color-primary-500'] }]}
              onPress={handleSignUp}
              disabled={isLoading}
              size="large"
              accessoryLeft={isLoading ? () => <Spinner size="small" status="control" /> : undefined}
            >
              {isLoading ? '' : i18n.t('create_account', { defaultValue: 'Create Account' })}
            </Button>



            {/* Sign In Link */}
            <View style={styles.signinContainer}>
              <Text category="s1" style={{ color: theme['text-hint-color'] }}>
                {`${i18n.t('already_have_account', { defaultValue: 'Already have an account?' })} `}
              </Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text
                  category="s1"
                  style={{ color: theme['color-primary-500'], fontWeight: '600' }}
                >
                  {i18n.t('signin', { defaultValue: 'Sign In' })}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  backButton: {
    padding: spacing.xs,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logo: {
    width: 100,
    height: 100,
  },
  titleContainer: {
    marginBottom: spacing['2xl'],
  },
  title: {
    fontWeight: '700',
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
  termsContainer: {
    marginBottom: spacing.lg,
  },
  termsText: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  errorContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  signupButton: {
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
  signinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
