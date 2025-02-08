import { Text, TextProps, StyleSheet, useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

interface ThemedTextProps extends TextProps {
  type?: 'title' | 'subtitle' | 'body' | 'caption';
  color?: string;
  dimmed?: boolean;
}

export function ThemedText({ 
  style, 
  type = 'body',
  color,
  dimmed = false,
  ...props 
}: ThemedTextProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const textStyles = [
    styles.base,
    styles[type],
    { 
      color: color || (dimmed ? theme.textDim : theme.text)
    },
    style,
  ];

  return <Text style={textStyles} {...props} />;
}

const styles = StyleSheet.create({
  base: {
    fontSize: 16,
    fontFamily: 'System',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    fontSize: 12,
    opacity: 0.7,
  },
});
