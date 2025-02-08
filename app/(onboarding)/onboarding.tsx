import { useState, useRef } from 'react';
import { StyleSheet, View, Dimensions, Image, FlatList } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Welcome to PokéGuide!',
    description: 'Your community-driven Pokémon GO companion for making your city better, one catch at a time!',
    image: require('@/assets/images/pokeguide/pokeguide-happy-with-football.png'),
    gradient: ['#FF5D00', '#CC4A00'],
    icon: 'map-outline',
  },
  {
    id: '2',
    title: 'Report & Track Issues',
    description: 'Help improve your community by reporting issues you spot during your Pokémon adventures.',
    image: require('@/assets/images/pokeguide/pokeguide-explaining.png'),
    gradient: ['#1A1A1A', '#4A4A4A'],
    icon: 'warning-outline',
  },
  {
    id: '3',
    title: 'Join the Community',
    description: 'Connect with fellow trainers, earn badges, and make your city a better place!',
    image: require('@/assets/images/pokeguide/pokeguide-announcing.png'),
    gradient: ['#FF8533', '#FF5D00'],
    icon: 'people-outline',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const renderItem = ({ item, index }: { item: typeof slides[0]; index: number }) => (
    <View style={styles.slide}>
      <Animated.View 
        entering={FadeInRight.delay(index * 100)} 
        style={styles.imageContainer}
      >
        <Image source={item.image} style={styles.image} resizeMode="contain" />
      </Animated.View>
      <Animated.View 
        entering={FadeIn.delay(index * 200)}
        style={styles.textContainer}
      >
        <ThemedText style={styles.title}>{item.title}</ThemedText>
        <ThemedText style={styles.description}>{item.description}</ThemedText>
      </Animated.View>
    </View>
  );

  const handleNext = () => {
    if (currentIndex === slides.length - 1) {
      router.replace('/(auth)/sign-in');
    } else {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={slides[currentIndex].gradient}
        style={StyleSheet.absoluteFill}
      />
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />
      <View style={styles.footer}>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>
        <Button
          onPress={handleNext}
          size="large"
          style={styles.button}
        >
          <View style={styles.buttonContent}>
            <ThemedText style={styles.buttonText}>
              {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
            </ThemedText>
            <Ionicons 
              name={currentIndex === slides.length - 1 ? 'arrow-forward' : 'arrow-forward-outline'} 
              size={20} 
              color="#000000"
              style={styles.buttonIcon}
            />
          </View>
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    width,
    height,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  imageContainer: {
    width: width * 0.8,
    height: height * 0.4,
    marginBottom: 40,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 34,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  description: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 24,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    padding: 20,
    gap: 20,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  paginationDotActive: {
    backgroundColor: '#FFFFFF',
    width: 20,
  },
  button: {
    backgroundColor: '#FFFFFF',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  buttonIcon: {
    marginTop: 2,
  },
}); 