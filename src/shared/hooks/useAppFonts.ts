import { useEffect, useState } from 'react';
import { useFonts } from 'expo-font';
import {
  Cinzel_400Regular,
  Cinzel_700Bold,
} from '@expo-google-fonts/cinzel';
import { Marcellus_400Regular } from '@expo-google-fonts/marcellus';
import {
  CormorantGaramond_400Regular,
  CormorantGaramond_400Regular_Italic,
} from '@expo-google-fonts/cormorant-garamond';
import {
  Lora_400Regular,
  Lora_400Regular_Italic,
  Lora_700Bold,
  Lora_700Bold_Italic,
} from '@expo-google-fonts/lora';

const FONT_LOAD_TIMEOUT_MS = 10_000;

export function useAppFonts(): [boolean, Error | null] {
  const [loaded, error] = useFonts({
    Cinzel_400Regular,
    Cinzel_700Bold,
    Marcellus_400Regular,
    CormorantGaramond_400Regular,
    CormorantGaramond_400Regular_Italic,
    Lora_400Regular,
    Lora_400Regular_Italic,
    Lora_700Bold,
    Lora_700Bold_Italic,
  });
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (loaded) {
      console.log('[useAppFonts] loaded');
      return;
    }
    if (error) {
      console.warn('[useAppFonts] error:', error.message);
      return;
    }
    const timer = setTimeout(() => {
      console.warn('[useAppFonts] timeout — proceeding with system fonts');
      setTimedOut(true);
    }, FONT_LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [loaded, error]);

  return [loaded || !!error || timedOut, error];
}
