import React, { useRef, useState } from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import PagerView from 'react-native-pager-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import TabBar from '../../src/components/TabBar';
import { lightColors, darkColors } from '../../src/theme';
import SearchScreen from '../../src/features/search/SearchScreen';
import OverviewScreen from '../../src/features/overview/OverviewScreen';
import ReadScreen from '../../src/features/read/ReadScreen';
import NotesScreen from '../../src/features/notes/NotesScreen';
import ChatScreen from '../../src/features/chat/ChatScreen';

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const pagerRef = useRef<PagerView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleTabPress = (index: number) => {
    pagerRef.current?.setPage(index);
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={(e) => setActiveIndex(e.nativeEvent.position)}
      >
        <View key="0" style={styles.page}><SearchScreen /></View>
        <View key="1" style={styles.page}><OverviewScreen /></View>
        <View key="2" style={styles.page}><ReadScreen /></View>
        <View key="3" style={styles.page}><NotesScreen /></View>
        <View key="4" style={styles.page}><ChatScreen /></View>
      </PagerView>
      <TabBar activeIndex={activeIndex} onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
});
