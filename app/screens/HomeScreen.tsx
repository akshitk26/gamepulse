import React, { useEffect, useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';

type Mode = 'login' | 'signup';

const HomeScreen: React.FC = () => {
  const [mode, setMode] = useState<Mode>('login');
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => setUser(nextUser));
    return unsubscribe;
  }, []);

  const handleSubmit = async () => {
    if (loading || !email || !password || (mode === 'signup' && !displayName)) {
      Alert.alert('Missing information', 'Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      if (mode === 'signup') {
        const credentials = await createUserWithEmailAndPassword(auth, email.trim(), password);
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
      setEmail('');
      setPassword('');
      setDisplayName('');
    } catch (error: any) {
      Alert.alert('Authentication error', error?.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Welcome back!</Text>
        <Text style={styles.text}>UID: {user.uid}</Text>
        <Text style={styles.text}>Email: {user.email}</Text>
        <View style={styles.spacer} />
        <Button title="Sign out" onPress={() => signOut(auth)} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GamePoints</Text>
      <Text style={styles.subtitle}>
        {mode === 'login' ? 'Log in to your account' : 'Create a new account'}
      </Text>

      {mode === 'signup' && (
        <TextInput
          style={styles.input}
          placeholder="Display name"
          placeholderTextColor="#666"
          autoCapitalize="words"
          value={displayName}
          onChangeText={setDisplayName}
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="email@example.com"
        placeholderTextColor="#666"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#666"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <View style={styles.spacer} />
      <Button
        title={loading ? 'Working…' : mode === 'login' ? 'Log In' : 'Sign Up'}
        onPress={handleSubmit}
        disabled={loading}
      />
      <View style={styles.spacer} />
      <Button
        title={mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Log in'}
        onPress={() => setMode((prev) => (prev === 'login' ? 'signup' : 'login'))}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05030A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#9088B4',
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  input: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  spacer: {
    height: 16,
  },
});

export default HomeScreen;
