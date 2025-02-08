import { useState } from 'react';
import { StyleSheet, Image, View, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import Animated, { FadeInDown, FadeInUp, SlideInRight } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

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
        colors={['#1A1A1A', '#4A4A4A']}
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
              entering={SlideInRight.delay(400)}
              source={require('@/assets/images/pokeguide/pokeguide-curious.png')}
              style={styles.mascot}
              resizeMode="contain"
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <Card style={styles.card}>
              <ThemedText style={styles.title}>
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
                  New Trainer? Sign Up
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
    borderColor: '#FF5D00',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF5D00',
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
    backgroundColor: '#FF5D00',
  },
}); 