import { StyleSheet, TextInput as RNTextInput, TextInputProps, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';

const AnimatedView = Animated.createAnimatedComponent(View);

export function TextInput(props: TextInputProps) {
  return (
    <AnimatedView entering={FadeIn} style={styles.container}>
      <RNTextInput
        placeholderTextColor="rgba(0,0,0,0.5)"
        style={[styles.input, props.style]}
        {...props}
      />
    </AnimatedView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.light,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  input: {
    height: 50,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.text.primary,
  },
}); 