import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { lightColors, darkColors, spacing, typography } from '../theme';

export type TabId = 'search' | 'overview' | 'read' | 'notes' | 'chat';

const TABS: { id: TabId; label: string; icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'search',   label: 'Suche',     icon: 'search-outline',       iconActive: 'search' },
  { id: 'overview', label: 'Übersicht', icon: 'list-outline',         iconActive: 'list' },
  { id: 'read',     label: 'Lesen',     icon: 'book-outline',         iconActive: 'book' },
  { id: 'notes',    label: 'Notizen',   icon: 'pencil-outline',       iconActive: 'pencil' },
  { id: 'chat',     label: 'KI-Chat',   icon: 'chatbubble-outline',   iconActive: 'chatbubble' },
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
      { backgroundColor: colors.surfaceContainer, borderTopColor: colors.outlineVariant, paddingBottom: insets.bottom },
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
            <View style={[styles.pill, isActive && { backgroundColor: colors.secondaryContainer }]}>
              <Ionicons name={isActive ? tab.iconActive : tab.icon} size={24} color={color} />
            </View>
            <Text
              style={[typography.labelSmall, { color }]}
              numberOfLines={1}
            >
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
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    gap: 2,
  },
  pill: {
    width: 64,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
