import { useState } from 'react';
import { StyleSheet, Image } from 'react-native';
import { Link } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSignUp = async () => {
    if (!email || !password || !username) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      await signUp(email, password);
      alert('Check your email for the confirmation link!');
    } catch (error) {
      console.error(error);
      alert('Error signing up');
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
          Start Your Journey!
        </ThemedText>
        
        <TextInput
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          style={styles.input}
        />

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
          onPress={handleSignUp}
          disabled={loading}
          loading={loading}
          size="large"
          style={styles.button}
        >
          {loading ? 'Creating account...' : 'Sign Up'}
        </Button>

        <Link href="/sign-in" asChild>
          <Button variant="outline" size="medium">
            Already have an account? Sign in
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