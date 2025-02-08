import { useState } from 'react';
import { StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Link } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSignIn = async () => {
    try {
      setLoading(true);
      await signIn(email, password);
    } catch (error) {
      console.error(error);
      alert('Error signing in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Image
        source={require('@/assets/images/pokemon-logo.png')}
        style={styles.logo}
      />
      
      <Card style={styles.card}>
        <ThemedText type="title" style={styles.title}>
          Welcome Back Trainer!
        </ThemedText>
        
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        <Button
          onPress={handleSignIn}
          disabled={loading}
          loading={loading}
          size="large"
          style={styles.button}
        >
          Sign In
        </Button>

        <Link href="/sign-up" asChild>
          <Button variant="outline" size="medium">
            Don't have an account? Sign up
          </Button>
        </Link>
      </Card>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 74,
    alignSelf: 'center',
    marginBottom: 32,
  },
  card: {
    gap: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  input: {
    marginBottom: 8,
  },
  button: {
    marginTop: 8,
  },
}); 