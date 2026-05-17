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

export function useAppFonts() {
  return useFonts({
    Cinzel_400Regular,
    Cinzel_700Bold,
    Marcellus_400Regular,
    CormorantGaramond_400Regular,
    CormorantGaramond_400Regular_Italic,
  });
}
