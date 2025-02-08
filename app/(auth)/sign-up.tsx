import { useState } from 'react';
import { StyleSheet, Image, View, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import Animated, { FadeInDown, FadeInUp, SlideInLeft } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

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
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={['#FF5D00', '#CC4A00']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Animated.View 
            entering={FadeInUp.delay(200).springify()} 
            style={styles.header}
          >
            <Image
              source={require('@/assets/images/pokemon-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Animated.Image
              entering={SlideInLeft.delay(400)}
              source={require('@/assets/images/pokeguide/pokeguide-explaining.png')}
              style={styles.mascot}
              resizeMode="contain"
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <Card style={styles.card}>
              <ThemedText style={styles.title}>
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
          </Animated.View>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: height * 0.04,
  },
  logo: {
    width: width * 0.5,
    height: width * 0.2,
    marginBottom: height * 0.02,
  },
  mascot: {
    width: width * 0.35,
    height: width * 0.35,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 24,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
    backgroundColor: '#1A1A1A',
  },
}); 