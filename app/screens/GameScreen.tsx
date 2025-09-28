import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../supabase';
import { parseSupabaseError } from '../utils/parseSupabaseError';

type LobbyRow = {
  id: string;
  owner_id: string;
  status: 'waiting' | 'active' | 'finished' | 'cancelled';
  buy_in: number;
  code: string;
  beginning_time: string | null;
  is_finished?: boolean | null;
  current_question?: any | null; // JSON in DB
};

type Props = {
  lobbyId: string;
  onBack: () => void;
  onShowLeaderboard: (lobbyId: string) => void;
};

type LiveQuestion = {
  Question: string;
  Tip?: string | null;
  Answer: 'Yes' | 'No';
  Choices: ('Yes' | 'No')[];
};

const QUESTION_DURATION_MS = 10_000;
const CORRECT_POINTS = 20;
const WRONG_POINTS = -10;
type SessionStats = { points: number; correct: number; attempted: number };
const STATS_DEFAULT: SessionStats = { points: 0, correct: 0, attempted: 0 };

/** Demo quick facts (flip card at bottom) */
const FACTS_BILLS_CHIEFS = [
  'In their last 10 meetings, Patriots lead 6–4.',
  'Falcons have scored first in 5 of their last 7 vs NE.',
  'Patriots have won 4 straight playoff games when trailing at halftime.',
  'Tom Brady has 2+ total TDs in 7 of his last 8 postseason games.',
  'Matt Ryan averages ~280 pass yards vs NE in his last 5.',
  'Patriots defense allows under 21 PPG in 6 of last 8 playoff games.',
  'Falcons are +5 in turnover margin across their last 6.',
  'Julio Jones has 6+ receptions in 4 of his last 5 vs NE.',
  'Rob Gronkowski averages 8+ targets vs ATL in his last 6.',
  'Patriots are 7–1 when winning time-of-possession in playoff games.',
  'Falcons scored on their opening drive in 3 straight games.',
  'Patriots red-zone TD rate ~65% over last 4 playoff games.',
  'Falcons allowed one 100-yard rusher in 7 of last 10.',
  'Patriots ST average start: own 28-yard line (last 3).',
  'Falcons defense 10+ QB hits in 2 of last 5.',
  'Patriots have forced a takeaway in 5 straight playoff games.',
  'Brady passer rating >100 in 6 of last 8 postseason games.',
  'Edelman TD in 3 of his last 4 playoff games.',
  'Patriots 6–0 when leading at halftime (this playoff year).',
  'Falcons 5–1 when holding foes under 24 points.',
];

