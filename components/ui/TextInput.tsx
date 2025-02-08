import { StyleSheet, TextInput as RNTextInput, TextInputProps, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { ThemedText } from '@/components/ThemedText';

const AnimatedView = Animated.createAnimatedComponent(View);

interface CustomTextInputProps extends TextInputProps {
  label?: string;
}

export function TextInput({ label, ...props }: CustomTextInputProps) {
  return (
    <AnimatedView entering={FadeIn} style={styles.container}>
      {label && <ThemedText style={styles.label}>{label}</ThemedText>}
      <RNTextInput
        placeholderTextColor="rgba(255, 255, 255, 0.5)"
        style={[styles.input, props.style]}
        {...props}
      />
    </AnimatedView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  label: {
    marginBottom: 8,
  },
  input: {
    height: 50,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    color: '#FFFFFF',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
}); 