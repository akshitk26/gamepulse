import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import LobbyScreen from './screens/LobbyScreen';
import LoginScreen from './screens/LoginScreen';
import BetpartyCreationScreen from './screens/BetpartyCreationScreen';
import PartyScreen from './screens/PartyScreen';
import GameScreen from './screens/GameScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import ScreenTransition from './components/ScreenTransition';

type AppRoute = 'lobby' | 'create' | 'waiting' | 'game' | 'leaderboard';

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

  let content: React.ReactElement;

  if (!session) {
    content = <LoginScreen />;
  } else if (route === 'create') {
    content = (
      <BetpartyCreationScreen
        onBack={() => setRoute('lobby')}
        onCreated={(lobbyId) => {
          setActiveLobbyId(lobbyId);
          setRoute('waiting');
        }}
      />
    );
  } else if (route === 'waiting' && activeLobbyId) {
    content = (
      <PartyScreen
        lobbyId={activeLobbyId}
        onExit={() => {
          setActiveLobbyId(null);
          setRoute('lobby');
        }}
        onStartGame={(id) => {
          setActiveLobbyId(id);
          setRoute('game');
        }}
      />
    );
  } else if (route === 'game' && activeLobbyId) {
    content = (
      <GameScreen
        lobbyId={activeLobbyId}
        onBack={() => setRoute('waiting')}
        onShowLeaderboard={(id) => {
          setActiveLobbyId(id);
          setRoute('leaderboard');
        }}
      />
    );
  } else if (route === 'leaderboard' && activeLobbyId) {
    content = (
      <LeaderboardScreen
        lobbyId={activeLobbyId}
        onExit={() => {
          setActiveLobbyId(null);
          setRoute('lobby');
        }}
      />
    );
  } else {
    content = (
      <LobbyScreen
        onCreateLobby={() => setRoute('create')}
        onEnterLobby={(lobbyId) => {
          setActiveLobbyId(lobbyId);
          setRoute('waiting');
        }}
      />
    );
  }

  const dependencyKey = `${route}-${activeLobbyId ?? 'none'}-${session?.user?.id ?? 'guest'}`;
  const backgroundColor = !session
    ? '#05030A'
    : route === 'game'
      ? '#1A0D3F'
      : '#05030A';

  return (
    <ScreenTransition dependency={dependencyKey} backgroundColor={backgroundColor}>
      {content}
    </ScreenTransition>
  );
}
