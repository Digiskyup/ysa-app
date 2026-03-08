import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { BottomTabNavigator } from './BottomTabNavigator';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
import { useAppSelector } from '../redux/hooks';

const Stack = createStackNavigator();

export const AppNavigator = () => {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // Auth Stack
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          </>
        ) : (
          // Main App Stack
          <>
            <Stack.Screen name="Main" component={BottomTabNavigator} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
