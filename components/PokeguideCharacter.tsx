import { View, Image, StyleSheet } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  withRepeat, 
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export type Emotion = 'angry' | 'announcing' | 'concerned-asking' | 'confused' | 'curious' | 'explaining' | 'happy-with-football' | 'shouting-in-anger' | 'shouting' | 'thinking';

interface PokeguideCharacterProps {
  emotion?: Emotion;
  size?: number;
  animated?: boolean;
  style?: any;
}

const emotionImages = {
  'angry': require('../assets/images/pokeguide/pokeguide-angry.png'),
  'announcing': require('../assets/images/pokeguide/pokeguide-announcing.png'),
  'concerned-asking': require('../assets/images/pokeguide/pokeguide-concerned-asking.png'),
  'confused': require('../assets/images/pokeguide/pokeguide-confused.png'),
  'curious': require('../assets/images/pokeguide/pokeguide-curious.png'),
  'explaining': require('../assets/images/pokeguide/pokeguide-explaining.png'),
  'happy-with-football': require('../assets/images/pokeguide/pokeguide-happy-with-football.png'),
  'shouting-in-anger': require('../assets/images/pokeguide/pokeguide-shouting-in-anger.png'),
  'shouting': require('../assets/images/pokeguide/pokeguide-shouting.png'),
  'thinking': require('../assets/images/pokeguide/pokeguide-thinking.png'),
  'with-cc-coin': require('../assets/images/pokeguide/pokeguide-with-cc-coin.png'),
} as const;

export function PokeguideCharacter({ 
  emotion = 'happy-with-football', 
  size = 120,
  animated = true,
  style,
}: PokeguideCharacterProps) {
  const animatedStyle = useAnimatedStyle(() => {
    if (!animated) return {};

    switch (emotion) {
      case 'happy-with-football':
        return {
          transform: [
            {
              rotate: withRepeat(
                withSequence(
                  withTiming('-5deg', { duration: 500 }),
                  withTiming('5deg', { duration: 500 }),
                ),
                -1,
                true
              ),
            },
          ],
        };
      case 'thinking':
        return {
          transform: [
            {
              translateY: withRepeat(
                withSequence(
                  withSpring(-5),
                  withSpring(5),
                ),
                -1,
                true
              ),
            },
          ],
        };
      case 'announcing':
        return {
          transform: [
            {
              scale: withRepeat(
                withSequence(
                  withSpring(1.1),
                  withSpring(1),
                ),
                -1,
                true
              ),
            },
          ],
        };
      case 'explaining':
        return {
          transform: [
            {
              translateX: withRepeat(
                withSequence(
                  withSpring(-5),
                  withSpring(5),
                ),
                -1,
                true
              ),
            },
          ],
        };
      case 'concerned-asking':
        return {
          transform: [
            {
              scale: withRepeat(
                withSequence(
                  withSpring(1.2),
                  withSpring(1),
                ),
                3,
                true
              ),
            },
          ],
        };
      case 'angry':
        return {
          transform: [
            {
              rotate: withRepeat(
                withSequence(
                  withTiming('360deg', { duration: 1000 }),
                ),
                3,
                false
              ),
            },
          ],
        };
      default:
        return {};
    }
  });

  return (
    <View style={[styles.container, style]}>
      <Animated.Image
        source={emotionImages[emotion]}
        style={[
          {
            width: size,
            height: size,
          },
          styles.image,
          animatedStyle,
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 120,
    height: 120,
  },
}); 