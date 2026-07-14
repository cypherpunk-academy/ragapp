import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PagerView from 'react-native-pager-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import TabBar from '@/shared/components/TabBar';
import { lightColors, darkColors } from '@/shared/theme';
import { ReadingProvider, useReading } from '@/shared/contexts/ReadingContext';
import { WarningsProvider } from '@/shared/contexts/WarningsContext';
import SearchScreen from '../../src/features/search/SearchScreen';
import OverviewScreen from '../../src/features/overview/OverviewScreen';
import ReadScreen from '../../src/features/read/ReadScreen';
import ChatScreen from '../../src/features/chat/ChatScreen';
import ContributionsScreen from '../../src/features/read/ContributionsScreen';
import ConversationDetailScreen from '../../src/features/read/ConversationDetailScreen';
import ChunkPreviewScreen from '../../src/features/read/ChunkPreviewScreen';

const LAST_TAB_KEY = 'lastActiveTab';

function TabsInner() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const pagerRef = useRef<PagerView>(null);
  const [initialPage, setInitialPage] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem(LAST_TAB_KEY).then((val) => {
      // Nur LESEN-Tab (1) wird wiederhergestellt; alle anderen → Übersicht (0)
      setInitialPage(Number(val) === 1 ? 1 : 0);
    });
  }, []);

  const {
    _registerTabNav,
    resetOverview,
    contributions,
    closeContributions,
    conversationDetail,
    closeConversationDetail,
    chunkPreview,
    closeChunkPreview,
    navigateToRead,
  } = useReading();

  React.useEffect(() => {
    _registerTabNav((index) => pagerRef.current?.setPage(index));
  }, [_registerTabNav]);

  const handleTabPress = (index: number) => {
    if (index === 0) resetOverview();
    pagerRef.current?.setPage(index);
  };

  if (initialPage === null) return null;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={initialPage}
        onPageSelected={(e) => {
          const index = e.nativeEvent.position;
          setActiveIndex(index);
          AsyncStorage.setItem(LAST_TAB_KEY, String(index));
        }}
      >
        <View key="0" style={styles.page}><OverviewScreen /></View>
        <View key="1" style={styles.page}><ReadScreen /></View>
        <View key="2" style={styles.page}><ChatScreen /></View>
        <View key="3" style={styles.page}><SearchScreen /></View>
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
          sourceId={conversationDetail.sourceId}
          onClose={closeConversationDetail}
        />
      )}
      {chunkPreview && (
        <ChunkPreviewScreen
          visible
          chunkId={chunkPreview.chunkId}
          sourceId={chunkPreview.sourceId}
          title={chunkPreview.title}
          initialText={chunkPreview.initialText}
          readTarget={chunkPreview.readTarget}
          onClose={closeChunkPreview}
          onNavigateToRead={(target) => {
            // #region agent log
            fetch('http://127.0.0.1:7480/ingest/f96b38f1-0577-4277-afab-70a8601f20d7',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'eecb3c'},body:JSON.stringify({sessionId:'eecb3c',runId:'lecture-nav',location:'_layout.tsx:onNavigateToRead',message:'summary overlay navigate',data:target,timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
            // #endregion
            closeChunkPreview();
            navigateToRead({
              sourceId: target.sourceId,
              segmentIndex: target.segmentIndex,
              paragraphId: null,
              fromSearch: true,
            });
          }}
        />
      )}
    </SafeAreaView>
  );
}

export default function TabsLayout() {
  return (
    <WarningsProvider>
      <ReadingProvider>
        <TabsInner />
      </ReadingProvider>
    </WarningsProvider>
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
