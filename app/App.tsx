import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.purpleGlow} />
      <View style={styles.greenGlow} />

      <View style={styles.headerRow}>
        <Text style={styles.brand}>GamePulse</Text>
        <Text style={styles.tagline}>Step into tonight's BetParties.</Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          activeOpacity={0.85}
        >
          <Text style={[styles.actionLabel, styles.primaryLabel]}>Create Betparty</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          activeOpacity={0.85}
        >
          <Text style={[styles.actionLabel, styles.secondaryLabel]}>Join a Betparty</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bodyCard}>
        <Text style={styles.cardTitle}>Live Lobbies</Text>
        <Text style={styles.cardSubtitle}>Curated props, synced lines, real-time sweats.</Text>
        <View style={styles.cardDivider} />
        <View style={styles.lobbyRow}>
          <View>
            <Text style={styles.lobbyName}>NBA Night Shift</Text>
            <Text style={styles.lobbyMeta}>Opens in 12m • 32 spots left</Text>
          </View>
          <Text style={styles.lobbyStake}>$20</Text>
        </View>
        <View style={styles.lobbyRow}>
          <View>
            <Text style={styles.lobbyName}>MLB Moonshots</Text>
            <Text style={styles.lobbyMeta}>Live • 12 bettors • PrizeBoost x1.4</Text>
          </View>
          <Text style={styles.lobbyStake}>$15</Text>
        </View>
      </View>

      <View style={styles.footerNote}>
        <Text style={styles.footerText}>Stack your props, invite the squad, chase the green.</Text>
      </View>
    </View>
  );
}

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
    marginBottom: 36,
  },
  brand: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tagline: {
    color: '#C0B9D9',
    fontSize: 16,
    marginTop: 6,
  },
  actionRow: {
    flexDirection: 'row',
    marginBottom: 48,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#1CE783',
    marginRight: 16,
  },
  secondaryButton: {
    backgroundColor: 'rgba(28, 231, 131, 0.08)',
    borderWidth: 1,
    borderColor: '#1CE783',
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  primaryLabel: {
    color: '#05030A',
  },
  secondaryLabel: {
    color: '#1CE783',
  },
  bodyCard: {
    backgroundColor: 'rgba(12, 12, 21, 0.9)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: '#9088B4',
    fontSize: 14,
    marginBottom: 20,
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
  },
  lobbyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  lobbyName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  lobbyMeta: {
    color: '#6F6895',
    fontSize: 13,
  },
  lobbyStake: {
    color: '#1CE783',
    fontSize: 16,
    fontWeight: '700',
  },
  footerNote: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingTop: 32,
  },
  footerText: {
    color: '#635F81',
    fontSize: 13,
    textAlign: 'center',
  },
});

