import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon, Text, useTheme } from '@ui-kitten/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, borderRadius, shadows } from '../theme';

type TabConfig = {
  name: string;
  icon: string;
  label?: string;
};

interface CustomBottomBarProps {
  state: any;
  descriptors: any;
  navigation: any;
  tabs: TabConfig[];
}

export const CustomBottomBar = ({
  state,
  descriptors,
  navigation,
  tabs,
}: CustomBottomBarProps) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom || 16 }]}>
      <View
        style={[
          styles.content,
          {
            backgroundColor: theme['background-basic-color-1'],
            borderColor: theme['border-basic-color-1'],
          },
          shadows.lg,
        ]}
      >
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const tabConfig = tabs[index];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={index}
              onPress={onPress}
              style={[
                styles.tab,
                isFocused && {
                  backgroundColor: theme['color-primary-500'],
                },
              ]}
            >
              <Icon
                name={tabConfig?.icon || 'grid'}
                style={styles.icon}
                fill={isFocused ? '#FFFFFF' : theme['text-hint-color']}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    borderRadius: borderRadius['3xl'],
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md, 
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 15,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius['2xl'],
    marginHorizontal: spacing.xxs,
  },
  icon: {
    width: 22,
    height: 22,
  },
  label: {
    marginLeft: spacing.xs,
    fontWeight: '600',
    fontSize: 12,
  },
});
