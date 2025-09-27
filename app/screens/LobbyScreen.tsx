import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
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

/** ---------- Utils ---------- */
const parseSupabaseError = (err: unknown) => {
  if (!err) return 'Unknown error';
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'object' && err !== null) {
    const maybe = err as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
    const fields = [maybe.message, maybe.details, maybe.hint, maybe.code].filter(
      (field): field is string => typeof field === 'string' && field.trim().length > 0
    );
    if (fields.length) return fields.join(' — ');
  }
  try { return JSON.stringify(err); } catch { return String(err); }
};

/** ---------- Types ---------- */
type LobbyRow = {
  id: string;
  code: string;
  buy_in: number;
  status: 'waiting' | 'live' | 'finished' | 'cancelled';
  game: {
    id: string;
    league: string;
    home: string;
    away: string;
    start_time: string;
  } | null;
};

type Props = {
  onEnterLobby?: (lobbyId: string) => void;
  onCreateLobby?: () => void;
};

/** ---------- RPC helpers (no generics to appease TS versions) ---------- */
async function rpcGetLobbyMemberCount(lobbyId: string): Promise<number> {
  const { data, error } = await supabase.rpc('get_lobby_member_count', {
    p_lobby_id: lobbyId,
  });
  if (error) throw error;
  return (data as number) ?? 0;
}

type LobbyPlayerRow = {
  lobby_id: string;
  user_id: string;
  joined_at: string;
  points_earned: number | null;
  correct_bets: number | null;
};
async function rpcGetLobbyRoster(lobbyId: string): Promise<LobbyPlayerRow[]> {
  const { data, error } = await supabase.rpc('get_lobby_roster', {
    p_lobby_id: lobbyId,
  });
  if (error) throw error;
  return (data as LobbyPlayerRow[]) ?? [];
}

