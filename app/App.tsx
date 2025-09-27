import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import LobbyScreen from './screens/LobbyScreen';
import LoginScreen from './screens/LoginScreen';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let unsub = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    }).data.subscription;

    (async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session ?? null);
      setBooting(false);
    })();

    return () => unsub?.unsubscribe();
  }, []);

  if (booting) {
    return <View style={{flex:1,alignItems:'center',justifyContent:'center'}}><ActivityIndicator /></View>;
  }

  return session ? <LobbyScreen /> : <LoginScreen />;
}
