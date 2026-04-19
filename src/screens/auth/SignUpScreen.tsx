import React, { useState } from 'react';
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
  Alert,
  ActionSheetIOS,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { YInput } from '../../components/YInput';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { setLoading, setError, clearError } from '../../redux/slices/authSlice';
import { UserRole } from '../../types';
import { AuthService } from '../../services/AuthService';
import { spacing, borderRadius } from '../../theme';
import { i18n } from '../../i18n';
import { LanguageSelector } from '../../components/LanguageSelector';

async function compressImage(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 500 } }],
    { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
}

const SIGNUP_ROLES = [
  { label: 'Student', value: UserRole.STUDENT },
  { label: 'Staff (Receptionist)', value: UserRole.RECEPTIONIST },
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
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);

  const selectedRole = SIGNUP_ROLES[selectedRoleIndex.row];

  const handlePickImage = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Gallery'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) openCamera();
          else if (buttonIndex === 2) openGallery();
        }
      );
    } else {
      Alert.alert('Profile Photo', 'Choose an option', [
        { text: 'Take Photo', onPress: openCamera },
        { text: 'Choose from Gallery', onPress: openGallery },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const openCamera = () => {
    launchCamera({ mediaType: 'photo', quality: 0.8, saveToPhotos: false }, (response) => {
      if (response.assets && response.assets[0]?.uri) {
        (async () => {
          const compressed = await compressImage(response.assets![0].uri!);
          setProfileImageUri(compressed);
        })();
      }
    });
  };

  const openGallery = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8, selectionLimit: 1 }, (response) => {
      if (response.assets && response.assets[0]?.uri) {
        (async () => {
          const compressed = await compressImage(response.assets![0].uri!);
          setProfileImageUri(compressed);
        })();
      }
    });
  };

  const validateForm = (): boolean => {
    dispatch(clearError());

    if (!name.trim()) {
      dispatch(setError(i18n.t('err_enter_name')));
      return false;
    }

    if (!email.trim()) {
      dispatch(setError(i18n.t('err_enter_email')));
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      dispatch(setError(i18n.t('err_invalid_email')));
      return false;
    }

    if (!phone.trim()) {
      dispatch(setError(i18n.t('err_enter_phone')));
      return false;
    }

    if (password.length < 8) {
      dispatch(setError(i18n.t('err_password_too_short')));
      return false;
    }

    if (password !== confirmPassword) {
      dispatch(setError(i18n.t('err_passwords_dont_match')));
      return false;
    }

    if (!acceptTerms) {
      dispatch(setError(i18n.t('err_accept_terms')));
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    dispatch(setLoading(true));

    try {
      await AuthService.signup({
        name: name.trim(),
        email: email.trim(),
        password: password,
        phone: phone.trim(),
        role: selectedRole.value,
        profileImageUri: profileImageUri || undefined,
      });

      // Account is pending approval — show success message and go back to login
      Alert.alert(
        'Account Created',
        'Your account has been submitted for approval. You will receive a notification once your account is approved by the administrator.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (err: any) {
      let errorMessage = err.response?.data?.error?.message || err.message || i18n.t('err_signup_failed');
      const details = err.response?.data?.error?.details;
      if (details && Object.keys(details).length > 0) {
        errorMessage = Object.values(details)[0] as string;
      }
      dispatch(setError(errorMessage));
    } finally {
      dispatch(setLoading(false));
    }
  };

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

          {/* Title Section */}
          <View style={styles.titleContainer}>
            <Text category="h4" style={[styles.title, { color: theme['text-basic-color'] }]}>
              {i18n.t('create_account')}
            </Text>
            <Text category="s1" style={{ color: theme['text-hint-color'], marginTop: spacing.xs }}>
              {i18n.t('signup_to_start')}
            </Text>
          </View>

          {/* Profile Image Picker */}
          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={handlePickImage} style={styles.avatarWrapper}>
              {profileImageUri ? (
                <Image source={{ uri: profileImageUri }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: theme['background-basic-color-3'] }]}>
                  <Icon name="person-outline" fill={theme['text-hint-color']} style={{ width: 40, height: 40 }} />
                </View>
              )}
              <View style={[styles.cameraIconBadge, { backgroundColor: theme['color-primary-500'] }]}>
                <Icon name="camera-outline" fill="white" style={{ width: 16, height: 16 }} />
              </View>
            </TouchableOpacity>
            <Text category="c1" appearance="hint" style={{ marginTop: spacing.xs }}>
              {i18n.t('add_profile_photo', { defaultValue: 'Add Profile Photo' })}
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            {/* Name Input */}
            <View style={styles.inputWrapper}>
              <YInput
                label={i18n.t('full_name')}
                placeholder={i18n.t('placeholder_fullname')}
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
                label={i18n.t('email')}
                placeholder={i18n.t('placeholder_email')}
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
                label={i18n.t('phone')}
                placeholder={i18n.t('placeholder_phone')}
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
                {i18n.t('register_as')}
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
                label={i18n.t('password')}
                placeholder={i18n.t('placeholder_create_password')}
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
                label={i18n.t('confirm_password')}
                placeholder={i18n.t('confirm_password')}
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
              <CheckBox checked={acceptTerms} onChange={setAcceptTerms} status="primary">
                {() => (
                  <Text category="c1" style={styles.termsText}>
                    {`${i18n.t('agree_to')} `}
                    <Text style={{ color: theme['color-primary-500'] }} category="c1">
                      {i18n.t('terms_of_service')}
                    </Text>
                    {` ${i18n.t('and')} `}
                    <Text style={{ color: theme['color-primary-500'] }} category="c1">
                      {i18n.t('privacy_policy')}
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
              <View style={{ flexDirection: 'row' }}>
                <Text category="s1" style={{ color: theme['text-hint-color'] }}>
                  {`${i18n.t('already_have_account')} `}
                </Text>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                  <Text category="s1" style={{ color: theme['color-primary-500'], fontWeight: '600' }}>
                    {i18n.t('signin')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Language Selector */}
            <View style={styles.languageContainer}>
              <LanguageSelector style={{ width: 160, alignSelf: 'center' }} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
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
  backButton: { padding: spacing.xs },
  titleContainer: { marginBottom: spacing.xl },
  title: { fontWeight: '700' },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: { width: '100%' },
  inputWrapper: { marginBottom: spacing.lg },
  label: { marginBottom: spacing.xs, fontWeight: '500' },
  select: { borderRadius: borderRadius.lg },
  termsContainer: { marginBottom: spacing.lg },
  termsText: { marginLeft: spacing.sm, flex: 1 },
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
  signinContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  languageContainer: {
    marginTop: spacing['2xl'],
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: spacing.xl,
  },
});
