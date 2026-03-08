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

export const Main = () => {
  const themeMode = useAppSelector((state) => state.app.theme);
  const locale = useAppSelector(selectLocale);
  const theme = themeMode === 'light' ? customLightTheme : customDarkTheme;

  // Set synchronously during render so children receive updated locale immediately
  i18n.locale = locale;

  useEffect(() => {
    // Initialize notifications
    NotificationService.registerForPushNotifications();
    NotificationService.setupNotificationListeners();

    return () => {
      NotificationService.removeNotificationListeners();
    };
  }, []);

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
