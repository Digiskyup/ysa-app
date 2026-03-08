import React, { useState, useCallback, useEffect } from 'react';
import {
  Layout,
  Text,
  Button,
  Icon,
  Spinner,
  useTheme,
  Toggle,
} from '@ui-kitten/components';
import { NotificationBell } from '../../components/NotificationBell';
import { selectLocale } from '../../redux/slices/appSlice';
import { selectUserRole } from '../../redux/slices/authSlice';
import { useAppSelector } from '../../redux/hooks';
import { i18n } from '../../i18n';
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FilterChip } from '../../components/FilterChip';
import { AdminCard } from '../../components/AdminCard';
import { BottomSheetModal } from '../../components/BottomSheetModal';
import { EmptyState } from '../../components/EmptyState';
import { YInput } from '../../components/YInput';
import { User, UserRole, PermissionActions } from '../../types';
import UserService from '../../services/UserService';
import PermissionService from '../../services/PermissionService';
import { spacing, borderRadius } from '../../theme';

// Mock data for admins/staff

type AdminUser = User & { permissions: string[] };

type RoleFilter = 'all' | UserRole.ADMIN | UserRole.RECEPTIONIST;

const ROLE_FILTERS = [
  { label: 'all', getLabel: () => i18n.t('all') },
  { label: UserRole.ADMIN, getLabel: () => i18n.t('role_admin') },
  { label: UserRole.RECEPTIONIST, getLabel: () => i18n.t('role_receptionist') },
];

const ALL_PERMISSIONS = [
  { key: PermissionActions.STUDENT_CREATE, labelKey: 'perm_create_students' },
  { key: PermissionActions.STUDENT_READ, labelKey: 'perm_view_students' },
  { key: PermissionActions.STUDENT_UPDATE, labelKey: 'perm_update_students' },
  { key: PermissionActions.STUDENT_DELETE, labelKey: 'perm_delete_students' },
  { key: PermissionActions.PAYMENT_RECORD, labelKey: 'perm_record_payments' },
  { key: PermissionActions.PAYMENT_READ, labelKey: 'perm_view_payments' },
  { key: PermissionActions.PAYMENT_APPROVE, labelKey: 'perm_approve_payments' },
];

