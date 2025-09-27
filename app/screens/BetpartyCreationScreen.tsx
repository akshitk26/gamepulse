import { StatusBar } from 'expo-status-bar';
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

type GameRow = {
  id: string;
  league: string;
  home: string;
  away: string;
  start_time: string;
};

type BetpartyCreationScreenProps = {
  onBack?: () => void;
  onCreated?: (lobbyId: string) => void;
};

const DEFAULT_MAX_PLAYERS = 5;

const BetpartyCreationScreen: React.FC<BetpartyCreationScreenProps> = ({ onBack, onCreated }) => {
  const [buyIn, setBuyIn] = useState<number>(20);
  const [games, setGames] = useState<GameRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingFor, setCreatingFor] = useState<string | null>(null);

  const loadGames = useCallback(async () => {
    const { data, error } = await supabase
      .from('games')
      .select('id, league, home, away, start_time')
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(25);

    if (error) throw error;
    setGames((data ?? []) as GameRow[]);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await loadGames();
      } catch (e) {
        Alert.alert('Load failed', e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [loadGames]);

  const adjustBuyIn = (delta: number) => {
    setBuyIn((prev) => Math.max(0, prev + delta));
  };

  const formatGameLabel = useCallback((game: GameRow) => {
    const start = new Date(game.start_time).toLocaleString([], {
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      day: 'numeric',
    });
    return `${game.league} • ${game.away} @ ${game.home} • ${start}`;
  }, []);

  const generateLobbyCode = () => {
    const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i += 1) {
      const idx = Math.floor(Math.random() * alphabet.length);
      code += alphabet[idx];
    }
    return code;
  };

  const handlePickGame = async (gameId: string) => {
    try {
      setCreatingFor(gameId);
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const userId = userData.user?.id;
      if (!userId) throw new Error('No authenticated user');

      const code = generateLobbyCode();

      const { data: lobbyData, error: lobbyErr } = await supabase
        .from('lobbies')
        .insert({
          owner_id: userId,
          game_id: gameId,
          buy_in: buyIn,
          code,
          status: 'waiting',
          max_players: DEFAULT_MAX_PLAYERS,
        })
        .select('id')
        .single();
      if (lobbyErr) throw lobbyErr;

      const lobbyId = lobbyData?.id as string | undefined;
      if (!lobbyId) throw new Error('Lobby id missing after create');

      await supabase
        .from('lobby_players')
        .upsert({ lobby_id: lobbyId, user_id: userId }, { onConflict: 'lobby_id,user_id' });

      onCreated?.(lobbyId);
    } catch (e) {
      Alert.alert('Create failed', e instanceof Error ? e.message : String(e));
    } finally {
      setCreatingFor(null);
    }
  };

  const renderGame = ({ item }: { item: GameRow }) => {
    const busy = creatingFor === item.id;
    return (
      <TouchableOpacity
        style={[styles.gameCard, busy && styles.gameCardDisabled]}
        onPress={() => handlePickGame(item.id)}
        disabled={busy}
        activeOpacity={0.85}
      >
        <View style={styles.gameCardHeader}>
          <Text style={styles.gameLeague}>{item.league}</Text>
          <Text style={styles.gameTime}>
            {new Date(item.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <Text style={styles.gameMatch}>
          {item.away} @ {item.home}
        </Text>
        <Text style={styles.gameSubtitle}>{formatGameLabel(item)}</Text>
        <View style={styles.gameFooter}>
          <Text style={styles.gameBuyIn}>{buyIn} GP buy-in</Text>
          {busy && <ActivityIndicator size="small" color="#1CE783" />}
        </View>
      </TouchableOpacity>
    );
  };

  const buyInLabel = useMemo(() => `${buyIn} GP`, [buyIn]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.purpleGlow} />
      <View style={styles.greenGlow} />

      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.85} style={styles.backButton}>
          <Text style={styles.backLabel}>{'< Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Betparty</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.buyInCard}>
        <Text style={styles.sectionLabel}>Buy-in (GamePoints)</Text>
        <View style={styles.stepperRow}>
          <TouchableOpacity
            onPress={() => adjustBuyIn(-10)}
            style={[styles.stepperButton, styles.stepperButtonLeft]}
            activeOpacity={0.8}
          >
            <Text style={styles.stepperLabel}>-10</Text>
          </TouchableOpacity>
          <View style={styles.stepperValueBox}>
            <Text style={styles.stepperValue}>{buyInLabel}</Text>
          </View>
          <TouchableOpacity
            onPress={() => adjustBuyIn(10)}
            style={[styles.stepperButton, styles.stepperButtonRight]}
            activeOpacity={0.8}
          >
            <Text style={styles.stepperLabel}>+10</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.buyInHint}>Tap a matchup below to launch your waiting room.</Text>
      </View>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#1CE783" />
        </View>
      ) : (
        <FlatList
          data={games}
          keyExtractor={(item) => item.id}
          renderItem={renderGame}
          contentContainerStyle={{ paddingBottom: 48, gap: 16 }}
          ListEmptyComponent={() => (
            <Text style={styles.emptyText}>
              No upcoming games found. Add some fixtures in Supabase to get started.
            </Text>
          )}
        />
      )}
    </View>
  );
};

export default BetpartyCreationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05030A',
    paddingHorizontal: 24,
    paddingTop: 64,
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 36,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backLabel: {
    color: '#6F6895',
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 48,
  },
  buyInCard: {
    backgroundColor: 'rgba(12, 12, 21, 0.92)',
    borderRadius: 20,
    padding: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 24,
  },
  sectionLabel: {
    color: '#6F6895',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  stepperButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(128, 0, 255, 0.15)',
  },
  stepperButtonLeft: {
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    borderRightWidth: 1,
    borderColor: '#8000FF',
  },
  stepperButtonRight: {
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    borderLeftWidth: 1,
    borderColor: '#8000FF',
  },
  stepperLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  stepperValueBox: {
    minWidth: 120,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5, 3, 10, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  stepperValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  buyInHint: {
    color: '#9088B4',
    fontSize: 13,
    marginTop: 12,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#6F6895',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 32,
  },
  gameCard: {
    backgroundColor: 'rgba(12, 12, 21, 0.92)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  gameCardDisabled: {
    opacity: 0.7,
  },
  gameCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gameLeague: {
    color: '#1CE783',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  gameTime: {
    color: '#9088B4',
    fontSize: 14,
  },
  gameMatch: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  gameSubtitle: {
    color: '#6F6895',
    fontSize: 13,
  },
  gameFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  gameBuyIn: {
    color: '#1CE783',
    fontSize: 15,
    fontWeight: '700',
  },
});
