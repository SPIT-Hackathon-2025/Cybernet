import { View, ViewProps, StyleSheet, useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';

interface CardProps extends ViewProps {
  elevation?: number;
  gradient?: boolean;
}

export function Card({ style, elevation = 2, gradient = true, ...props }: CardProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const Container = gradient ? LinearGradient : View;
  const containerProps = gradient ? {
    colors: [theme.cardGradientStart, theme.cardGradientEnd],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  } : {
    style: { backgroundColor: theme.card }
  };

  return (
    <View
      style={[
        styles.shadow,
        {
          shadowOpacity: elevation * 0.1,
          shadowRadius: elevation,
          elevation: elevation,
        },
      ]}
    >
      <Container
        {...containerProps}
        style={[
          styles.card,
          style,
        ]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    overflow: 'hidden',
  },
}); 