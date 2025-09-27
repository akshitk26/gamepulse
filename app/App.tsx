import React, { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import AuthScreen from './screens/AuthScreen';
import LobbyScreen from './screens/LobbyScreen';
import BetpartyCreationScreen from './screens/BetpartyCreationScreen';
import PartyScreen from './screens/PartyScreen';
import { auth, db } from './firebase/firebase';

type ScreenKey = 'lobby' | 'create' | 'party';

type Participant = {
  id: string;
  name: string;
};

type Lobby = {
  id: string;
  name: string;
  buyIn: number;
  maxSize: number;
  hostId: string;
  participants: Participant[];
  statusNote?: string;
};

type BetpartyPayload = {
  lobbyName: string;
  buyIn: number;
  maxSize: number;
};

type Profile = {
  displayName?: string;
  credits?: number;
};

const seededLobbies: Lobby[] = [
  {
    id: 'lobby-1',
    name: 'Knicks @ Heat',
    buyIn: 25,
    maxSize: 12,
    hostId: 'host-knicks',
    participants: [
      { id: 'mia', name: 'Mia' },
      { id: 'derek', name: 'Derek' },
      { id: 'alex', name: 'Alex' },
    ],
    statusNote: 'Tips in 15m',
  },
  {
    id: 'lobby-2',
    name: 'Warriors @ Grizzlies',
    buyIn: 40,
    maxSize: 15,
    hostId: 'host-warriors',
    participants: [
      { id: 'sarah', name: 'Sarah' },
      { id: 'lee', name: 'Lee' },
      { id: 'tasha', name: 'Tasha' },
      { id: 'cory', name: 'Cory' },
    ],
    statusNote: 'Live',
  },
  {
    id: 'lobby-3',
    name: 'Celtics @ Bucks',
    buyIn: 60,
    maxSize: 10,
    hostId: 'host-celtics',
    participants: [
      { id: 'jamal', name: 'Jamal' },
      { id: 'noah', name: 'Noah' },
    ],
    statusNote: 'Opens in 1h',
  },
];

export default function App() {
  const [screen, setScreen] = useState<ScreenKey>('lobby');
  const [lobbies, setLobbies] = useState<Lobby[]>(seededLobbies);
  const [activeLobbyId, setActiveLobbyId] = useState<string | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (!user) {
        setProfile(null);
        setScreen('lobby');
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadProfile = async (uid: string) => {
      try {
        setProfileLoading(true);
        const snapshot = await getDoc(doc(db, 'profiles', uid));
        if (snapshot.exists()) {
          setProfile(snapshot.data() as Profile);
        } else {
          // Fallback to auth display name if no profile document yet.
          setProfile({ displayName: firebaseUser?.displayName ?? firebaseUser?.email ?? undefined, credits: 100 });
        }
      } catch (error) {
        console.error('Failed to load profile', error);
      } finally {
        setProfileLoading(false);
      }
    };

    if (firebaseUser) {
      loadProfile(firebaseUser.uid);
    }
  }, [firebaseUser]);

  const currentUser = useMemo(() => {
    if (!firebaseUser) return null;
    const displayName = profile?.displayName || firebaseUser.displayName || firebaseUser.email || 'Player';
    const credits = profile?.credits ?? 100;
    return { id: firebaseUser.uid, name: displayName, credits };
  }, [firebaseUser, profile]);

  const activeLobby = useMemo(
    () => lobbies.find((lobby) => lobby.id === activeLobbyId) || null,
    [lobbies, activeLobbyId]
  );

  const handleCreate = (payload: BetpartyPayload) => {
    if (!currentUser) {
      Alert.alert('Sign in required', 'Please log in before creating a Betparty.');
      return;
    }

    const id = `lobby-${Date.now()}`;
    const newLobby: Lobby = {
      id,
      name: payload.lobbyName,
      buyIn: payload.buyIn,
      maxSize: payload.maxSize,
      hostId: currentUser.id,
      participants: [{ id: currentUser.id, name: currentUser.name }],
      statusNote: 'Waiting for players',
    };

    setLobbies((prev) => [newLobby, ...prev]);
    setActiveLobbyId(id);
    setScreen('party');
  };

  const handleLeaveParty = () => {
    if (!activeLobby || !currentUser) {
      setScreen('lobby');
      return;
    }

    setLobbies((prev) =>
      prev.map((lobby) =>
        lobby.id === activeLobby.id
          ? {
              ...lobby,
              participants: lobby.participants.filter((p) => p.id !== currentUser.id),
              statusNote: 'Open for players',
            }
          : lobby
      )
    );
    setScreen('lobby');
    setActiveLobbyId(null);
  };

  const handleInviteFromParty = () => {
    Alert.alert('Coming soon', 'Inviting others to your Betparty is on the roadmap.');
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      Alert.alert('Sign-out failed', error?.message ?? 'Unable to sign out right now.');
    }
  };

  if (!firebaseUser) {
    return <AuthScreen onAuthComplete={() => setScreen('lobby')} />;
  }

  if (!currentUser || profileLoading) {
    return null; // Waiting for profile to load
  }

  if (screen === 'create') {
    return (
      <BetpartyCreationScreen
        onBack={() => setScreen('lobby')}
        onSubmit={handleCreate}
      />
    );
  }

  if (screen === 'party' && activeLobby) {
    return (
      <PartyScreen
        lobby={activeLobby}
        currentUserId={currentUser.id}
        onBackToLobby={handleLeaveParty}
        onInvitePress={handleInviteFromParty}
      />
    );
  }

  return (
    <LobbyScreen
      lobbies={lobbies}
      credits={currentUser.credits ?? 0}
      userName={currentUser.name}
      onCreatePress={() => setScreen('create')}
      onSignOut={handleSignOut}
    />
  );
}
