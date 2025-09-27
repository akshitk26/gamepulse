import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../supabase';

type GameRow = { id: string; league: string; home: string; away: string; start_time: string };

type LobbyRow = {
  id: string;
  code: string;
  buy_in: number;
  status: 'waiting' | 'live' | 'finished' | 'cancelled';
  game: GameRow | null;
};

type Props = {
  onEnterLobby?: (lobbyId: string) => void;
};

const LobbyScreen: React.FC<Props> = ({ onEnterLobby }) => {
  const [username, setUsername] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);

  const [lobbies, setLobbies] = useState<LobbyRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [codeInput, setCodeInput] = useState('');
  const [games, setGames] = useState<GameRow[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const loadUser = useCallback(async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    const user = data.user;
    if (!user) throw new Error('No authenticated user');

    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('username, points')
      .eq('id', user.id)
      .single();
    if (profileErr) throw profileErr;

    setUsername(profile?.username ?? null);
    setCredits(profile?.points ?? 0);
  }, []);

  const loadLobbies = useCallback(async () => {
    const { data, error } = await supabase
      .from('lobbies')
      .select(
        `id, code, buy_in, status,
         game:games ( id, league, home, away, start_time )`
      )
      .in('status', ['waiting', 'live'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    const rows = (data ?? []).map((row: any) => ({
      ...row,
      game: Array.isArray(row.game) ? row.game[0] ?? null : row.game ?? null,
    })) as LobbyRow[];

    setLobbies(rows);
  }, []);

  const loadGames = useCallback(async () => {
    const { data, error } = await supabase
      .from('games')
      .select('id, league, home, away, start_time')
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(10);

    if (error) throw error;

    const rows = (data ?? []) as GameRow[];
    setGames(rows);
    if (rows.length) {
      setSelectedGameId((prev) => prev ?? rows[0].id);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        setLoading(true);
        await Promise.all([loadUser(), loadLobbies(), loadGames()]);
      } catch (e) {
        if (isMounted) Alert.alert('Error', e instanceof Error ? e.message : String(e));
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    const channel = supabase
      .channel('lobbies-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lobbies' }, () => {
        loadLobbies().catch((err) => console.warn('Refresh lobbies failed', err));
      })
      .subscribe();

    return () => {
      isMounted = false;
      channel.unsubscribe();
    };
  }, [loadGames, loadLobbies, loadUser]);

  const joinByCode = useCallback(async () => {
    try {
      setJoining(true);
      const code = codeInput.trim().toUpperCase();
      if (!code) {
        Alert.alert('Join by code', 'Enter a code.');
        return;
      }

      const { data, error } = await supabase.rpc('join_lobby_by_code', { p_code: code });
      if (error) throw error;

      const lobbyId = (Array.isArray(data) ? data?.[0]?.lobby_id : data?.lobby_id) as string | undefined;
      if (!lobbyId) throw new Error('Lobby not found');

      onEnterLobby?.(lobbyId);
    } catch (e) {
      Alert.alert('Join failed', e instanceof Error ? e.message : String(e));
    } finally {
      setJoining(false);
    }
  }, [codeInput, onEnterLobby]);

  const joinFromList = useCallback(
    async (lobbyId: string) => {
      try {
        setJoining(true);
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        const userId = data.user?.id;
        if (!userId) throw new Error('No authenticated user');

        const { error: insertErr } = await supabase
          .from('lobby_players')
          .insert({ lobby_id: lobbyId, user_id: userId });

        if (insertErr && !String(insertErr.message).includes('duplicate key')) throw insertErr;
        onEnterLobby?.(lobbyId);
      } catch (e) {
        Alert.alert('Join failed', e instanceof Error ? e.message : String(e));
      } finally {
        setJoining(false);
      }
    },
    [onEnterLobby]
  );

  const createLobby = useCallback(async () => {
    try {
      setCreating(true);
      if (!selectedGameId) {
        Alert.alert('Create lobby', 'Pick a game first.');
        return;
      }

      const { data, error } = await supabase.rpc('create_lobby', {
        p_game_id: selectedGameId,
        p_buy_in: 0,
        p_max_players: 5,
      });
      if (error) throw error;

      const result = Array.isArray(data) ? data[0] : data;
      const lobbyId = result?.lobby_id as string | undefined;
      if (!lobbyId) throw new Error('Unable to create lobby');

      onEnterLobby?.(lobbyId);
    } catch (e) {
      Alert.alert('Create failed', e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  }, [onEnterLobby, selectedGameId]);

  const cycleGame = useCallback(() => {
    if (!games.length) return;
    const currentIndex = games.findIndex((g) => g.id === selectedGameId);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % games.length : 0;
    setSelectedGameId(games[nextIndex].id);
  }, [games, selectedGameId]);

  const selectedGame = useMemo(
    () => games.find((g) => g.id === selectedGameId) ?? null,
    [games, selectedGameId]
  );

  const gameLabel = useCallback((g: GameRow) => {
    const time = new Date(g.start_time).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${g.league} • ${g.away} @ ${g.home} • ${time}`;
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.purpleGlow} />
      <View style={styles.greenGlow} />

      <View style={styles.headerRow}>
        <View>
          <Text style={styles.brand}>GamePoints</Text>
          {loading ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.tagline}>
              Hey, {username ?? 'Player'} 👋 See today&apos;s BetParties.
            </Text>
          )}
        </View>
        <View style={styles.creditBadge}>
          {loading ? <ActivityIndicator /> : <Text style={styles.creditValue}>{credits}</Text>}
        </View>
      </View>

      <View style={styles.joinRow}>
        <TextInput
          style={styles.codeInput}
          placeholder="Enter lobby code"
          placeholderTextColor="#7A7397"
          autoCapitalize="characters"
          value={codeInput}
          onChangeText={setCodeInput}
          maxLength={8}
        />
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton, { paddingHorizontal: 16 }]}
          onPress={joinByCode}
          disabled={joining}
        >
          <Text style={[styles.actionLabel, styles.secondaryLabel]}>{joining ? 'Joining…' : 'Join'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.createBox}>
        <Text style={styles.sectionTitle}>Create your lobby</Text>
        {loading ? (
          <ActivityIndicator />
        ) : games.length === 0 ? (
          <Text style={styles.sectionSubtitle}>No upcoming games. Add some in the database.</Text>
        ) : (
          <>
            <TouchableOpacity style={styles.gamePicker} onPress={cycleGame}>
              <Text style={styles.gameText}>
                {selectedGame ? gameLabel(selectedGame) : 'Pick a game'}
              </Text>
              <Text style={styles.gameHint}>tap to change</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={createLobby}
              disabled={creating}
              activeOpacity={0.85}
            >
              <Text style={[styles.actionLabel, styles.primaryLabel]}>
                {creating ? 'Creating…' : 'Create Lobby'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.lobbySection}>
        <Text style={styles.sectionTitle}>Current Lobbies</Text>
        <Text style={styles.sectionSubtitle}>Tap a lobby to join.</Text>

        {loading ? (
          <ActivityIndicator />
        ) : (
          <FlatList
            data={lobbies}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 16 }}
            renderItem={({ item }) => {
              const game = item.game;
              const matchup = game ? `${game.away} @ ${game.home}` : 'Game TBD';
              const time = game
                ? new Date(game.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'TBD';

              return (
                <TouchableOpacity
                  style={styles.lobbyCard}
                  activeOpacity={0.9}
                  onPress={() => joinFromList(item.id)}
                  disabled={joining}
                >
                  <View>
                    <Text style={styles.lobbyName}>{matchup}</Text>
                    <Text style={styles.lobbyMeta}>
                      {time} • {item.status.toUpperCase()} • Code {item.code}
                    </Text>
                  </View>
                  <View style={styles.buyInPill}>
                    <Text style={styles.buyInValue}>{item.buy_in}</Text>
                    <Text style={styles.buyInLabel}>GP</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </View>
  );
};

export default LobbyScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05030A',
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 32,
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  brand: { color: '#FFFFFF', fontSize: 28, fontWeight: '800', letterSpacing: 0.5 },
  tagline: { color: '#C0B9D9', fontSize: 15, marginTop: 4 },
  creditBadge: {
    minWidth: 52,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1CE783',
    backgroundColor: 'rgba(28, 231, 131, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  creditValue: { color: '#1CE783', fontSize: 18, fontWeight: '700' },
  joinRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 12 },
  codeInput: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    color: '#FFF',
    backgroundColor: 'rgba(12,12,21,0.9)',
  },
  createBox: { marginBottom: 24, gap: 12 },
  gamePicker: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(12,12,21,0.9)',
  },
  gameText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  gameHint: { color: '#6F6895', fontSize: 12, marginTop: 2 },
  actionButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: { backgroundColor: '#1CE783' },
  secondaryButton: {
    backgroundColor: 'rgba(28, 231, 131, 0.08)',
    borderWidth: 1,
    borderColor: '#1CE783',
  },
  actionLabel: { fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  primaryLabel: { color: '#05030A' },
  secondaryLabel: { color: '#1CE783' },
  lobbySection: { backgroundColor: 'transparent', marginTop: 8 },
  sectionTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 6 },
  sectionSubtitle: { color: '#9088B4', fontSize: 13, marginBottom: 12 },
  lobbyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(12, 12, 21, 0.9)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  lobbyName: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginBottom: 2 },
  lobbyMeta: { color: '#6F6895', fontSize: 12 },
  buyInPill: {
    backgroundColor: 'rgba(28, 231, 131, 0.12)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1CE783',
  },
  buyInValue: { color: '#1CE783', fontSize: 16, fontWeight: '700' },
  buyInLabel: { color: '#6F6895', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
});
