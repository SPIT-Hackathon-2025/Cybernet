import { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';

export default function WelcomeScreen() {
  useEffect(() => {
    // Add a slight delay before redirecting to give a smooth transition
    const timer = setTimeout(() => {
      router.replace('/(tabs)');
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={['#1A1A1A', '#4A4A4A']}
      style={styles.container}
    >
      <Animated.View 
        entering={FadeIn.duration(5000)}
        style={styles.content}
      >
        <ThemedText style={styles.welcomeText}>
          Welcome Trainer!
        </ThemedText>
        <ThemedText style={styles.subText}>
          Preparing your adventure...
        </ThemedText>
        <ActivityIndicator size="large" color="#FF5D00" style={styles.loader} />
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  subText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 32,
  },
  loader: {
    marginTop: 20,
  },
}); 