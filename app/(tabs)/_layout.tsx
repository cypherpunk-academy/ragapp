import React, { useRef, useState } from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import PagerView from 'react-native-pager-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import TabBar from '@/shared/components/TabBar';
import BootLoadingView from '@/shared/components/BootLoadingView';
import { lightColors, darkColors } from '@/shared/theme';
import {
  ReadingProvider, useReading, TAB_INDEX_OVERVIEW,
} from '@/shared/contexts/ReadingContext';
import { useAuth } from '@/shared/hooks/useAuth';
import { WarningsProvider } from '@/shared/contexts/WarningsContext';
import SearchScreen from '../../src/features/search/SearchScreen';
import OverviewScreen from '../../src/features/overview/OverviewScreen';
import ReadScreen from '../../src/features/read/ReadScreen';
import PlaceholderScreen from '../../src/features/chat/PlaceholderScreen';
import ContributionsScreen from '../../src/features/read/ContributionsScreen';
import ChunkPreviewScreen from '../../src/features/read/ChunkPreviewScreen';

function TabsInner() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const pagerRef = useRef<PagerView>(null);
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [activeIndex, setActiveIndex] = useState(0);
  const [authResolved, setAuthResolved] = useState(false);

  React.useEffect(() => {
    if (authLoading) return;
    if (!authResolved) {
      setAuthResolved(true);
      if (!isAuthenticated) {
        setActiveIndex(TAB_INDEX_OVERVIEW);
        pagerRef.current?.setPage(TAB_INDEX_OVERVIEW);
      }
    }
  }, [authLoading, isAuthenticated, authResolved]);

  const {
    _registerTabNav,
    resetOverview,
    contributions,
    closeContributions,
    chunkPreview,
    closeChunkPreview,
    navigateToRead,
  } = useReading();

  React.useEffect(() => {
    _registerTabNav((index) => pagerRef.current?.setPage(index));
  }, [_registerTabNav]);

  const handleTabPress = (index: number) => {
    if (index === TAB_INDEX_OVERVIEW) resetOverview();
    pagerRef.current?.setPage(index);
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['left', 'right']}>
      <PagerView
        ref={pagerRef}
        style={[styles.pager, !authResolved && { opacity: 0 }]}
        initialPage={0}
        onPageSelected={(e) => {
          setActiveIndex(e.nativeEvent.position);
        }}
      >
        <View key="0" style={styles.page}>
          <PlaceholderScreen />
        </View>
        <View key="1" style={styles.page}><OverviewScreen /></View>
        <View key="2" style={styles.page}><ReadScreen /></View>
        <View key="3" style={styles.page}><SearchScreen /></View>
      </PagerView>
      {authResolved ? (
        <TabBar activeIndex={activeIndex} onTabPress={handleTabPress} />
      ) : (
        <View style={styles.bootOverlay} pointerEvents="auto">
          <BootLoadingView />
        </View>
      )}
      {contributions && (
        <ContributionsScreen
          visible
          paragraph={contributions.paragraph}
          sourceId={contributions.sourceId}
          onClose={closeContributions}
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
            const origin = chunkPreview.origin ?? 'search';
            closeChunkPreview();
            navigateToRead({
              sourceId: target.sourceId,
              segmentIndex: target.segmentIndex,
              paragraphId: null,
              fromSearch: origin,
            });
          }}
        />
      )}
    </SafeAreaView>
  );
}

export default function TabsLayout() {
  React.useEffect(() => {
    console.warn('[TabsLayout] MOUNTED');
    return () => console.warn('[TabsLayout] UNMOUNTED');
  }, []);

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
  bootOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 20,
  },
});
