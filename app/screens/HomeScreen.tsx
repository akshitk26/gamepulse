import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { supabase } from '../supabase';

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
      <Text style={styles.title}>Welcome to GamePulse</Text>

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
  container:{ flex:1, justifyContent:'center', padding:24, gap:12 },
  title:{ fontSize:24, fontWeight:'700', textAlign:'center', marginBottom:8 },
  input:{ borderWidth:1, borderColor:'#ccc', borderRadius:10, padding:12 },
  button:{ backgroundColor:'#8000FF', padding:14, borderRadius:12, alignItems:'center' },
  buttonText:{ color:'#fff', fontWeight:'700' },
  link:{ textAlign:'center', color:'#8000FF', marginTop:8 }
});