/** ---------- Screen ---------- */
const LobbyScreen: React.FC<Props> = ({ onEnterLobby, onCreateLobby }) => {
  const [username, setUsername] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);

  const [lobbies, setLobbies] = useState<LobbyRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [codeInput, setCodeInput] = useState('');
  const [joining, setJoining] = useState(false);
  const [joiningLobbyId, setJoiningLobbyId] = useState<string | null>(null); // NEW

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

    setUsername((profile as any)?.username ?? null);
    setCredits((profile as any)?.points ?? 0);
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

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        setLoading(true);
        await Promise.all([loadUser(), loadLobbies()]);
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
  }, [loadLobbies, loadUser]);

  /** Join by manual code (kept) */
  const joinByCode = useCallback(async () => {
    try {
      setJoining(true);
      const code = codeInput.trim().toUpperCase();
      if (!code) {
        Alert.alert('Join by code', 'Enter a code.');
        return;
      }

      const { data: lobby, error: lobbyErr } = await supabase
        .from('lobbies')
        .select('id, status, max_players')
        .eq('code', code)
        .maybeSingle();
      if (lobbyErr) throw lobbyErr;
      if (!lobby) throw new Error('Lobby not found');
      if (lobby.status === 'finished' || lobby.status === 'cancelled') {
        throw new Error('This lobby is no longer accepting players.');
      }

      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const userId = userData.user?.id;
      if (!userId) throw new Error('No authenticated user');

      const currentCount = await rpcGetLobbyMemberCount(lobby.id);
      if (lobby.max_players && typeof lobby.max_players === 'number') {
        if (currentCount >= lobby.max_players) throw new Error('Lobby is full.');
      }

      const { error: insertErr } = await supabase
        .from('lobby_players')
        .upsert(
          { lobby_id: lobby.id, user_id: userId, joined_at: new Date().toISOString() },
          { onConflict: 'lobby_id,user_id' }
        );
      if (insertErr) throw insertErr;

      onEnterLobby?.(lobby.id);
    } catch (e) {
      Alert.alert('Join failed', parseSupabaseError(e));
    } finally {
      setJoining(false);
    }
  }, [codeInput, onEnterLobby]);

  /** NEW: Tap a lobby row to auto-join that lobby */
  const joinLobbyFromList = useCallback(
    async (lobbyId: string) => {
      try {
        setJoiningLobbyId(lobbyId);

        // Fetch the lobby to validate it’s joinable
        const { data: lobby, error: lobbyErr } = await supabase
          .from('lobbies')
          .select('id, status, max_players')
          .eq('id', lobbyId)
          .maybeSingle();
        if (lobbyErr) throw lobbyErr;
        if (!lobby) throw new Error('Lobby not found');
        if (lobby.status === 'finished' || lobby.status === 'cancelled') {
          throw new Error('This lobby is no longer accepting players.');
        }

        // Get user
        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr) throw userErr;
        const userId = userData.user?.id;
        if (!userId) throw new Error('No authenticated user');

        // Capacity check (accurate via RPC)
        const currentCount = await rpcGetLobbyMemberCount(lobby.id);
        if (lobby.max_players && typeof lobby.max_players === 'number') {
          if (currentCount >= lobby.max_players) throw new Error('Lobby is full.');
        }

        // Upsert membership
        const { error: insertErr } = await supabase
          .from('lobby_players')
          .upsert(
            { lobby_id: lobby.id, user_id: userId, joined_at: new Date().toISOString() },
            { onConflict: 'lobby_id,user_id' }
          );
        if (insertErr) throw insertErr;

        onEnterLobby?.(lobby.id);
      } catch (e) {
        Alert.alert('Join failed', parseSupabaseError(e));
      } finally {
        setJoiningLobbyId(null);
      }
    },
    [onEnterLobby]
  );

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      Alert.alert('Signed out', 'You have been logged out.');
    } catch (err: any) {
      Alert.alert('Sign out failed', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.purpleGlow} />
      <View style={styles.greenGlow} />

      {/* Header with logout button */}
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
        <View style={{ alignItems: 'flex-end' }}>
          <View style={styles.creditBadge}>
            {loading ? <ActivityIndicator /> : <Text style={styles.creditValue}>{credits}</Text>}
          </View>
          <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Join lobby by code (still available) */}
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

      {/* Create lobby section */}
      <View style={styles.createBox}>
        <Text style={styles.sectionTitle}>Create your lobby</Text>
        <Text style={styles.sectionSubtitle}>
          Set a buy-in and pick a matchup on the next screen.
        </Text>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={onCreateLobby}
          activeOpacity={0.85}
        >
          <Text style={[styles.actionLabel, styles.primaryLabel]}>Open Creator</Text>
        </TouchableOpacity>
      </View>

      {/* Lobbies list (tap to auto-join) */}
      <View style={styles.lobbySection}>
        <Text style={styles.sectionTitle}>Current Lobbies</Text>
        <Text style={styles.sectionSubtitle}>Tap a lobby to join instantly.</Text>

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
              const busy = joiningLobbyId === item.id;

              return (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => joinLobbyFromList(item.id)}
                  disabled={busy}
                  style={[styles.lobbyCard, busy && { opacity: 0.6 }]}
                >
                  <View>
                    <Text style={styles.lobbyName}>{matchup}</Text>
                    <Text style={styles.lobbyMeta}>
                      {time} • {item.status.toUpperCase()} • Code {item.code}
                    </Text>
                  </View>
                  <View style={styles.buyInPill}>
                    {busy ? (
                      <ActivityIndicator />
                    ) : (
                      <>
                        <Text style={styles.buyInValue}>{item.buy_in}</Text>
                        <Text style={styles.buyInLabel}>GP</Text>
                      </>
                    )}
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

/** ---------- Styles ---------- */
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
  logoutButton: { marginTop: 6, paddingVertical: 4, paddingHorizontal: 8 },
  logoutText: { color: '#FF5555', fontSize: 12, fontWeight: '600' },
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
    minWidth: 56,
    minHeight: 32,
    justifyContent: 'center',
  },
  buyInValue: { color: '#1CE783', fontSize: 16, fontWeight: '700' },
  buyInLabel: { color: '#6F6895', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
});
