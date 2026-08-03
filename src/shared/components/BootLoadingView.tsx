import { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, View, useColorScheme } from 'react-native';
import { lightColors, darkColors } from '../theme';

/** Boot-Overlay: Philo-Bild mit sanfter Puls-Animation statt leerem Weiß. */
export default function BootLoadingView() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const opacity = useRef(new Animated.Value(0.5)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(opacity, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.5, duration: 900, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(scale, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0.96, duration: 900, useNativeDriver: true }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, scale]);

  return (
    <View
      style={[styles.root, { backgroundColor: colors.background }]}
      accessibilityRole="progressbar"
      accessibilityLabel="App wird geladen"
    >
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <Image
          source={require('../../../assets/splash-icon.png')}
          style={styles.image}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 200,
    height: 200,
  },
});
