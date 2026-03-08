import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Layout, Text, useTheme } from '@ui-kitten/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NotificationList } from '../../components/NotificationList';
import { NotificationBell } from '../../components/NotificationBell';
import { i18n } from '../../i18n';
import { spacing } from '../../theme';

export const NotificationsScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();

  return (
    <Layout style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text category="h5" style={{ fontWeight: '700' }}>
          {i18n.t('notifications')}
        </Text>
        <NotificationBell />
      </View>
      <View style={styles.listContainer}>
        {/* We reuse the internal component to prevent duplicate Redux mapping code */}
        <NotificationList onItemPress={() => {}} />
      </View>
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
  listContainer: {
    flex: 1,
  },
});
