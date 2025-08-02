import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const AuthScreen = () => {
  const navigation = useNavigation();
  const { signIn, signUp, loading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      let result;
      if (isSignUp) {
        result = await signUp(email, password);
      } else {
        result = await signIn(email, password);
      }

      if (result.error) {
        Alert.alert('Error', result.error.message);
      } else {
        if (isSignUp) {
          Alert.alert(
            'Success',
            'Account created! Please check your email to verify your account.',
          );
        } else {
          navigation.navigate('Main' as never);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <LinearGradient
        colors={['#f8fafc', '#f1f5f9', '#e2e8f0']}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: 20,
            paddingVertical: 40,
          }}
        >
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            {/* Logo/Brand */}
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
              }}
            >
              <Text style={{ fontSize: 32 }}>✨</Text>
            </View>

            <Text
              style={{
                fontSize: 32,
                fontWeight: '300',
                color: '#1e293b',
                textAlign: 'center',
                marginBottom: 8,
              }}
            >
              Welcome to DripMuse
            </Text>

            <Text
              style={{
                fontSize: 16,
                color: '#64748b',
                textAlign: 'center',
                lineHeight: 22,
              }}
            >
              Your AI-powered personal stylist
            </Text>
          </View>

          {/* Auth Form */}
          <View
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: 20,
              padding: 32,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 20,
              elevation: 5,
            }}
          >
            <Text
              style={{
                fontSize: 24,
                fontWeight: '600',
                color: '#1e293b',
                textAlign: 'center',
                marginBottom: 24,
              }}
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Text>

            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              autoCapitalize="none"
            />

            {isSignUp && (
              <Input
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your password"
                secureTextEntry
                autoCapitalize="none"
              />
            )}

            <View style={{ marginTop: 24 }}>
              <LinearGradient
                colors={['rgba(168, 85, 247, 0.9)', 'rgba(236, 72, 153, 0.9)']}
                style={{
                  borderRadius: 12,
                  marginBottom: 16,
                }}
              >
                <Button
                  title={isSignUp ? 'Create Account' : 'Sign In'}
                  onPress={handleAuth}
                  loading={isLoading}
                  style={{
                    backgroundColor: 'transparent',
                    paddingVertical: 16,
                  }}
                  textStyle={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}
                />
              </LinearGradient>

              <Button
                title={
                  isSignUp
                    ? 'Already have an account? Sign In'
                    : "Don't have an account? Sign Up"
                }
                onPress={toggleAuthMode}
                variant="ghost"
                textStyle={{ color: '#8b5cf6', fontSize: 14 }}
              />
            </View>
          </View>

          {/* Additional Info */}
          <View style={{ alignItems: 'center', marginTop: 32 }}>
            <Text
              style={{
                fontSize: 12,
                color: '#94a3b8',
                textAlign: 'center',
                lineHeight: 18,
              }}
            >
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

export default AuthScreen;
