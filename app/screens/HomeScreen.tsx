import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { supabase } from '../supabase'; // adjust path if needed

type Session = Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'];

const HomeScreen = () => {
  const [session, setSession] = useState<Session>(null);
  const [email, setEmail] = useState('');
  const [otpSentTo, setOtpSentTo] = useState<string | null>(null);
  const [otp, setOtp] = useState('');

  // Load existing session & listen for auth changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!session) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>GamePulse</Text>

        {!otpSentTo ? (
          <>
            <Text style={styles.h2}>Sign in</Text>
            <TextInput
              placeholder="email@domain.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
            />
            <Button
              title="Send login code"
              onPress={async () => {
                if (!email) return Alert.alert('Enter your email');
                const { error } = await supabase.auth.signInWithOtp({
                  email,
                  options: { emailRedirectTo: 'gamepulse://auth' },
                });
                if (error) return Alert.alert('Error', error.message);
                setOtpSentTo(email);
                Alert.alert('Check your email', 'Enter the code we sent you.');
              }}
            />
          </>
        ) : (
          <>
            <Text style={styles.h2}>Enter code sent to {otpSentTo}</Text>
            <TextInput
              placeholder="6-digit code"
              keyboardType="number-pad"
              value={otp}
              onChangeText={setOtp}
              style={styles.input}
            />
            <Button
              title="Verify code"
              onPress={async () => {
                if (!otpSentTo || !otp) return;
                const { data, error } = await supabase.auth.verifyOtp({
                  email: otpSentTo,
                  token: otp,
                  type: 'email',
                });
                if (error) return Alert.alert('Error', error.message);
                if (data.session) {
                  setSession(data.session);
                  setOtp('');
                  setOtpSentTo(null);
                } else {
                  Alert.alert('Invalid code', 'Try again or resend.');
                }
              }}
            />
            <View style={{ height: 8 }} />
            <Button title="Resend code" onPress={() => setOtpSentTo(null)} />
          </>
        )}
      </View>
    );
  }

  // User is logged in
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome 👋</Text>
      <Text>User ID: {session.user.id}</Text>
      <Text>Email: {session.user.email}</Text>
      <View style={{ height: 12 }} />
      <Button title="Sign out" onPress={() => supabase.auth.signOut()} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 12 },
  h2: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, width: '100%', marginBottom: 12 },
});

export default HomeScreen;
