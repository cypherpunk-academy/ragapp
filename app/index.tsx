import { Redirect } from 'expo-router';

// Redirect from root to the main tab layout
export default function Index() {
  return <Redirect href="/(tabs)" />;
}
