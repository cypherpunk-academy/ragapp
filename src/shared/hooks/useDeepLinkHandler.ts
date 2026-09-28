/**
 * Step 14d: Hook that listens for passage/text deep links and navigates accordingly.
 *
 * - passage/{id}: resolve via books.db (with redirect chain), navigate to ReadScreen
 * - text/{id}: navigate to Arbeitstexte screen with note ID
 *
 * Must be used inside ReadingProvider (for navigateToRead).
 */
import { useEffect, useRef } from 'react';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import { parseDeepLink } from '@/data/services/deepLinkService';
import { resolveRedirect } from '@/data/lib/booksDb';
import { useReading } from '@/shared/contexts/ReadingContext';

export function useDeepLinkHandler() {
  const { navigateToRead } = useReading();
  const navigateRef = useRef(navigateToRead);
  navigateRef.current = navigateToRead;

  useEffect(() => {
    async function handle(url: string) {
      const target = parseDeepLink(url);
      if (!target) return; // Not a passage/text link — ignore (auth handler may pick it up)

      if (target.kind === 'passage') {
        try {
          const resolved = await resolveRedirect(target.paragraphId);
          if (resolved.found) {
            navigateRef.current({
              sourceId: resolved.paragraph.source_id,
              segmentIndex: resolved.paragraph.segment_index,
              paragraphId: resolved.paragraph.id,
            });
          } else if (resolved.redirect && resolved.redirect.kind === 'deleted') {
            Alert.alert(
              'Absatz entfernt',
              'Dieser Absatz wurde in einer neueren Korpus-Version entfernt.',
            );
          } else {
            Alert.alert(
              'Absatz nicht gefunden',
              'Dieser Absatz ist in deiner Korpus-Version nicht vorhanden. Pruefe, ob ein Update verfuegbar ist.',
            );
          }
        } catch (err) {
          console.warn('[deep-link] passage resolve error:', err);
          Alert.alert('Fehler', 'Der Absatz konnte nicht geladen werden.');
        }
        return;
      }

      if (target.kind === 'text') {
        router.push({ pathname: '/arbeitstexte', params: { noteId: target.noteId } });
        return;
      }
    }

    // Handle URL that launched the app
    Linking.getInitialURL().then((url) => {
      if (url) void handle(url);
    });

    // Handle URLs while app is running
    const sub = Linking.addEventListener('url', ({ url }) => {
      void handle(url);
    });

    return () => sub.remove();
  }, []);
}
