import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import LobbyScreen from './screens/LobbyScreen';
import LoginScreen from './screens/LoginScreen';
import BetpartyCreationScreen from './screens/BetpartyCreationScreen';
import PartyScreen from './screens/PartyScreen';

type AppRoute = 'lobby' | 'create' | 'waiting';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [booting, setBooting] = useState(true);
  const [route, setRoute] = useState<AppRoute>('lobby');
  const [activeLobbyId, setActiveLobbyId] = useState<string | null>(null);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    (async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session ?? null);
      setBooting(false);
    })();
    return () => data.subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setRoute('lobby');
      setActiveLobbyId(null);
    }
  }, [session]);

  if (booting) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  if (route === 'create') {
    return (
      <BetpartyCreationScreen
        onBack={() => setRoute('lobby')}
        onCreated={(lobbyId) => {
          setActiveLobbyId(lobbyId);
          setRoute('waiting');
        }}
      />
    );
  }

  if (route === 'waiting' && activeLobbyId) {
    return (
      <PartyScreen
        lobbyId={activeLobbyId}
        onExit={() => {
          setActiveLobbyId(null);
          setRoute('lobby');
        }}
      />
    );
  }

  return (
    <LobbyScreen
      onCreateLobby={() => setRoute('create')}
      onEnterLobby={(lobbyId) => {
        setActiveLobbyId(lobbyId);
        setRoute('waiting');
      }}
    />
  );
}
