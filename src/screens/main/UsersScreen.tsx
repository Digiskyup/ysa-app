import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Layout, Tab, TabView, Text, useTheme, Button, Icon } from '@ui-kitten/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StudentsScreen } from './StudentsScreen';
import { AdminsScreen } from './AdminsScreen';
import { NotificationBell } from '../../components/NotificationBell';
import { useAppSelector } from '../../redux/hooks';
import { selectLocale } from '../../redux/slices/appSlice';
import { i18n } from '../../i18n';
import { spacing, borderRadius } from '../../theme';

export const UsersScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const locale = useAppSelector(selectLocale); // Listen for language changes
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [adminAddTrigger, setAdminAddTrigger] = useState(0);
  const [studentAddTrigger, setStudentAddTrigger] = useState(0);

  const handleAddPress = () => {
    if (selectedIndex === 0) {
      // Students tab
      setStudentAddTrigger(prev => prev + 1);
    } else {
      // Admins tab
      setAdminAddTrigger(prev => prev + 1);
    }
  };

  return (
    <Layout style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text category="h5" style={{ fontWeight: '700' }}>
          {i18n.t('users_title')}
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
          <Button
            size="medium"
            status="primary"
            accessoryLeft={(props: any) => <Icon {...props} name="add-outline" />}
            onPress={handleAddPress}
            style={{ borderRadius: 30, width: 34, height: 34, paddingHorizontal: 0 }}
          />
          <NotificationBell />
        </View>
      </View>
      <TabView
        selectedIndex={selectedIndex}
        onSelect={index => setSelectedIndex(index)}
        style={{ flex: 1 }}
      >
        <Tab title={i18n.t('nav_students')}>
          <Layout style={styles.tabContainer}>
            <StudentsScreen navigation={navigation} isTabMode={true} triggerAdd={studentAddTrigger} />
          </Layout>
        </Tab>
        <Tab title={i18n.t('nav_admins')}>
          <Layout style={styles.tabContainer}>
            <AdminsScreen navigation={navigation} isTabMode={true} triggerAdd={adminAddTrigger} />
          </Layout>
        </Tab>
      </TabView>
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
});
