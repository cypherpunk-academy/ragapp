import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { lightColors, darkColors, spacing, textStyles } from '../theme';

export type TabId = 'search' | 'overview' | 'read' | 'chat';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

const TABS: { id: TabId; label: string; icon: MaterialIconName }[] = [
  { id: 'search',   label: 'SUCHE',     icon: 'search' },
  { id: 'overview', label: 'ÜBERSICHT', icon: 'dashboard' },
  { id: 'read',     label: 'LESEN',     icon: 'menu-book' },
  { id: 'chat',     label: 'KI-CHAT',   icon: 'chat' },
];

type Props = {
  activeIndex: number;
  onTabPress: (index: number) => void;
};

export default function TabBar({ activeIndex, onTabPress }: Props) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: colors.surface,
        borderTopColor: colors.outlineVariant,
        paddingBottom: Math.max(insets.bottom, spacing.l),
      },
    ]}>
      {TABS.map((tab, index) => {
        const isActive = index === activeIndex;
        const color = isActive ? colors.primary : colors.onSurfaceVariant;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => onTabPress(index)}
            activeOpacity={0.7}
          >
            <MaterialIcons name={tab.icon} size={24} color={color} />
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
