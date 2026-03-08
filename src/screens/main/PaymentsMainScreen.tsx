import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Layout, Tab, TabView, Text, Button, Icon, useTheme } from '@ui-kitten/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PaymentsScreen } from './PaymentsScreen';
import { ApprovalsScreen } from './ApprovalsScreen';
import { NotificationBell } from '../../components/NotificationBell';
import { useAppSelector } from '../../redux/hooks';
import { selectLocale } from '../../redux/slices/appSlice';
import { i18n } from '../../i18n';
import { spacing } from '../../theme';

export const PaymentsMainScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const locale = useAppSelector(selectLocale); // Listen for language changes
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <Layout style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text category="h5" style={{ fontWeight: '700' }}>
          {i18n.t('payments_title')}
        </Text>
        <NotificationBell />
      </View>
      <TabView
        selectedIndex={selectedIndex}
        onSelect={index => setSelectedIndex(index)}
        style={{ flex: 1 }}
      >
        <Tab title={i18n.t('payments_title')}>
          <Layout style={styles.tabContainer}>
            <PaymentsScreen navigation={navigation} isTabMode={true} />
          </Layout>
        </Tab>
        <Tab title={i18n.t('approvals_title')}>
          <Layout style={styles.tabContainer}>
            <ApprovalsScreen navigation={navigation} isTabMode={true} />
          </Layout>
        </Tab>
      </TabView>
      
      {/* Floating Action Button */}
      <Button
        style={styles.fab}
        status="primary"
        accessoryLeft={(props: any) => <Icon {...props} name="plus" />}
        onPress={() => navigation.navigate('AddPayment')}
      />
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
  tabContainer: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});
