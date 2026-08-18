import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { lightColors, darkColors, spacing, textStyles } from '../theme';
import { ICONS, ICON_SIZES, type MaterialIconName } from '../theme';
import { assistant, assistantAccentColor } from '@/shared/lib/assistant';

export type TabId = 'overview' | 'read' | 'chat' | 'search';

type Props = {
  activeIndex: number;
  onTabPress: (index: number) => void;
};

export default function TabBar({ activeIndex, onTabPress }: Props) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const insets = useSafeAreaInsets();

  const tabs: { id: TabId; label: string; icon: MaterialIconName }[] = [
    { id: 'chat', label: assistant.firstName, icon: ICONS.tab.chat },
    { id: 'overview', label: t('tabs.books'), icon: ICONS.tab.overview },
    { id: 'read', label: t('tabs.read'), icon: ICONS.tab.read },
    { id: 'search', label: t('tabs.search'), icon: ICONS.tab.search },
  ];

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: colors.surface,
        borderTopColor: colors.outlineVariant,
        paddingBottom: Math.max(insets.bottom, spacing.l),
      },
    ]}>
      {tabs.map((tab, index) => {
        const isActive = index === activeIndex;
        const isDark = colorScheme === 'dark';
        const color = tab.id === 'chat'
          ? assistantAccentColor(colors, isDark, isActive)
          : isActive ? colors.primary : colors.onSurfaceVariant;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => onTabPress(index)}
            activeOpacity={0.7}
          >
            <MaterialIcons name={tab.icon} size={ICON_SIZES.tabBar} color={color} />
            <Text style={[textStyles.labelTab, { color }]} numberOfLines={1}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.s,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: 4,
  },
});
