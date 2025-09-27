import React, { useState } from 'react';
import { Alert } from 'react-native';
import LobbyScreen from './screens/LobbyScreen';
import BetpartyCreationScreen from './screens/BetpartyCreationScreen';
import { supabase } from './supabase';

type ScreenKey = 'lobby' | 'create';

type BetpartyPayload = {
  lobbyName: string;
  buyIn: number;
  maxSize: number;
};

export default function App() {
  const [screen, setScreen] = useState<ScreenKey>('lobby');

  const handleCreate = (payload: BetpartyPayload) => {
    Alert.alert(
      'Betparty Created',
      `${payload.lobbyName} • Buy-in ${payload.buyIn} GP • Max ${payload.maxSize} players`
    );
    setScreen('lobby');
  };

  if (screen === 'create') {
    return (
      <BetpartyCreationScreen
        onBack={() => setScreen('lobby')}
        onSubmit={handleCreate}
      />
    );
  }

  return <LobbyScreen onCreatePress={() => setScreen('create')} />;
}
