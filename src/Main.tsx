import React, { useEffect } from 'react';
import * as eva from '@eva-design/eva';
import { ApplicationProvider, IconRegistry } from '@ui-kitten/components';
import { IoniconsPack } from './utils/IoniconsPack';
import { EvaIconsPack } from '@ui-kitten/eva-icons';
import { useAppSelector } from './redux/hooks';
import { customLightTheme, customDarkTheme } from './theme/theme';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './navigation/AppNavigator';
import NotificationService from './services/NotificationService';
import { i18n } from './i18n';
import { selectLocale } from './redux/slices/appSlice';
import apiClient from './services/api/client';
export const Main = () => {
  const themeMode = useAppSelector((state) => state.app.theme);
  const locale = useAppSelector(selectLocale);
  const theme = themeMode === 'light' ? customLightTheme : customDarkTheme;

  // Set synchronously during render so children receive updated locale immediately
  i18n.locale = locale;

  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    // Initialize notifications
    const initPush = async () => {
      const token = await NotificationService.registerForPushNotifications();
      if (token && isAuthenticated) {
        try {
          await apiClient.put('/users/me', { fcmToken: token });
        } catch (e) {
          console.error('Failed to sync push token', e);
        }
      }
    };
    
    initPush();
    NotificationService.setupNotificationListeners();

    return () => {
      NotificationService.removeNotificationListeners();
    };
  }, [isAuthenticated]);

  return (
    <SafeAreaProvider>
      <IconRegistry icons={[EvaIconsPack, IoniconsPack]} />
      <ApplicationProvider {...eva} theme={theme}>
        <StatusBar style={themeMode === 'light' ? 'dark' : 'light'} />
        <AppNavigator />
      </ApplicationProvider>
    </SafeAreaProvider>
  );
};
