import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';

interface AuthScreenProps {
  onAuthComplete?: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthComplete }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleMode = () => {
    setMode((prev) => (prev === 'login' ? 'signup' : 'login'));
  };

  const handleSubmit = async () => {
    if (loading) return;
    if (!email || !password || (mode === 'signup' && !displayName)) {
      Alert.alert('Missing information', 'Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);

      if (mode === 'signup') {
        const credentials = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (displayName) {
          await updateProfile(credentials.user, { displayName: displayName.trim() });
        }

        await setDoc(doc(db, 'profiles', credentials.user.uid), {
          displayName: displayName.trim(),
          email: credentials.user.email,
          credits: 100,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }

      onAuthComplete?.();
    } catch (error: any) {
      const message = error?.message ?? 'Unable to authenticate. Please try again.';
      Alert.alert('Authentication error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.brand}>GamePoints</Text>
        <Text style={styles.title}>{mode === 'login' ? 'Log in to continue' : 'Create your account'}</Text>

        {mode === 'signup' && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Display name</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="e.g. PropMaster42"
              placeholderTextColor="#6F6895"
              autoCapitalize="words"
            />
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor="#6F6895"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Minimum 6 characters"
            placeholderTextColor="#6F6895"
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={loading}
        >
          <Text style={styles.primaryLabel}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Log In' : 'Sign Up'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryAction} onPress={toggleMode}>
          <Text style={styles.secondaryLabel}>
            {mode === 'login'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Log in'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default AuthScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05030A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'rgba(12, 12, 21, 0.92)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 18,
  },
  brand: {
    color: '#1CE783',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    color: '#6F6895',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(5, 3, 10, 0.8)',
    paddingHorizontal: 18,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    marginTop: 12,
    backgroundColor: '#1CE783',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryLabel: {
    color: '#05030A',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  secondaryAction: {
    alignItems: 'center',
    marginTop: 4,
  },
  secondaryLabel: {
    color: '#9088B4',
    fontSize: 14,
  },
});
