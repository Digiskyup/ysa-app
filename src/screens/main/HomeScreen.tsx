import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Layout, Text, Button, Icon, useTheme } from '@ui-kitten/components';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSelector } from '../../redux/hooks';
import { selectLocale } from '../../redux/slices/appSlice';
import { i18n } from '../../i18n';
import { spacing, borderRadius, shadows } from '../../theme';
import { UserRole, PaymentStatus, ApprovalStatus } from '../../types';
import { UserService } from '../../services/UserService';
import { PaymentService } from '../../services/PaymentService';
import { PermissionService } from '../../services/PermissionService';
import { UnifiedApprovalCard, UnifiedApprovalItem } from '../../components/UnifiedApprovalCard';
import { ApprovalDetailModal } from '../../components/ApprovalDetailModal';

export const HomeScreen = ({ navigation }: any) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAppSelector((state) => state.auth.user);
  const locale = useAppSelector(selectLocale); // Listen for language changes to trigger re-renders
  const [pendingCount, setPendingCount] = useState(0);
  const [approvals, setApprovals] = useState<UnifiedApprovalItem[]>([]);
  const [selectedApproval, setSelectedApproval] = useState<UnifiedApprovalItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const getDisplayName = (person: any) => {
    return (person && typeof person === 'object' && 'name' in person) ? person.name : 'Unknown';
  };

  const fetchAllApprovals = useCallback(async () => {
    if (user?.role !== UserRole.SUPER_ADMIN) return;

    try {
      const [users, paymentsResult, permissionsResult] = await Promise.all([
        UserService.getPendingUsers(),
        PaymentService.getPayments({ status: PaymentStatus.PENDING_APPROVAL, limit: 10 }),
        PermissionService.getApprovals({ status: ApprovalStatus.PENDING, limit: 10 })
      ]);

      const mappedUsers: UnifiedApprovalItem[] = users.map(u => ({
        id: u._id,
        type: 'signup',
        title: u.name,
        subtitle: u.email,
        date: u.createdAt,
        status: u.status || '',
        data: u
      }));

      const mappedPayments: UnifiedApprovalItem[] = paymentsResult.data.map(p => ({
        id: p._id,
        type: 'payment',
        title: `Payment: ₹${p.amount}`,
        subtitle: `From ${getDisplayName(p.studentId)}`,
        date: p.createdAt,
        status: p.status,
        data: p
      }));

      const mappedPermissions: UnifiedApprovalItem[] = permissionsResult.data.map(r => ({
        id: r._id,
        type: 'permission',
        title: r.action,
        subtitle: `Requested by ${getDisplayName(r.requestedBy)}`,
        date: r.createdAt,
        status: r.status,
        data: r
      }));

      const all = [...mappedUsers, ...mappedPayments, ...mappedPermissions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setApprovals(all.slice(0, 5));
      setPendingCount(all.length);
    } catch (error) {
       console.error('Failed to fetch approvals', error);
    }
  }, [user?.role]);

  useFocusEffect(
    useCallback(() => {
      fetchAllApprovals();
    }, [fetchAllApprovals])
  );

  const QuickAction = ({ icon, title, onPress, color }: any) => (
    <TouchableOpacity 
      style={[styles.actionCard, { backgroundColor: theme['background-basic-color-2'] }, shadows.sm]}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        <Icon name={icon} fill={color} style={{ width: 24, height: 24 }} />
      </View>
      <Text category="s1" style={{ marginTop: spacing.md, fontWeight: '600' }}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <Layout style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
            <View>
                <Text category='h5' style={{ fontWeight: '700' }}>{`Hello, ${user?.name?.split(' ')[0] || 'Guest'}`}</Text>
                <Text category='s1' appearance='hint'>{i18n.t('welcome_back')}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
               <Icon name="person-outline" fill={theme['text-basic-color']} style={{ width: 28, height: 28 }} />
            </TouchableOpacity>
        </View>

        {/* Banner */}
        <View style={[styles.banner, { backgroundColor: theme['color-primary-500'] }]}>
          <View style={{ flex: 1 }}>
            <Text category="h6" style={{ color: 'white', marginBottom: spacing.xs }}>{i18n.t('banner_title', { defaultValue: 'Your Success Academy' })}</Text>
            <Text category="c1" style={{ color: 'white', opacity: 0.9 }}>{i18n.t('banner_subtitle', { defaultValue: 'Manage your education journey efficiently.' })}</Text>
          </View>
          <Icon name="book-outline" fill="white" style={{ width: 48, height: 48, opacity: 0.8 }} />
        </View>

        {user?.role === UserRole.SUPER_ADMIN ? (
          <>
            <Text category='h6' style={styles.sectionTitle}>{i18n.t('dashboard', { defaultValue: 'Dashboard' })}</Text>
            <View style={[styles.emptyCard, { backgroundColor: theme['background-basic-color-2'], marginBottom: spacing.xl }]}>
                <Icon name="pie-chart-outline" fill={theme['text-hint-color']} style={{ width: 48, height: 48, marginBottom: spacing.md }} />
                <Text appearance="hint">{i18n.t('dashboard_metrics', { defaultValue: 'Payment Metrics Chart' })}</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <Text category='h6' style={{ fontWeight: '700' }}>{i18n.t('latest_approvals', { defaultValue: 'Latest Approvals' })}</Text>
              {pendingCount > 5 && (
                <Button size="tiny" appearance="ghost" onPress={() => navigation.navigate('PendingApprovals')}>
                  View All
                </Button>
              )}
            </View>

            {approvals.length > 0 ? (
              <View style={{ marginBottom: spacing.xl }}>
                {approvals.map(item => (
                  <UnifiedApprovalCard 
                    key={`${item.type}-${item.id}`} 
                    item={item} 
                    onPress={() => {
                      setSelectedApproval(item);
                      setModalVisible(true);
                    }}
                  />
                ))}
              </View>
            ) : (
              <View style={[styles.emptyCard, { backgroundColor: theme['background-basic-color-2'], marginBottom: spacing.xl }]}>
                  <Icon name="checkmark-circle-outline" fill={theme['color-success-500']} style={{ width: 48, height: 48, marginBottom: spacing.md }} />
                  <Text appearance="hint">{i18n.t('no_pending_signups', { defaultValue: 'No pending approvals' })}</Text>
              </View>
            )}

            <Text category='h6' style={styles.sectionTitle}>{i18n.t('quick_actions', { defaultValue: 'Quick Actions' })}</Text>
            <View style={styles.actionsGrid}>
               <QuickAction
                 icon="person-add-outline"
                 title={i18n.t('action_add_student', { defaultValue: 'Add Student' })}
                 color={theme['color-info-500']}
                 onPress={() => navigation.navigate('Users')}
               />
               <QuickAction
                 icon="shield-outline"
                 title={i18n.t('add_staff', { defaultValue: 'Add Staff Member' })}
                 color={theme['color-warning-500']}
                 onPress={() => navigation.navigate('Users')}
               />
               <QuickAction
                 icon="add-circle-outline"
                 title={i18n.t('action_add_payment', { defaultValue: 'Add Payment' })}
                 color={theme['color-success-500']}
                 onPress={() => navigation.navigate('AddPayment')}
               />
               <QuickAction
                 icon="checkmark-circle-outline"
                 title={`Approvals${pendingCount > 0 ? ` (${pendingCount})` : ''}`}
                 color={pendingCount > 0 ? theme['color-danger-500'] : theme['color-basic-500']}
                 onPress={() => navigation.navigate('PendingApprovals')}
               />
            </View>
          </>
        ) : (
          <>
            <Text category='h6' style={styles.sectionTitle}>{i18n.t('quick_actions', { defaultValue: 'Quick Actions' })}</Text>
            <View style={styles.actionsGrid}>
               {user?.role !== UserRole.STUDENT && (
                 <QuickAction 
                   icon="people-outline" 
                   title={i18n.t('nav_students', { defaultValue: 'Students' })} 
                   color={theme['color-info-500']}
                   onPress={() => navigation.navigate('Students')}
                 />
               )}
               <QuickAction 
                 icon="card-outline" 
                 title={i18n.t('nav_payments', { defaultValue: 'Payments' })} 
                 color={theme['color-success-500']}
                 onPress={() => navigation.navigate('Payments')}
               />
               {(user?.role === UserRole.ADMIN) && (
                 <QuickAction
                   icon="shield-outline"
                   title={i18n.t('nav_admins', { defaultValue: 'Staff' })}
                   color={theme['color-warning-500']}
                   onPress={() => navigation.navigate('Admins')}
                 />
               )}
               {user?.role !== UserRole.STUDENT && (
                 <QuickAction
                   icon="desktop-outline"
                   title={i18n.t('kiosk_launch', { defaultValue: 'Kiosk Mode' })}
                   color={theme['color-danger-500']}
                   onPress={() => navigation.navigate('AttendanceTerminal')}
                 />
               )}
               <QuickAction
                 icon="settings-outline"
                 title={i18n.t('nav_profile', { defaultValue: 'Profile' })}
                 color={theme['color-primary-500']}
                 onPress={() => navigation.navigate('Profile')}
               />
            </View>
          </>
        )}

        {/* Recent Activity Placeholder */}
        <Text category='h6' style={styles.sectionTitle}>{i18n.t('recent_updates', { defaultValue: 'Recent Updates' })}</Text>
        <View style={[styles.emptyCard, { backgroundColor: theme['background-basic-color-2'] }]}>
            <Text appearance="hint">{i18n.t('no_recent_updates', { defaultValue: 'No recent updates' })}</Text>
        </View>

      </ScrollView>

      <ApprovalDetailModal 
        visible={modalVisible} 
        item={selectedApproval}
        onClose={() => setModalVisible(false)}
        onActionSuccess={fetchAllApprovals}
      />
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
  },
  scrollContent: {
      padding: spacing.lg,
      paddingBottom: 100
  },
  header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xl,
      marginTop: spacing.md
  },
  banner: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  sectionTitle: {
      marginBottom: spacing.md,
      fontWeight: '700'
  },
  actionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
      marginBottom: spacing.xl,
  },
  actionCard: {
      width: '47%',
      padding: spacing.lg,
      borderRadius: borderRadius.lg,
      alignItems: 'flex-start',
  },
  iconContainer: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  emptyCard: {
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)'
  }
});