const GameScreen: React.FC<Props> = ({ lobbyId, onBack, onShowLeaderboard }) => {
  const [lobby, setLobby] = useState<LobbyRow | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nowTs, setNowTs] = useState(() => Date.now());

  /** quick fact flip card (bottom) */
  const facts = useMemo(() => FACTS_BILLS_CHIEFS, []);
  const [factIndex, setFactIndex] = useState(() => Math.floor(Math.random() * facts.length));
  const flip = useRef(new Animated.Value(0)).current;
  const [isFlipped, setIsFlipped] = useState(false);
  const frontRotate = flip.interpolate({ inputRange: [0, 180], outputRange: ['0deg', '180deg'] });
  const backRotate = flip.interpolate({ inputRange: [0, 180], outputRange: ['180deg', '360deg'] });
  const nextFact = () => {
    if (facts.length < 2) return factIndex;
    let n = Math.floor(Math.random() * facts.length);
    if (n === factIndex) n = (n + 1) % facts.length;
    return n;
  };
  const flipCard = () => {
    const toValue = isFlipped ? 0 : 180;
    Animated.timing(flip, {
      toValue,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setIsFlipped(!isFlipped);
      setFactIndex(nextFact());
    });
  };

  /** live question state */
  const [activeQ, setActiveQ] = useState<LiveQuestion | null>(null);
  const [qExpiresAt, setQExpiresAt] = useState<number | null>(null);
  const [answeredKey, setAnsweredKey] = useState<string | null>(null);
  const [answering, setAnswering] = useState(false);
  const [stats, setStats] = useState<SessionStats>({ ...STATS_DEFAULT });

  const lastQKeyRef = useRef<string>(''); // stable across realtime/poll callbacks
  const keyForQ = (q: any) => (q ? JSON.stringify(q) : 'null');

  const refreshStats = useCallback(
    async (uid: string | null | undefined) => {
      if (!uid) {
        setStats({ ...STATS_DEFAULT });
        return;
      }
      const { data, error } = await supabase
        .from('lobby_players')
        .select('points_earned, correct_bets, questions_attempted')
        .eq('lobby_id', lobbyId)
        .eq('user_id', uid)
        .maybeSingle();
      if (!error && data) {
        setStats({
          points: data.points_earned ?? 0,
          correct: data.correct_bets ?? 0,
          attempted: data.questions_attempted ?? 0,
        });
      } else if (error && error.code === 'PGRST116') {
        // no row yet
        setStats({ ...STATS_DEFAULT });
      }
    },
    [lobbyId]
  );

  const applyRow = useCallback(
    (row: any) => {
      setLobby((prev) => ({ ...(prev ?? ({} as any)), ...row }));
      const incoming = row?.current_question ?? null;
      const nextKey = keyForQ(incoming);
      if (nextKey !== lastQKeyRef.current) {
        lastQKeyRef.current = nextKey;
        if (incoming) {
          setActiveQ(incoming);
          setQExpiresAt(Date.now() + QUESTION_DURATION_MS);
          setNowTs(Date.now());
          setAnsweredKey(null);
        } else {
          setActiveQ(null);
          setQExpiresAt(null);
        }
      }
      if (row?.is_finished) {
        onShowLeaderboard(lobbyId);
        return;
      }
      if (row?.status && row.status !== 'active') onBack();
    },
    [lobbyId, onBack, onShowLeaderboard]
  );

  /** initial load + realtime + polling fallback */
  useEffect(() => {
    let alive = true;
    let sawRealtime = false;

    const load = async () => {
      try {
        setLoading(true);
        const [{ data: row, error }, { data: u, error: ue }] = await Promise.all([
          supabase
            .from('lobbies')
            .select('id, owner_id, status, buy_in, code, beginning_time, is_finished, current_question')
            .eq('id', lobbyId)
            .single(),
          supabase.auth.getUser(),
        ]);
        if (error) throw error;
        if (ue) throw ue;
        if (!alive) return;
        const uid = u.user?.id ?? null;
        setCurrentUserId(uid);
        refreshStats(uid);
        if (row) applyRow(row);
      } catch (e) {
        if (alive) Alert.alert('Unable to load lobby', parseSupabaseError(e));
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();

    const ch = supabase
      .channel(`game-${lobbyId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'lobbies', filter: `id=eq.${lobbyId}` },
        (payload) => {
          sawRealtime = true;
          if (!payload.new) return;
          applyRow(payload.new);
        }
      )
      .subscribe();

    const pollId = setInterval(async () => {
      if (sawRealtime || !alive) return;
      const { data } = await supabase
        .from('lobbies')
        .select('id, owner_id, status, buy_in, code, beginning_time, is_finished, current_question')
        .eq('id', lobbyId)
        .single();
      if (!alive || !data) return;
      applyRow(data);
    }, 1000);

    return () => {
      alive = false;
      ch.unsubscribe();
      clearInterval(pollId);
    };
  }, [applyRow, lobbyId, onBack, refreshStats]);

  /** auto-hide when expired */
  useEffect(() => {
    if (!qExpiresAt) return;
    const remain = qExpiresAt - Date.now();
    if (remain <= 0) {
      setActiveQ(null);
      return;
    }
    const id = setTimeout(() => setActiveQ(null), remain);
    return () => clearTimeout(id);
  }, [qExpiresAt]);

  /** ticking timer for question progress */
  useEffect(() => {
    if (!activeQ || !qExpiresAt) return;
    const tick = () => setNowTs(Date.now());
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [activeQ, qExpiresAt]);

  useEffect(() => {
    refreshStats(currentUserId);
  }, [currentUserId, refreshStats]);

  /** leave (host returns lobby to waiting) */
  const isHost = currentUserId && lobby?.owner_id === currentUserId;
  const handleBack = async () => {
    try {
      if (isHost) {
        const { error } = await supabase
          .from('lobbies')
          .update({ status: 'waiting' })
          .eq('id', lobbyId);
        if (error) throw error;
      }
    } catch (e) {
      Alert.alert('Unable to leave game', parseSupabaseError(e));
    } finally {
      onBack();
    }
  };

  /** submit Yes/No */
  const submitAnswer = async (choice: 'Yes' | 'No') => {
    if (!activeQ || !currentUserId) return;
    const qKey = keyForQ(activeQ);
    if (answering || answeredKey === qKey) return; // double-tap guard
    setAnswering(true);
    try {
      const isCorrect =
        (choice || '').toLowerCase() === (activeQ.Answer || '').toLowerCase();
      const delta = isCorrect ? CORRECT_POINTS : WRONG_POINTS;

      // Read current stats (simple approach; for racing use a SECURITY DEFINER RPC)
      const { data: row, error: readErr } = await supabase
        .from('lobby_players')
        .select('points_earned, correct_bets, questions_attempted')
        .eq('lobby_id', lobbyId)
        .eq('user_id', currentUserId)
        .single();
      if (readErr) throw readErr;

      const nextPoints = (row?.points_earned ?? 0) + delta;
      const nextCorrect = (row?.correct_bets ?? 0) + (isCorrect ? 1 : 0);
      const nextAttempted = (row?.questions_attempted ?? 0) + 1;

      const { error: updErr } = await supabase
        .from('lobby_players')
        .update({
          points_earned: nextPoints,
          correct_bets: nextCorrect,
          questions_attempted: nextAttempted,
        })
        .eq('lobby_id', lobbyId)
        .eq('user_id', currentUserId);
      if (updErr) throw updErr;

      const { error: logErr } = await supabase.from('lobby_answers').insert({
        lobby_id: lobbyId,
        user_id: currentUserId,
        question_key: qKey,
        question_text: activeQ.Question,
        answer: choice,
        is_correct: isCorrect,
        points_delta: delta,
      });
      if (logErr) console.warn('log answer failed', logErr.message ?? logErr);

      setStats({ points: nextPoints, correct: nextCorrect, attempted: nextAttempted });

      // hide this question for this client
      setAnsweredKey(qKey);
      setActiveQ(null);
      setQExpiresAt(null);
    } catch (e) {
      Alert.alert('Answer failed', parseSupabaseError(e));
    } finally {
      setAnswering(false);
    }
  };

  /** render */
  if (loading || !lobby) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#1CE783" size="large" />
      </View>
    );
  }

  const remainingMs = activeQ && qExpiresAt ? Math.max(0, qExpiresAt - nowTs) : 0;
  const qRemainSec = Math.ceil(remainingMs / 1000);
  const progress = activeQ ? Math.min(1, Math.max(0, remainingMs / QUESTION_DURATION_MS)) : 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.8}>
        <Text style={styles.backLabel}>{'← Back to lobby'}</Text>
      </TouchableOpacity>

      <View style={styles.headerBlock}>
        <Text style={styles.gameTitle}>Questions will appear here as the game goes on</Text>
        <Text style={styles.subText}>Lobby {lobby.code} • Buy-in {lobby.buy_in} GP</Text>
        <Text style={styles.statMeta}>Answered {stats.attempted} question{stats.attempted === 1 ? '' : 's'}</Text>
      </View>

      {activeQ ? (
        <View style={styles.qCard}>
          <View style={styles.qHeaderRow}>
            <Text style={styles.qKicker}>Live Bet</Text>
            <View style={styles.timerChip}>
              <Text style={styles.timerText}>{qRemainSec}s</Text>
            </View>
          </View>
          <View style={styles.timerRail}>
            <View style={[styles.timerFill, { flex: progress }]} />
            <View style={{ flex: 1 - progress }} />
          </View>

          <Text style={styles.qTitle}>{activeQ.Question}</Text>

          {!!activeQ.Tip && (
            <View style={styles.qTipRow}>
              <MaterialCommunityIcons
                name="lightbulb-on-outline"
                size={18}
                color="#FFD966"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.qTip}>{activeQ.Tip}</Text>
            </View>
          )}

          <View style={styles.qButtonsColumn}>
            <TouchableOpacity
              style={[styles.qBtnFull, answering && styles.qBtnDisabled]}
              onPress={() => submitAnswer('Yes')}
              disabled={answering}
              activeOpacity={0.85}
            >
              <Text style={styles.qBtnFullLabel}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.qBtnFull, answering && styles.qBtnDisabled]}
              onPress={() => submitAnswer('No')}
              disabled={answering}
              activeOpacity={0.85}
            >
              <Text style={styles.qBtnFullLabel}>No</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.placeholderCard}>
          <Text style={styles.placeholderText}>Waiting for the next prompt…</Text>
        </View>
      )}

      <View style={{ flex: 1 }} />

      <View style={styles.flipWrap}>
        <TouchableOpacity activeOpacity={0.95} onPress={flipCard}>
          <Animated.View
            style={[
              styles.card,
              styles.cardFront,
              { transform: [{ perspective: 1000 }, { rotateY: frontRotate }] },
            ]}
          >
            <Text style={styles.cardKicker}>Quick Fact</Text>
            <Text style={styles.cardText}>{facts[factIndex]}</Text>
            <Text style={styles.cardHint}>Tap to flip</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.card,
              styles.cardBack,
              { transform: [{ perspective: 1000 }, { rotateY: backRotate }] },
            ]}
          >
            <Text style={styles.cardKickerBack}>Quick Fact</Text>
            <Text style={styles.cardText}>{facts[factIndex]}</Text>
            <Text style={styles.cardHint}>Tap for another</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default GameScreen;

/* ---------------- styles ---------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A0D3F',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A0D3F',
  },
  backButton: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 4 },
  backLabel: { color: '#B7A7FF', fontSize: 14, fontWeight: '600' },
  headerBlock: { alignItems: 'center', marginTop: 12, marginBottom: 12 },
  gameTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  subText: { color: '#A895E6', fontSize: 13, marginTop: 4 },

  statMeta: { color: '#A895E6', fontSize: 13, marginTop: 8 },

  /* question card */
  qCard: {
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 16,
  },
  qHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  qKicker: {
    color: '#1CE783',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timerChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(28,231,131,0.18)',
    borderWidth: 1,
    borderColor: '#1CE783',
  },
  timerText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  timerRail: {
    marginTop: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
    flexDirection: 'row',
    overflow: 'hidden',
    height: 6,
  },
  timerFill: {
    backgroundColor: '#1CE783',
  },
  qTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginTop: 18, lineHeight: 28 },
  /* HINT ROW + TEXT */


  /* HINT ROW + TEXT */
  qTipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  qTip: { color: '#D8D0FF', fontSize: 13, flexShrink: 1 },

  qButtonsColumn: { gap: 12, marginTop: 18 },
  qBtnFull: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  qBtnFullLabel: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', letterSpacing: 0.4 },
  qBtnDisabled: { opacity: 0.5 },

  /* placeholder */
  placeholderCard: {
    marginTop: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: { color: '#E6DFFF', fontSize: 15 },

  /* feedback toast */

  /* flip facts (bottom) */
  flipWrap: { marginTop: 12, alignItems: 'center', justifyContent: 'center' },
  card: {
    width: '100%',
    minHeight: 110,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    backfaceVisibility: 'hidden' as any,
  },
  cardFront: { backgroundColor: 'rgba(28, 231, 131, 0.10)', borderColor: '#1CE783' },
  cardBack: {
    backgroundColor: 'rgba(113, 64, 255, 0.12)',
    borderColor: 'rgba(113, 64, 255, 1)',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  cardKicker: {
    color: '#1CE783',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardKickerBack: {
    color: '#B7A7FF',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardText: { color: '#FFFFFF', fontSize: 14, marginTop: 6 },
  cardHint: { color: '#A895E6', fontSize: 11, marginTop: 6 },
});
