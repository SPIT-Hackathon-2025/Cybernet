import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Image, View, Dimensions, KeyboardAvoidingView, Platform, Alert, TouchableOpacity } from 'react-native';
import { Link, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useOAuth } from '@clerk/clerk-expo';

const { width, height } = Dimensions.get('window');

// Handle any pending authentication sessions
WebBrowser.maybeCompleteAuthSession();

export const useWarmUpBrowser = () => {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    }
  }, []);
};

export default function SignInScreen() {
  useWarmUpBrowser();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      await signIn(email, password);
    } catch (error) {
      // Error is handled by AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startOAuthFlow();

      if (createdSessionId) {
        await setActive({ session: createdSessionId });
        router.replace('/(auth)/welcome');
      }
    } catch (err) {
      console.error('OAuth error:', err);
      Alert.alert('Error', 'Failed to sign in with Google. Please try again.');
    }
  }, []);

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
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.formContainer}>
            <ThemedText style={styles.title}>
              Welcome Back Trainer!
            </ThemedText>

            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <Link href="/reset-password" asChild>
                <TouchableOpacity>
                  <ThemedText style={styles.forgotText}>
                    Forgot Password?
                  </ThemedText>
                </TouchableOpacity>
              </Link>
            </View>

            <View style={styles.buttonContainer}>
              <Button
                onPress={handleSignIn}
                disabled={loading}
                loading={loading}
                size="large"
                style={styles.signInButton}
              >
                Sign In
              </Button>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <ThemedText style={styles.dividerText}>or</ThemedText>
                <View style={styles.dividerLine} />
              </View>

              <Button
                 onPress={handleGoogleSignIn}
                variant="outline"
                size="large"
                style={styles.googleButton}
              >
                <View style={styles.googleButtonContent}>
                  <Ionicons name="logo-google" size={20} color="#4285F4" />
                  <ThemedText style={styles.googleText}>Continue with Google</ThemedText>
                </View>
              </Button>

              <Link href="/sign-up" asChild>
                <TouchableOpacity style={styles.signUpLink}>
                  <ThemedText style={styles.signUpText}>
                    New Trainer? <ThemedText style={styles.signUpHighlight}>Sign Up</ThemedText>
                  </ThemedText>
                </TouchableOpacity>
              </Link>
            </View>
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
    marginBottom: height * 0.06,
  },
  logo: {
    width: width * 0.5,
    height: width * 0.2,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 34,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  inputContainer: {
    gap: 16,
    marginBottom: 24,
  },
  input: {
    // Remove redundant styles since they're handled in TextInput component
  },
  forgotText: {
    color: '#FF5D00',
    fontSize: 14,
    textAlign: 'right',
    lineHeight: 20,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  buttonContainer: {
    gap: 20,
  },
  signInButton: {
    backgroundColor: '#FF5D00',
    borderWidth: 0,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    lineHeight: 20,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  googleButton: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  googleText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  signUpLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  signUpText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    lineHeight: 20,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  signUpHighlight: {
    color: '#FF5D00',
    fontWeight: 'bold',
    lineHeight: 20,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
}); 