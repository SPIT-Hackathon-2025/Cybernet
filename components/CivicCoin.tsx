import { View, Image, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';

interface CivicCoinProps {
  amount: number;
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

export function CivicCoin({ amount, size = 'medium', style }: CivicCoinProps) {
  const getSize = () => {
    switch (size) {
      case 'small': return 16;
      case 'large': return 32;
      default: return 24;
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Image
        source={require('@/assets/images/civic-coin.png')}
        style={[styles.icon, { width: getSize(), height: getSize() }]}
        resizeMode="contain"
      />
      <ThemedText style={[styles.text, { fontSize: getSize() * 0.75 }]}>
        {amount}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  icon: {
    width: 24,
    height: 24,
  },
  text: {
    fontWeight: '600',
  },
}); 