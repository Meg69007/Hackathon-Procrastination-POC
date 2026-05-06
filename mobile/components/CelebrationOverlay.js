import { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const EMOJIS = ['🎉', '✨', '🏆', '💪', '🔥', '⭐', '🎊', '💫'];
const COUNT = 12;

function Particle({ emoji, delay }) {
  const x = useRef(new Animated.Value(Math.random() * width)).current;
  const y = useRef(new Animated.Value(height * 0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.2, duration: 300, useNativeDriver: true }),
        Animated.timing(y, {
          toValue: Math.random() * height * 0.3,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.Text
      style={[
        styles.particle,
        { transform: [{ translateX: x }, { translateY: y }, { scale }], opacity },
      ]}
    >
      {emoji}
    </Animated.Text>
  );
}

export default function CelebrationOverlay({ visible }) {
  if (!visible) return null;
  return (
    <View style={styles.overlay} pointerEvents="none">
      {Array.from({ length: COUNT }).map((_, i) => (
        <Particle
          key={i}
          emoji={EMOJIS[i % EMOJIS.length]}
          delay={i * 80}
        />
      ))}
      <View style={styles.banner}>
        <Text style={styles.bannerText}>🏆 Tâche terminée !</Text>
        <Text style={styles.bannerSub}>La Flemme vaincue. +50 XP</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    fontSize: 28,
  },
  banner: {
    position: 'absolute',
    bottom: '30%',
    left: 32,
    right: 32,
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e94560',
  },
  bannerText: {
    color: '#e94560',
    fontSize: 24,
    fontWeight: '900',
  },
  bannerSub: {
    color: '#ffd700',
    fontSize: 15,
    marginTop: 6,
    fontWeight: '700',
  },
});