export const AdminsScreen = ({ isTabMode = false, triggerAdd = 0 }: any) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const locale = useAppSelector(selectLocale); // Listen for language changes
  const currentUserRole = useAppSelector(selectUserRole);
  const isSuperAdmin = currentUserRole === UserRole.SUPER_ADMIN;

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editedPermissions, setEditedPermissions] = useState<string[]>([]);
  const [filters] = useState(ROLE_FILTERS);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingStaff, setIsSavingStaff] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (triggerAdd > 0) {
      setAddModalVisible(true);
    }
  }, [triggerAdd]);

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const staff = await UserService.getStaff();
      // Cast to AdminUser[] assuming backend returns permissions for staff
      setAdmins(staff as AdminUser[]);
    } catch (error) {
      console.error('Failed to fetch staff', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Add form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<UserRole.ADMIN | UserRole.RECEPTIONIST>(UserRole.RECEPTIONIST);

  const filteredAdmins = admins.filter((admin) => {
    if (selectedRole === 'all') return true;
    return admin.role === selectedRole;
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStaff();
  }, []);

  const handleAdminPress = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setEditedPermissions([...(admin.permissions || [])]);
    setEditModalVisible(true);
  };

  const handleTogglePermission = (permission: string) => {
    setEditedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSavePermissions = async () => {
    if (selectedAdmin) {
      try {
        await PermissionService.grantPermissions(selectedAdmin._id, editedPermissions);
        setAdmins((prev) =>
          prev.map((a) =>
            a._id === selectedAdmin._id
              ? { ...a, permissions: editedPermissions }
              : a
          )
        );
        Alert.alert(i18n.t('success'), i18n.t('msg_permissions_updated'));
      } catch (err) {
        Alert.alert(i18n.t('error'), i18n.t('err_update_permissions'));
      }
    }
    setEditModalVisible(false);
  };

  const handleAddAdmin = async () => {
    if (!newName.trim() || !newEmail.trim() || (!selectedAdmin && !newPassword.trim())) {
      Alert.alert(i18n.t('error'), i18n.t('err_fill_required'));
      return;
    }
    setFieldErrors({});
    setIsSavingStaff(true);
    try {
      if (selectedAdmin) {
        // Update existing staff
        const updatedStaff = await UserService.updateStaff(selectedAdmin._id, {
          email: newEmail.trim(),
          name: newName.trim(),
          role: newRole,
          phone: newPhone.trim(),
        });
        setAdmins((prev) =>
          prev.map((a) => (a._id === selectedAdmin._id ? { ...a, ...updatedStaff } : a))
        );
        Alert.alert(i18n.t('success'), i18n.t('msg_staff_updated'));
      } else {
        // Create new staff
        const newAdmin = await UserService.createStaff({
          email: newEmail.trim(),
          name: newName.trim(),
          role: newRole,
          phone: newPhone.trim(),
          password: newPassword, 
        });
        setAdmins((prev) => [...prev, newAdmin as AdminUser]);
        Alert.alert(i18n.t('success'), i18n.t('msg_staff_created'));
      }
      setAddModalVisible(false);
      resetForm();
    } catch (error: any) {
      if (error.response?.status === 400 && error.response?.data?.error?.details) {
        setFieldErrors(error.response.data.error.details);
      } else {
        Alert.alert(i18n.t('error'), error.response?.data?.error?.message || error.message || i18n.t('err_create_staff'));
      }
    } finally {
      setIsSavingStaff(false);
    }
  };

  const resetForm = () => {
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewPassword('');
    setSelectedAdmin(null);
    setFieldErrors({});
  };

  const handleEditStaff = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setNewName(admin.name);
    setNewEmail(admin.email);
    setNewPhone(admin.phone || '');
    setNewRole(admin.role as UserRole.ADMIN | UserRole.RECEPTIONIST);
    setNewPassword('');
    setFieldErrors({});
    setEditModalVisible(false);
    // Add small delay to allow previous modal to close smoothly on some devices
    setTimeout(() => setAddModalVisible(true), 150);
  };

  const handleDeleteStaff = (admin: AdminUser) => {
    Alert.alert(
      i18n.t('confirm_delete'),
      i18n.t('msg_confirm_delete_staff'),
      [
        { text: i18n.t('cancel'), style: 'cancel' },
        {
          text: i18n.t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await UserService.deleteStaff(admin._id);
              setAdmins((prev) => prev.filter((a) => a._id !== admin._id));
              setEditModalVisible(false);
              Alert.alert(i18n.t('success'), i18n.t('msg_staff_deleted'));
            } catch (err) {
              Alert.alert(i18n.t('error'), i18n.t('err_delete_staff'));
            }
          },
        },
      ]
    );
  };

  const renderAdmin = ({ item }: { item: AdminUser }) => (
    <AdminCard admin={item} onPress={() => handleAdminPress(item)} />
  );

  return (
    <Layout style={[styles.container, !isTabMode && { paddingTop: insets.top }]}>
      {/* Header */}
      {!isTabMode && (
        <View style={styles.header}>
          <View>
            <Text category="h5" style={{ fontWeight: '700' }}>
              {i18n.t('nav_admins')}
            </Text>
            <Text category="c1" appearance="hint">
              {`${admins.length} ${i18n.t(admins.length === 1 ? 'staff_member' : 'staff_members')}`}
            </Text>
          </View>
          <NotificationBell />
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
              selected={selectedRole === item.label}
              onPress={() => setSelectedRole(item.label as RoleFilter)}
            />
          )}
          keyExtractor={(item) => item.label}
          contentContainerStyle={{ paddingHorizontal: spacing.lg }}
        />
      </View>

      {/* Admins List */}
      <FlatList
        data={filteredAdmins}
        renderItem={renderAdmin}
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
            icon="shield-outline"
            title={i18n.t('no_staff')}
            message={i18n.t('msg_no_staff_description')}
          />
        }
      />

      <BottomSheetModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        title={i18n.t('staff_details', { defaultValue: 'Staff Details' })}
      >
        {selectedAdmin && (
          <View style={styles.modalContent}>
            <View style={styles.adminInfo}>
              <Text category="s1" style={{ fontWeight: '600' }}>
                {selectedAdmin.name}
              </Text>
              <View
                style={[
                  styles.roleBadge,
                  {
                    backgroundColor:
                      selectedAdmin.role === UserRole.ADMIN
                        ? `${theme['color-info-500']}20`
                        : `${theme['color-primary-500']}20`,
                  },
                ]}
              >
                  <Text
                    category="c2"
                    style={{
                      color:
                        selectedAdmin.role === UserRole.ADMIN
                          ? theme['color-info-500']
                          : theme['color-primary-500'],
                      textTransform: 'capitalize',
                    }}
                  >
                    {i18n.t(`role_${selectedAdmin.role.toLowerCase()}`)}
                  </Text>
              </View>
            </View>

            {/* Actions Section - Moved up for visibility */}
            {isSuperAdmin && selectedAdmin.role !== UserRole.SUPER_ADMIN && (
              <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg }}>
                <Button 
                  style={{ flex: 1 }} 
                  appearance="outline"
                  size="small"
                  accessoryLeft={(props) => <Icon {...props} name="create-outline" />}
                  onPress={() => handleEditStaff(selectedAdmin)}
                >
                  {i18n.t('action_edit')}
                </Button>
                <Button 
                  style={{ flex: 1 }} 
                  status="danger" 
                  appearance="outline" 
                  size="small"
                  accessoryLeft={(props) => <Icon {...props} name="trash-outline" />}
                  onPress={() => handleDeleteStaff(selectedAdmin)}
                >
                  {i18n.t('action_delete')}
                </Button>
              </View>
            )}

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.lg, marginBottom: spacing.md }}>
              <Text category="s2" appearance="hint">
                {i18n.t('permissions')}
              </Text>
              <Button
                size="tiny"
                status="primary"
                accessoryLeft={(props) => <Icon {...props} name="save-outline" />}
                onPress={handleSavePermissions}
              >
                {i18n.t('save_permissions')}
              </Button>
            </View>

            {ALL_PERMISSIONS.map((perm) => (
              <View key={perm.key} style={styles.permissionRow}>
                <Text category="s1" style={{ flex: 1, marginRight: spacing.sm }}>{i18n.t(perm.labelKey)}</Text>
                <Toggle
                  checked={editedPermissions.includes(perm.key)}
                  onChange={() => handleTogglePermission(perm.key)}
                />
              </View>
            ))}
          </View>
        )}
      </BottomSheetModal>

      {/* Add Admin Modal */}
      <BottomSheetModal
        visible={addModalVisible}
        onClose={() => {
          setAddModalVisible(false);
          resetForm();
        }}
        title={selectedAdmin ? i18n.t('edit_staff') : i18n.t('add_staff')}
      >
        <View style={styles.modalContent}>
          <YInput
            label={i18n.t('full_name')}
            placeholder={i18n.t('placeholder_fullname')}
            value={newName}
            onChangeText={setNewName}
            style={{ marginBottom: spacing.lg }}
            status={fieldErrors.name ? 'danger' : 'basic'}
            caption={fieldErrors.name}
          />

          <YInput
            label={i18n.t('email')}
            placeholder={i18n.t('placeholder_email')}
            value={newEmail}
            onChangeText={setNewEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={{ marginBottom: spacing.lg }}
            status={fieldErrors.email ? 'danger' : 'basic'}
            caption={fieldErrors.email}
          />

          <YInput
            label={i18n.t('phone')}
            placeholder={i18n.t('placeholder_phone')}
            value={newPhone}
            onChangeText={setNewPhone}
            keyboardType="phone-pad"
            style={{ marginBottom: spacing.lg }}
            status={fieldErrors.phone ? 'danger' : 'basic'}
            caption={fieldErrors.phone}
          />

          {!selectedAdmin && (
            <YInput
              label={i18n.t('password')}
              placeholder={i18n.t('placeholder_temp_password')}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showPassword}
              style={{ marginBottom: spacing.lg }}
              status={fieldErrors.password ? 'danger' : 'basic'}
              caption={fieldErrors.password}
              accessoryRight={(props) => (
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Icon {...props} name={showPassword ? 'eye-outline' : 'eye-off-outline'} />
                </TouchableOpacity>
              )}
            />
          )}

          <Text category="label" style={{ marginBottom: spacing.sm }}>
            {i18n.t('role')}
          </Text>
          <View style={styles.roleSelector}>
            <TouchableOpacity
              style={[
                styles.roleOption,
                newRole === UserRole.RECEPTIONIST && {
                  backgroundColor: theme['color-primary-500'],
                },
              ]}
              onPress={() => setNewRole(UserRole.RECEPTIONIST)}
            >
              <Text
                category="s2"
                style={{
                  color: newRole === UserRole.RECEPTIONIST ? '#FFFFFF' : theme['text-basic-color'],
                }}
              >
                {`${i18n.t('role_receptionist')}`}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.roleOption,
                newRole === UserRole.ADMIN && {
                  backgroundColor: theme['color-info-500'],
                },
              ]}
              onPress={() => setNewRole(UserRole.ADMIN)}
            >
              <Text
                category="s2"
                style={{
                  color: newRole === UserRole.ADMIN ? '#FFFFFF' : theme['text-basic-color'],
                }}
              >
                {`${i18n.t('role_admin')}`}
              </Text>
            </TouchableOpacity>
          </View>

          <Button
            style={styles.saveButton}
            onPress={handleAddAdmin}
            disabled={isSavingStaff || !newName || !newEmail}
            accessoryLeft={isSavingStaff ? () => <Spinner size="small" status="control" /> : undefined}
          >
            {isSavingStaff ? '' : (selectedAdmin ? i18n.t('action_update_staff') : i18n.t('add_staff'))}
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
  filterContainer: {
    marginBottom: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
  },
  modalContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  adminInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roleBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.full,
  },
  permissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  saveButton: {
    marginTop: spacing.xl,
    borderRadius: borderRadius.xl,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  roleOption: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
});
