import { SafeAreaView } from 'react-native-safe-area-context';
import KontoScreen from '@/features/konto/KontoScreen';

export default function KontoRoute() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <KontoScreen variant="stack" />
    </SafeAreaView>
  );
}
