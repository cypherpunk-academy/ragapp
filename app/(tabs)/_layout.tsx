import React, { useRef, useState } from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import PagerView from 'react-native-pager-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import TabBar from '@/shared/components/TabBar';
import { lightColors, darkColors } from '@/shared/theme';
import { ReadingProvider, useReading } from '@/shared/contexts/ReadingContext';
import SearchScreen from '../../src/features/search/SearchScreen';
import OverviewScreen from '../../src/features/overview/OverviewScreen';
import ReadScreen from '../../src/features/read/ReadScreen';
import ChatScreen from '../../src/features/chat/ChatScreen';
import ContributionsScreen from '../../src/features/read/ContributionsScreen';
import ConversationDetailScreen from '../../src/features/read/ConversationDetailScreen';

function TabsInner() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const pagerRef = useRef<PagerView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { _registerTabNav, contributions, closeContributions, conversationDetail, closeConversationDetail } = useReading();

  React.useEffect(() => {
    _registerTabNav((index) => pagerRef.current?.setPage(index));
  }, [_registerTabNav]);

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
        <View key="0" style={styles.page}><OverviewScreen /></View>
        <View key="1" style={styles.page}><ReadScreen /></View>
        <View key="2" style={styles.page}><SearchScreen /></View>
        <View key="3" style={styles.page}><ChatScreen /></View>
      </PagerView>
      <TabBar activeIndex={activeIndex} onTabPress={handleTabPress} />
      {contributions && (
        <ContributionsScreen
          visible
          paragraph={contributions.paragraph}
          sourceId={contributions.sourceId}
          initialTab={contributions.tab}
          onClose={closeContributions}
        />
      )}
      {conversationDetail && (
        <ConversationDetailScreen
          visible
          talkId={conversationDetail.talkId}
          anchorParagraphId={conversationDetail.anchorParagraphId}
          anchorTurnIndex={conversationDetail.anchorTurnIndex}
          sourceId={contributions?.sourceId ?? 'philosophie-der-freiheit'}
          onClose={closeConversationDetail}
        />
      )}
    </SafeAreaView>
  );
}

export default function TabsLayout() {
  return (
    <ReadingProvider>
      <TabsInner />
    </ReadingProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
});
