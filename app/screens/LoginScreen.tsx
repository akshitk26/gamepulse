import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { supabase } from '../supabase';
import FloatingOrbs from '../components/FloatingOrbs';

export default function HomeScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err: any) {
      Alert.alert('Sign in failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async () => {
    try {
      if (!email.includes('@')) {
        Alert.alert('Email required', 'Supabase requires an email for password auth.');
        return;
      }
      if (!username.trim()) {
        Alert.alert('Username required', 'Please choose a username.');
        return;
      }
      setLoading(true);
      // 1) Create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } }, // also store in user_metadata
      });
      if (error) throw error;

      // 2) Create/update profile row (id == auth user id)
      const userId = data.user?.id;
      if (userId) {
        const { error: upsertErr } = await supabase
          .from('profiles')
          .upsert({ id: userId, username }, { onConflict: 'id' });
        if (upsertErr) throw upsertErr;
      }

      Alert.alert('Verify your email', 'Check your inbox to confirm your account, then sign in.');
      setMode('signin');
    } catch (err: any) {
      Alert.alert('Sign up failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <FloatingOrbs />
      
      <Text style={styles.brand}>GamePulse</Text>
      <Text style={styles.title}>No more boring games.</Text>

      {mode === 'signup' && (
        <TextInput
          style={styles.input}
          placeholder="Username"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        autoCapitalize="none"
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.6 }]}
        onPress={mode === 'signin' ? signIn : signUp}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {mode === 'signin' ? 'Sign In' : 'Create Account'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
        <Text style={styles.link}>
          {mode === 'signin' ? "Don't have an account? Sign up" : 'Have an account? Sign in'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 12,
    backgroundColor: '#1a0a2e',
  },
  brand: {
    fontSize: 48,
    fontWeight: '900',
    textAlign: 'center',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: '#8000FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '400',
    textAlign: 'center',
    color: '#bbb',
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: '#444',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#8000FF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#8000FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  link: {
    textAlign: 'center',
    color: '#1ce783',
    marginTop: 16,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
