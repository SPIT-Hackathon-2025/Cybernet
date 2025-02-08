import { StyleSheet, TextInput as RNTextInput, TextInputProps } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

export function TextInput(props: TextInputProps) {
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');

  return (
    <RNTextInput
      {...props}
      style={[
        styles.input,
        {
          color: textColor,
          backgroundColor,
          borderColor: textColor,
        },
        props.style,
      ]}
      placeholderTextColor={textColor + '80'}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
}); 