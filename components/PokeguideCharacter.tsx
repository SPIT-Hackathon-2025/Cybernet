import { Image, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

type PokeguideEmotion = 
  | 'angry' 
  | 'announcing' 
  | 'concerned-asking'
  | 'confused'
  | 'curious'
  | 'explaining'
  | 'happy-with-football'
  | 'shouting-in-anger'
  | 'shouting'
  | 'thinking';

interface PokeguideCharacterProps {
  emotion: PokeguideEmotion;
  size?: number;
  style?: ViewStyle;
  animated?: boolean;
}

export function PokeguideCharacter({ 
  emotion, 
  size = 80,
  style,
  animated = true 
}: PokeguideCharacterProps) {
  const Container = animated ? Animated.View : View;

  return (
    <Container 
      style={[styles.container, style]}
      entering={animated ? FadeInDown.springify().delay(300) : undefined}
    >
      <Image
        source={getPokeguideImage(emotion)}
        style={[
          {
            width: size,
            height: size,
          },
          styles.image
        ]}
      />
    </Container>
  );
}

function getPokeguideImage(emotion: PokeguideEmotion) {
  return {
    'angry': require('@/assets/images/pokeguide/pokeguide-angry.png'),
    'announcing': require('@/assets/images/pokeguide/pokeguide-announcing.png'),
    'concerned-asking': require('@/assets/images/pokeguide/pokeguide-concerned-asking.png'),
    'confused': require('@/assets/images/pokeguide/pokeguide-confused.png'),
    'curious': require('@/assets/images/pokeguide/pokeguide-curious.png'),
    'explaining': require('@/assets/images/pokeguide/pokeguide-explaining.png'),
    'happy-with-football': require('@/assets/images/pokeguide/pokeguide-happy-with-football.png'),
    'shouting-in-anger': require('@/assets/images/pokeguide/pokeguide-shouting-in-anger.png'),
    'shouting': require('@/assets/images/pokeguide/pokeguide-shouting.png'),
    'thinking': require('@/assets/images/pokeguide/pokeguide-thinking.png'),
  }[emotion];
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    resizeMode: 'contain',
  },
}); 