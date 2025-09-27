import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../supabase';
import { parseSupabaseError } from '../utils/parseSupabaseError';

type LobbyRow = {
  id: string;
  owner_id: string;
  status: string;
  buy_in: number;
  code: string;
};

type Props = {
  lobbyId: string;
  onBack: () => void;
};

/** --------- Bills vs Chiefs facts (20) --------- */
const FACTS_BILLS_CHIEFS = [
  'In their last 15 meetings, Chiefs lead 10–5.',
  'Bills have scored first in 7 of the last 10 vs KC.',
  'Chiefs have won 5 straight home games vs AFC East opponents.',
  'Josh Allen has 2+ total TDs in 8 of his last 9 vs KC.',
  'Patrick Mahomes averages ~300 pass yards vs BUF in his last 5.',
  'Bills defense allows under 21 PPG in road games this season.',
  'Chiefs are +6 in turnover margin across their last 6 games.',
  'Stefon Diggs has 6+ receptions in 4 of his last 5 vs KC.',
  'Travis Kelce averages 8+ targets vs BUF in his last 6.',
  'Bills are 4–1 when winning the time-of-possession vs KC.',
  'Chiefs have scored on their opening drive in 3 straight.',
  'Bills have a 65% red-zone TD rate over their last 4.',
  'Chiefs have allowed one 100-yard rusher in their last 10.',
  'Bills special teams average start: their own 29-yard line last 3.',
  'Chiefs defense has 10+ QB hits in 3 of last 5 games.',
  'Bills have forced a takeaway in 6 straight games.',
  'Mahomes has a passer rating over 100 in 4 of last 6 vs BUF.',
  'Josh Allen has a rushing TD in 3 of his last 4 vs KC.',
  'Chiefs are 8–0 this season when leading at halftime.',
  'Bills are 5–1 when holding opponents under 24 points.',
];

const GameScreen: React.FC<Props> = ({ lobbyId, onBack }) => {
  const [lobby, setLobby] = useState<LobbyRow | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ---------- Flip-card state ----------
  const facts = useMemo(() => FACTS_BILLS_CHIEFS, []);
  const [factIndex, setFactIndex] = useState(() => Math.floor(Math.random() * facts.length));
  const flip = useRef(new Animated.Value(0)).current; // 0deg or 180deg
  const [isFlipped, setIsFlipped] = useState(false);

  const frontRotate = flip.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });
  const backRotate = flip.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const nextFact = () => {
    if (facts.length < 2) return factIndex;
    let next = Math.floor(Math.random() * facts.length);
    if (next === factIndex) next = (next + 1) % facts.length;
    return next;
  };

  const flipCard = () => {
    const toValue = isFlipped ? 0 : 180;
    Animated.timing(flip, {
      toValue,
      duration: 250, // faster
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setIsFlipped(!isFlipped);
      setFactIndex(nextFact());
    });
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const [{ data: lobbyData, error: lobbyErr }, { data: userData, error: userErr }] = await Promise.all([
          supabase.from('lobbies').select('id, owner_id, status, buy_in, code').eq('id', lobbyId).single(),
          supabase.auth.getUser(),
        ]);
        if (lobbyErr) throw lobbyErr;
        if (userErr) throw userErr;
        if (!active) return;
        setLobby(lobbyData);
        setCurrentUserId(userData.user?.id ?? null);
      } catch (e) {
        if (active) Alert.alert('Unable to load lobby', parseSupabaseError(e));
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    const channel = supabase
      .channel(`game-${lobbyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lobbies', filter: `id=eq.${lobbyId}` }, (payload) => {
        const next = payload.new as LobbyRow;
        setLobby(next);
        if (next.status !== 'active') onBack();
      })
      .subscribe();
    return () => {
      active = false;
      channel.unsubscribe();
    };
  }, [lobbyId, onBack]);

  const isHost = useMemo(() => currentUserId && lobby?.owner_id === currentUserId, [currentUserId, lobby?.owner_id]);

  const handleBack = async () => {
    try {
      if (isHost) {
        const { error } = await supabase.from('lobbies').update({ status: 'waiting' }).eq('id', lobbyId);
        if (error) throw error;
      }
    } catch (e) {
      Alert.alert('Unable to leave game', parseSupabaseError(e));
    } finally {
      onBack();
    }
  };

  if (loading || !lobby) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#1CE783" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.8}>
        <Text style={styles.backLabel}>{'← Back to lobby'}</Text>
      </TouchableOpacity>

      <View style={styles.headerBlock}>
        <Text style={styles.gameTitle}>Questions will appear here as the game goes on</Text>
        <Text style={styles.subText}>Lobby {lobby.code} • Buy-in {lobby.buy_in} GP</Text>
      </View>

      <View style={styles.placeholderCard}>
        <Text style={styles.placeholderText}>Coming soon: Live bets & prompts</Text>
      </View>

      {/* Spacer pushes the flip card to bottom */}
      <View style={{ flex: 1 }} />

      {/* -------- Flip Card with Quick Facts at bottom -------- */}
      <View style={styles.flipWrap}>
        <TouchableOpacity activeOpacity={0.95} onPress={flipCard}>
          {/* Front */}
          <Animated.View style={[styles.card, styles.cardFront, { transform: [{ perspective: 1000 }, { rotateY: frontRotate }] }]}>
            <Text style={styles.cardKicker}>Quick Fact</Text>
            <Text style={styles.cardText}>{facts[factIndex]}</Text>
            <Text style={styles.cardHint}>Tap to flip</Text>
          </Animated.View>

          {/* Back */}
          <Animated.View style={[styles.card, styles.cardBack, { transform: [{ perspective: 1000 }, { rotateY: backRotate }] }]}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A0D3F',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32, // room at bottom
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A0D3F',
  },
  backButton: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 4 },
  backLabel: { color: '#B7A7FF', fontSize: 14, fontWeight: '600' },
  headerBlock: { alignItems: 'center', marginTop: 24 },
  gameTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', textAlign: 'center' },
  subText: { color: '#A895E6', fontSize: 14, marginTop: 8 },
  placeholderCard: {
    marginTop: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: { color: '#E6DFFF', fontSize: 16 },

  /* ---- Flip Card ---- */
  flipWrap: { marginTop: 16, alignItems: 'center', justifyContent: 'center' },
  card: {
    width: '100%',
    minHeight: 120,
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
  cardKicker: { color: '#1CE783', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  cardKickerBack: { color: '#B7A7FF', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  cardText: { color: '#FFFFFF', fontSize: 14, marginTop: 6 },
  cardHint: { color: '#A895E6', fontSize: 11, marginTop: 6 },
});
