import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../supabase';

type LobbyWaitingProps = {
  lobbyId: string;
  onExit?: () => void;
};

type LobbyRow = {
  id: string;
  code: string;
  buy_in: number;
  status: string;
  owner_id: string;
  game?: {
    league: string;
    home: string;
    away: string;
    start_time: string;
  } | null;
};

type PlayerRow = {
  user_id: string;
  profiles?: {
    username: string | null;
  } | null;
};

const PartyScreen: React.FC<LobbyWaitingProps> = ({ lobbyId, onExit }) => {
  const [lobby, setLobby] = useState<LobbyRow | null>(null);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const hydrateUser = useCallback(async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    setCurrentUserId(data.user?.id ?? null);
  }, []);

  const loadLobby = useCallback(async () => {
    const { data, error } = await supabase
      .from('lobbies')
      .select(
        `id, code, buy_in, status, owner_id,
         game:games ( league, home, away, start_time )`
      )
      .eq('id', lobbyId)
      .single();
    if (error) throw error;

    setLobby({
      ...data,
      game: Array.isArray(data.game) ? data.game[0] ?? null : data.game ?? null,
    });
  }, [lobbyId]);

  const loadPlayers = useCallback(async () => {
    const { data, error } = await supabase
      .from('lobby_players')
      .select('user_id, profiles(username)')
      .eq('lobby_id', lobbyId);
    if (error) throw error;

    const rows = (data ?? []).map((row: any) => ({
      ...row,
      profiles: Array.isArray(row.profiles) ? row.profiles[0] ?? null : row.profiles ?? null,
    })) as PlayerRow[];

    setPlayers(rows);
  }, [lobbyId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        await Promise.all([hydrateUser(), loadLobby(), loadPlayers()]);
      } catch (e) {
        if (mounted) Alert.alert('Load failed', e instanceof Error ? e.message : String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const channel = supabase
      .channel(`lobby-${lobbyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lobbies', filter: `id=eq.${lobbyId}` }, () => {
        loadLobby().catch((err) => console.warn('refresh lobby failed', err));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lobby_players', filter: `lobby_id=eq.${lobbyId}` }, () => {
        loadPlayers().catch((err) => console.warn('refresh players failed', err));
      })
      .subscribe();

    return () => {
      mounted = false;
      channel.unsubscribe();
    };
  }, [hydrateUser, loadLobby, loadPlayers, lobbyId]);

  const handleLeave = useCallback(async () => {
    try {
      if (!currentUserId) {
        onExit?.();
        return;
      }
      await supabase
        .from('lobby_players')
        .delete()
        .eq('lobby_id', lobbyId)
        .eq('user_id', currentUserId);
    } catch (e) {
      Alert.alert('Leave failed', e instanceof Error ? e.message : String(e));
    } finally {
      onExit?.();
    }
  }, [currentUserId, lobbyId, onExit]);

  const playerItems = useMemo(() => {
    return players.map((p) => ({
      id: p.user_id,
      name: p.profiles?.username ?? p.user_id.slice(0, 6),
    }));
  }, [players]);

  const hostId = lobby?.owner_id;

  const renderPlayer = ({ item }: { item: { id: string; name: string } }) => (
    <View style={styles.playerCard}>
      <Text style={styles.playerName}>{item.name}</Text>
      {item.id === hostId && <Text style={styles.hostTag}>HOST</Text>}
    </View>
  );

  if (loading || !lobby) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1CE783" />
      </View>
    );
  }

  const gameLine = lobby.game
    ? `${lobby.game.away} @ ${lobby.game.home}`
    : 'Matchup TBD';
  const startTime = lobby.game
    ? new Date(lobby.game.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <View style={styles.container}>
      <View style={styles.purpleGlow} />
      <View style={styles.greenGlow} />

      <Text style={styles.heading}>Lobby Ready</Text>
      <Text style={styles.gameLine}>{gameLine}</Text>
      {startTime ? <Text style={styles.gameTime}>Starts at {startTime}</Text> : null}

      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>Share this code</Text>
        <Text style={styles.lobbyCode}>{lobby.code}</Text>
        <Text style={styles.codeMeta}>{lobby.buy_in} GP buy-in • {playerItems.length} players</Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Players in the room</Text>
        <Text style={styles.sectionSubtitle}>Updates in real time</Text>
      </View>

      <FlatList
        data={playerItems}
        keyExtractor={(item) => item.id}
        renderItem={renderPlayer}
        contentContainerStyle={{ gap: 12, paddingBottom: 32 }}
        ListEmptyComponent={() => (
          <Text style={styles.emptyList}>Waiting for the first player to join…</Text>
        )}
      />

      <TouchableOpacity style={styles.leaveButton} onPress={handleLeave} activeOpacity={0.85}>
        <Text style={styles.leaveLabel}>Leave Lobby</Text>
      </TouchableOpacity>
    </View>
  );
};

export default PartyScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05030A',
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#05030A',
  },
  purpleGlow: {
    position: 'absolute',
    top: -140,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 280,
    backgroundColor: 'rgba(113, 64, 255, 0.35)',
  },
  greenGlow: {
    position: 'absolute',
    bottom: -160,
    left: -100,
    width: 320,
    height: 320,
    borderRadius: 320,
    backgroundColor: 'rgba(28, 231, 131, 0.2)',
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  gameLine: {
    fontSize: 18,
    color: '#C0B9D9',
  },
  gameTime: {
    fontSize: 14,
    color: '#6F6895',
    marginBottom: 24,
  },
  codeCard: {
    backgroundColor: 'rgba(12, 12, 21, 0.92)',
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    marginBottom: 32,
  },
  codeLabel: {
    color: '#6F6895',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  lobbyCode: {
    color: '#1CE783',
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: 6,
    marginTop: 12,
    marginBottom: 6,
  },
  codeMeta: {
    color: '#9088B4',
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: '#6F6895',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  playerCard: {
    backgroundColor: 'rgba(12, 12, 21, 0.92)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  hostTag: {
    color: '#1CE783',
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: 'rgba(28, 231, 131, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  emptyList: {
    color: '#6F6895',
    fontSize: 14,
    textAlign: 'center',
  },
  leaveButton: {
    marginTop: 'auto',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FF5D5D',
    paddingVertical: 16,
    alignItems: 'center',
  },
  leaveLabel: {
    color: '#FF5D5D',
    fontSize: 16,
    fontWeight: '700',
  },
});
