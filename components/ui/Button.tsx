import { StyleSheet, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { ThemedText } from '../ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
}

export function Button({ 
  variant = 'primary',
  size = 'medium',
  loading,
  style,
  children,
  ...props 
}: ButtonProps) {
  const backgroundColor = useThemeColor({}, variant === 'primary' ? 'primary' : 'secondary');
  const textColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, variant === 'outline' ? 'primary' : 'background');

  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[size],
        {
          backgroundColor: variant === 'outline' ? 'transparent' : backgroundColor,
          borderColor: borderColor,
          borderWidth: variant === 'outline' ? 2 : 0,
        },
        style,
      ]}
      {...props}
    >
      <ThemedText
        style={[
          styles.text,
          {
            color: variant === 'outline' ? backgroundColor : textColor,
          },
        ]}
      >
        {loading ? 'Loading...' : children}
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  medium: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  large: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 