import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Select, SelectItem, IndexPath, Text, Icon, useTheme } from '@ui-kitten/components';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { selectLocale, setLocale, Locale } from '../redux/slices/appSlice';
import { i18n } from '../i18n';
import { spacing, borderRadius } from '../theme';

export const LANGUAGES: { label: string; value: Locale }[] = [
  { label: 'English', value: 'en' },
  { label: 'हिंदी (Hindi)', value: 'hi' },
  { label: 'বাংলা (Bengali)', value: 'bn' },
];

interface LanguageSelectorProps {
  style?: ViewStyle;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  showIcon?: boolean;
}

export const LanguageSelector = ({ 
  style, 
  size = 'large', 
  showLabel = true,
  showIcon = true
}: LanguageSelectorProps) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const currentLocale = useAppSelector(selectLocale);

  const languageIndex = LANGUAGES.findIndex((l) => l.value === currentLocale);

  const handleLanguageChange = (index: IndexPath | IndexPath[]) => {
    const selectedIndex = Array.isArray(index) ? index[0] : index;
    const newLocale = LANGUAGES[selectedIndex.row].value;
    dispatch(setLocale(newLocale));
  };

  const GlobeIcon = (props: any) => (
    <Icon {...props} name="globe-outline" fill={theme['text-hint-color']} />
  );

  return (
    <View style={[styles.container, style]}>
      {showLabel && (
        <Text category="label" style={styles.label}>
          {i18n.t('language', { defaultValue: 'Language' })}
        </Text>
      )}
      <Select
        selectedIndex={new IndexPath(languageIndex >= 0 ? languageIndex : 0)}
        onSelect={handleLanguageChange}
        value={LANGUAGES.find((l) => l.value === currentLocale)?.label}
        size={size}
        accessoryLeft={showIcon ? GlobeIcon : undefined}
        style={styles.select}
      >
        {LANGUAGES.map((lang) => (
          <SelectItem key={lang.value} title={lang.label} />
        ))}
      </Select>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  select: {
    borderRadius: borderRadius.lg,
  },
});
