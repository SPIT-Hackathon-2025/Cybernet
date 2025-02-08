import { useState } from 'react';
import { StyleSheet, View, ScrollView, Dimensions, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/contexts/AuthContext';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string) => {
  return password.length >= 6;
};

const validateUsername = (username: string) => {
  return username.length >= 3 && username.length <= 20 && /^[a-zA-Z0-9_]+$/.test(username);
};

export default function SignUpScreen() {
  const { signUp, signInWithGoogle } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    username: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {
      email: '',
      password: '',
      username: '',
      confirmPassword: '',
    };

    if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!validateUsername(formData.username)) {
      newErrors.username = 'Username must be 3-20 characters and contain only letters, numbers, and underscores';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await signUp(formData.email, formData.password, formData.username);
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
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
              <ThemedText style={styles.headerTitle}>
                Join the Community
              </ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                Create your trainer profile and start making a difference
              </ThemedText>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <TextInput
                  placeholder="Username"
                  value={formData.username}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, username: text }))}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {errors.username ? (
                  <ThemedText style={styles.errorText}>{errors.username}</ThemedText>
                ) : null}

                <TextInput
                  placeholder="Email"
                  value={formData.email}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                />
                {errors.email ? (
                  <ThemedText style={styles.errorText}>{errors.email}</ThemedText>
                ) : null}

                <TextInput
                  placeholder="Password"
                  value={formData.password}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {errors.password ? (
                  <ThemedText style={styles.errorText}>{errors.password}</ThemedText>
                ) : null}

                <TextInput
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {errors.confirmPassword ? (
                  <ThemedText style={styles.errorText}>{errors.confirmPassword}</ThemedText>
                ) : null}
              </View>

              <View style={styles.buttonContainer}>
                <Button
                  onPress={handleSignUp}
                  disabled={loading}
                  loading={loading}
                  size="large"
                  style={styles.signUpButton}
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <ThemedText style={styles.dividerText}>or</ThemedText>
                  <View style={styles.dividerLine} />
                </View>

                <Button
                  onPress={signInWithGoogle}
                  variant="outline"
                  size="large"
                  style={styles.googleButton}
                >
                  <View style={styles.googleButtonContent}>
                    <Ionicons name="logo-google" size={20} color="#4285F4" />
                    <ThemedText style={styles.googleText}>Continue with Google</ThemedText>
                  </View>
                </Button>

                <Link href="/sign-in" asChild>
                  <TouchableOpacity style={styles.signInLink}>
                    <ThemedText style={styles.signInText}>
                      Already have an account? <ThemedText style={styles.signInHighlight}>Sign In</ThemedText>
                    </ThemedText>
                  </TouchableOpacity>
                </Link>
              </View>
            </Animated.View>
          </View>
        </LinearGradient>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 40,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 24,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 24,
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
  signUpButton: {
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
  googleIcon: {
    marginRight: 8,
  },
  googleText: {
    color: '#FFFFFF',
    lineHeight: 24,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  signInLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  signInText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    lineHeight: 20,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  signInHighlight: {
    color: '#FF5D00',
    fontWeight: 'bold',
    lineHeight: 20,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
}); 