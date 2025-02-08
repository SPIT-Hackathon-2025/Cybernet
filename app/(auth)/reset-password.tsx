import { useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/contexts/AuthContext';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

export default function ResetPasswordScreen() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await resetPassword(email);
    } catch (error) {
      // Error is handled by AuthContext
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
          <Animated.View entering={FadeInDown.delay(200)} style={styles.formContainer}>
            <View style={styles.header}>
              <ThemedText style={styles.title}>Reset Password</ThemedText>
              <ThemedText style={styles.description}>
                Enter your email address and we'll send you instructions to reset your password.
              </ThemedText>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError('');
                }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />
              {error ? (
                <ThemedText style={styles.errorText}>{error}</ThemedText>
              ) : null}
            </View>

            <View style={styles.buttonContainer}>
              <Button
                onPress={handleResetPassword}
                disabled={loading}
                loading={loading}
                size="large"
                style={styles.resetButton}
                leftIcon={<Ionicons name="mail-outline" size={20} color="#FFFFFF" />}
              >
                Send Reset Instructions
              </Button>

              <Link href="/sign-in" asChild>
                <TouchableOpacity style={styles.backLink}>
                  <Ionicons name="arrow-back" size={20} color="#FF5D00" />
                  <ThemedText style={styles.backText}>Back to Sign In</ThemedText>
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
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 34,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  description: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    lineHeight: 24,
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
  errorText: {
    color: '#FF4444',
    fontSize: 12,
    marginTop: -12,
    lineHeight: 16,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  buttonContainer: {
    gap: 20,
  },
  resetButton: {
    backgroundColor: '#FF5D00',
    borderWidth: 0,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  backText: {
    color: '#FF5D00',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
}); 