import { PokeguideCharacter } from '@/components/PokeguideCharacter';

export function ErrorState({ message }: { message: string }) {
  return (
    <View style={styles.container}>
      <PokeguideCharacter 
        emotion="confused" 
        size={120}
        style={styles.guideCharacter}
      />
      <Text style={styles.errorMessage}>{message}</Text>
    </View>
  );
} 