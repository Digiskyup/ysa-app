import React, { useState } from 'react';
import { i18n } from '../../i18n';
import {
  Layout,
  Text,
  Button,
  Avatar,
  Icon,
  Toggle,
  Select,
  SelectItem,
  IndexPath,
  useTheme,
} from '@ui-kitten/components';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import { logout, updateUser } from '../../redux/slices/authSlice';
import { toggleTheme, setLocale, selectTheme, selectLocale, Locale } from '../../redux/slices/appSlice';
import { BottomSheetModal } from '../../components/BottomSheetModal';
import UserService from '../../services/UserService';
import { YInput } from '../../components/YInput';
import { UserRole } from '../../types';
import { spacing, borderRadius, shadows } from '../../theme';

const LANGUAGES: { label: string; value: Locale }[] = [
  { label: 'English', value: 'en' },
  { label: 'हिंदी (Hindi)', value: 'hi' },
  { label: 'বাংলা (Bengali)', value: 'bn' },
];

export const ProfileScreen = ({ navigation }: any) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();

  const user = useAppSelector((state) => state.auth.user);
  const currentTheme = useAppSelector(selectTheme);
  const currentLocale = useAppSelector(selectLocale);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');

  const languageIndex = LANGUAGES.findIndex((l) => l.value === currentLocale);

  const getRoleBadgeColor = () => {
    switch (user?.role) {
      case UserRole.SUPER_ADMIN:
        return theme['color-danger-500'];
      case UserRole.ADMIN:
        return theme['color-info-500'];
      case UserRole.RECEPTIONIST:
        return theme['color-primary-500'];
      default:
        return theme['color-success-500'];
    }
  };

  const handleLogout = () => {
    Alert.alert(i18n.t('logout', { defaultValue: 'Logout' }), i18n.t('msg_confirm_logout', { defaultValue: 'Are you sure you want to logout?' }), [
      { text: i18n.t('action_cancel', { defaultValue: 'Cancel' }), style: 'cancel' },
      {
        text: i18n.t('logout', { defaultValue: 'Logout' }),
        style: 'destructive',
        onPress: () => {
          dispatch(logout());
        },
      },
    ]);
  };

  const handleSaveProfile = async () => {
    try {
      const updatedUser = await UserService.updateProfile({
        name: editName,
        phone: editPhone,
      });
      // Update the user in Redux store
      dispatch(updateUser({
        name: updatedUser.name,
        phone: updatedUser.phone,
      }));
      Alert.alert(i18n.t('success', { defaultValue: 'Success' }), i18n.t('msg_profile_updated', { defaultValue: 'Profile updated successfully!' }));
      setEditModalVisible(false);
    } catch (error) {
      console.error('Failed to update profile', error);
      Alert.alert(i18n.t('error', { defaultValue: 'Error' }), i18n.t('err_update_profile', { defaultValue: 'Failed to update profile' }));
    }
  };

  const handleLanguageChange = (index: IndexPath | IndexPath[]) => {
    const selectedIndex = Array.isArray(index) ? index[0] : index;
    dispatch(setLocale(LANGUAGES[selectedIndex.row].value));
  };

  const MenuItem = ({
    icon,
    title,
    onPress,
    accessory,
    danger = false,
  }: {
    icon: string;
    title: string;
    onPress?: () => void;
    accessory?: React.ReactNode;
    danger?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={accessory ? 1 : 0.7}
    >
      <View style={styles.menuItemLeft}>
        <Icon
          name={icon}
          fill={danger ? theme['color-danger-500'] : theme['text-hint-color']}
          style={styles.menuIcon}
        />
        <Text
          category="s1"
          style={{ color: danger ? theme['color-danger-500'] : theme['text-basic-color'] }}
        >
          {title}
        </Text>
      </View>
      {accessory || (
        <Icon
          name="chevron-forward-outline"
          fill={theme['text-hint-color']}
          style={styles.chevron}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <Layout style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.avatarContainer}>
            <Avatar
              source={
                user?.profileImage
                  ? { uri: user.profileImage }
                  : { uri: 'https://i.pravatar.cc/300' }
              }
              style={styles.avatar}
            />
            <View
              style={[
                styles.cameraButton,
                { backgroundColor: theme['color-primary-500'] },
              ]}
            >
              <Icon name="camera-outline" fill="#FFFFFF" style={styles.cameraIcon} />
            </View>
          </TouchableOpacity>

          <Text category="h5" style={styles.name}>
            {user?.name || i18n.t('guest_user', { defaultValue: 'Guest User' })}
          </Text>
          <Text category="s1" appearance="hint">
            {user?.email || i18n.t('no_email', { defaultValue: 'No email' })}
          </Text>

          {/* Role Badge */}
          <View
            style={[
              styles.roleBadge,
              { backgroundColor: `${getRoleBadgeColor()}20` },
            ]}
          >
            <Text
              category="s1"
              appearance="hint"
              style={{
                color: getRoleBadgeColor(),
                fontWeight: '600',
                textTransform: 'capitalize',
              }}
            >
              {user?.role ? i18n.t(`role_${user.role.replace('-', '_')}`) : i18n.t('role_student')}
            </Text>
          </View>
        </View>

        {/* Quick Stats (for students) */}
        {user?.role === UserRole.STUDENT && user.totalFees && (
          <View
            style={[
              styles.statsCard,
              { backgroundColor: theme['background-basic-color-2'] },
              shadows.sm,
            ]}
          >
            <View style={styles.statItem}>
              <Text category="c1" appearance="hint">
                {i18n.t('total_fees')}
              </Text>
              <Text category="s1" style={{ fontWeight: '600' }}>
                ₹{user.totalFees?.toLocaleString()}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text category="c1" appearance="hint">
                {i18n.t('fees_paid')}
              </Text>
              <Text category="s1" status="success" style={{ fontWeight: '600' }}>
                ₹{user.feesPaid?.toLocaleString() || 0}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text category="c1" appearance="hint">
                {i18n.t('fees_remaining')}
              </Text>
              <Text
                category="s1"
                status={(user.totalFees || 0) - (user.feesPaid || 0) > 0 ? 'danger' : 'success'}
                style={{ fontWeight: '600' }}
              >
                ₹{((user.totalFees || 0) - (user.feesPaid || 0)).toLocaleString()}
              </Text>
            </View>
          </View>
        )}

        {/* Menu Sections */}
        <View
          style={[
            styles.menuSection,
            { backgroundColor: theme['background-basic-color-2'] },
            shadows.sm,
          ]}
        >
          <MenuItem
            icon="person-outline"
            title={i18n.t('edit_profile')}
            onPress={() => setEditModalVisible(true)}
          />
          <MenuItem icon="notifications-outline" title={i18n.t('notifications')} />
          <MenuItem icon="shield-outline" title={i18n.t('privacy')} />
        </View>

        <View
          style={[
            styles.menuSection,
            { backgroundColor: theme['background-basic-color-2'] },
            shadows.sm,
          ]}
        >
          <MenuItem
            icon="moon-outline"
            title={i18n.t('dark_mode')}
            accessory={
              <Toggle
                checked={currentTheme === 'dark'}
                onChange={() => dispatch(toggleTheme())}
              />
            }
          />
          <MenuItem
            icon="globe-outline"
            title={i18n.t('language')}
            accessory={
              <Select
                selectedIndex={new IndexPath(languageIndex >= 0 ? languageIndex : 0)}
                onSelect={handleLanguageChange}
                value={LANGUAGES.find((l) => l.value === currentLocale)?.label}
                style={styles.languageSelect}
                size="small"
              >
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} title={lang.label} />
                ))}
              </Select>
            }
          />
        </View>

        <View
          style={[
            styles.menuSection,
            { backgroundColor: theme['background-basic-color-2'] },
            shadows.sm,
          ]}
        >
          <MenuItem icon="information-circle-outline" title={i18n.t('about')} />
          <MenuItem icon="help-circle-outline" title={i18n.t('help_support')} />
        </View>

        <View
          style={[
            styles.menuSection,
            { backgroundColor: theme['background-basic-color-2'] },
            shadows.sm,
          ]}
        >
          <MenuItem
            icon="log-out-outline"
            title={i18n.t('logout')}
            onPress={handleLogout}
            danger
          />
        </View>

        {/* App Version */}
        <Text category="c1" appearance="hint" style={styles.version}>
          Your Success Academy v1.0.0
        </Text>
      </ScrollView>

      {/* Edit Profile Modal */}
      <BottomSheetModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        title={i18n.t('edit_profile', { defaultValue: 'Edit Profile' })}
      >
        <View style={styles.modalContent}>
          <YInput
            label={i18n.t('full_name', { defaultValue: 'Full Name' })}
            placeholder={i18n.t('placeholder_fullname', { defaultValue: 'Enter your name' })}
            value={editName}
            onChangeText={setEditName}
            style={{ marginBottom: spacing.lg }}
          />

          <YInput
            label={i18n.t('phone', { defaultValue: 'Phone Number' })}
            placeholder={i18n.t('placeholder_phone', { defaultValue: 'Enter phone number' })}
            value={editPhone}
            onChangeText={setEditPhone}
            keyboardType="phone-pad"
            style={{ marginBottom: spacing.lg }}
          />

          <YInput
            label={i18n.t('email', { defaultValue: 'Email' })}
            value={user?.email || ''}
            disabled
            style={{ marginBottom: spacing.lg }}
          />

          <Button
            style={styles.saveButton}
            onPress={handleSaveProfile}
          >
            {i18n.t('action_save_changes', { defaultValue: 'Save Changes' })}
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
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    width: 16,
    height: 16,
  },
  name: {
    fontWeight: '700',
    marginBottom: spacing.xxs,
  },
  roleBadge: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statsCard: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: spacing.xs,
  },
  menuSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 22,
    height: 22,
    marginRight: spacing.md,
  },
  chevron: {
    width: 20,
    height: 20,
  },
  languageSelect: {
    width: 120,
  },
  version: {
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  modalContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  saveButton: {
    borderRadius: borderRadius.xl,
    marginTop: spacing.md,
  },
});
