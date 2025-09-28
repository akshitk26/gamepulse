import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import * as Haptics from 'expo-haptics';
import { supabase } from '../supabase';
import { parseSupabaseError } from '../utils/parseSupabaseError';

type LeaderRow = {
  user_id: string;
  username: string | null;
  points_earned: number;
  correct_bets: number | null;
  questions_attempted: number | null;
  payout: number;
  profit: number;
  new_balance: number;
  accuracy?: number;
};

type Props = {
  lobbyId: string;
  onExit: () => void;
};

const LeaderboardScreen: React.FC<Props> = ({ lobbyId, onExit }) => {
  const [leaders, setLeaders] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buyIn, setBuyIn] = useState(0);
  const [pool, setPool] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiRef = useRef(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, []);

  // Trigger confetti and haptic feedback for positive profit users
  useEffect(() => {
    if (!loading && leaders.length > 0 && currentUserId) {
      const currentUser = leaders.find(leader => leader.user_id === currentUserId);
      if (currentUser && currentUser.profit > 0) {
        // Multiple haptic feedback bursts for celebration
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 200);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 400);
        
        // Show confetti
        setShowConfetti(true);
        
        // Hide confetti after 4 seconds
        setTimeout(() => {
          setShowConfetti(false);
        }, 4000);
      }
    }
  }, [loading, leaders, currentUserId]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const { data, error: fnErr } = await supabase.functions.invoke('settle_lobby', {
          body: { lobbyId },
        });
        if (fnErr) throw fnErr;
        if (!mounted) return;
        const payload = (data ?? {}) as {
          leaderboard?: LeaderRow[];
          buy_in?: number;
          pool?: number;
        };
        setLeaders(payload.leaderboard ?? []);
        setBuyIn(payload.buy_in ?? 0);
        setPool(payload.pool ?? 0);
        setError(null);
      } catch (e) {
        if (mounted) setError(parseSupabaseError(e));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    const channel = supabase
      .channel(`leader-${lobbyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lobby_players', filter: `lobby_id=eq.${lobbyId}` }, load)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'lobbies', filter: `id=eq.${lobbyId}` }, load)
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [lobbyId]);

  const renderItem = ({ item, index }: { item: LeaderRow; index: number }) => {
    const attempts = item.questions_attempted ?? 0;
    const correct = item.correct_bets ?? 0;
    const accuracyPct = attempts > 0 ? Math.round(((item.accuracy ?? (correct / attempts || 0)) * 100)) : 0;
    return (
    <View style={[styles.row, index === 0 && styles.rowFirst]}>
      <Text style={styles.rank}>{index + 1}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.username ?? 'Player'}</Text>
        <Text style={styles.userId}>{item.user_id.slice(0, 8)}</Text>
        <Text style={styles.meta}>Accuracy {accuracyPct}% • {attempts} attempts</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.profit, item.profit >= 0 ? styles.profitPositive : styles.profitNegative]}>
          {item.profit >= 0 ? '+' : ''}{item.profit} GP
        </Text>
        <Text style={styles.payoutLabel}>Payout {item.payout} GP</Text>
      </View>
    </View>
  );
  };

  const me = leaders.find((row) => row.user_id === currentUserId);

  return (
    <View style={styles.container}>
      <View style={styles.purpleGlow} />
      <View style={styles.greenGlow} />
      
      {/* Confetti for winners */}
      {showConfetti && (
        <>
          <ConfettiCannon
            ref={confettiRef}
            count={150}
            origin={{ x: -10, y: 0 }}
            autoStart={true}
            fadeOut={true}
            fallSpeed={2500}
            colors={['#1CE783', '#8000FF', '#FFD700', '#FF6B6B', '#4ECDC4']}
          />
          <ConfettiCannon
            count={100}
            origin={{ x: 410, y: 0 }}
            autoStart={true}
            fadeOut={true}
            fallSpeed={3000}
            colors={['#1CE783', '#8000FF', '#FFD700', '#FF6B6B', '#4ECDC4']}
          />
        </>
      )}

      <Text style={styles.title}>Final Standings</Text>
      <Text style={styles.subtitle}>
        Pool {pool} GP • {leaders.length} players × {buyIn} GP
      </Text>

      {loading ? (
        <View style={styles.loadingBlock}>
          <ActivityIndicator color="#1CE783" />
        </View>
      ) : error ? (
        <View style={styles.loadingBlock}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={leaders}
          keyExtractor={(item) => item.user_id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 16, gap: 12 }}
        />
      )}

      {me && (
        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>Your Result</Text>
          <Text
            style={[
              styles.resultValue,
              me.profit >= 0 ? styles.profitPositive : styles.profitNegative,
            ]}
          >
            {me.profit >= 0 ? '+' : ''}{me.profit} GP
          </Text>
          <Text style={styles.resultSub}>Balance {me.new_balance} GP</Text>
          <Text style={styles.resultSub}>
            Accuracy {me.questions_attempted ? Math.round(((me.accuracy ?? ((me.correct_bets ?? 0) / (me.questions_attempted ?? 1))) * 100)) : 0}% • {me.questions_attempted ?? 0} attempts
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.backButton} onPress={onExit} activeOpacity={0.85}>
        <Text style={styles.backLabel}>Back to Lobby</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LeaderboardScreen;

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
    backgroundColor: 'rgba(113, 64, 255, 0.25)',
  },
  greenGlow: {
    position: 'absolute',
    bottom: -160,
    left: -100,
    width: 320,
    height: 320,
    borderRadius: 320,
    backgroundColor: 'rgba(28, 231, 131, 0.18)',
  },
  title: { color: '#FFFFFF', fontSize: 24, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: '#9F8CFF', fontSize: 13, textAlign: 'center', marginTop: 6, letterSpacing: 1 },
  loadingBlock: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#FF6F6F', fontSize: 14, textAlign: 'center', paddingHorizontal: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowFirst: {
    borderColor: '#1CE783',
    backgroundColor: 'rgba(28,231,131,0.15)',
  },
  rank: { color: '#1CE783', fontSize: 18, fontWeight: '800', width: 28, textAlign: 'center' },
  name: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  userId: { color: '#6F6895', fontSize: 12 },
  meta: { color: '#A895E6', fontSize: 12, marginTop: 4 },
  profit: { fontSize: 16, fontWeight: '700' },
  payoutLabel: { color: '#6F6895', fontSize: 11 },
  profitPositive: { color: '#1CE783' },
  profitNegative: { color: '#FF6F6F' },
  resultCard: {
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 18,
    alignItems: 'center',
  },
  resultLabel: { color: '#A895E6', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' },
  resultValue: { fontSize: 26, fontWeight: '800', marginTop: 8 },
  resultSub: { color: '#9F8CFF', fontSize: 12, marginTop: 4 },
  backButton: {
    marginTop: 'auto',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1CE783',
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(28,231,131,0.12)',
  },
  backLabel: { color: '#1CE783', fontSize: 16, fontWeight: '700' },
});
