import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

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

type LobbyScreenProps = {
  lobbies: Lobby[];
  credits: number;
  userName?: string;
  onCreatePress?: () => void;
  onSignOut?: () => void;
};

const LobbyScreen: React.FC<LobbyScreenProps> = ({
  lobbies,
  credits,
  userName,
  onCreatePress,
  onSignOut,
}) => {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.purpleGlow} />
      <View style={styles.greenGlow} />

      <View style={styles.headerRow}>
        <View>
          <Text style={styles.brand}>GamePoints</Text>
          <Text style={styles.tagline}>
            {userName ? `Welcome back, ${userName}.` : "Step into tonight's BetParties."}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <View style={styles.creditBadge}>
            <Text style={styles.creditValue}>{credits}</Text>
          </View>
          {onSignOut && (
            <TouchableOpacity
              style={styles.signOutButton}
              activeOpacity={0.85}
              onPress={onSignOut}
            >
              <Text style={styles.signOutLabel}>Sign out</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          activeOpacity={0.85}
          onPress={onCreatePress}
        >
          <Text style={[styles.actionLabel, styles.primaryLabel]}>Create Betparty</Text>
        </TouchableOpacity>
        <View style={styles.actionSpacer} />
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          activeOpacity={0.85}
        >
          <Text style={[styles.actionLabel, styles.secondaryLabel]}>Join a Betparty</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.lobbySection}>
        <Text style={styles.sectionTitle}>Live Lobbies</Text>
        <Text style={styles.sectionSubtitle}>
          Pick a matchup, stake your GamePoints, sweat the props.
        </Text>

        {lobbies.map((lobby) => {
          const capacity = `${lobby.participants.length}/${lobby.maxSize} joined`;
          const meta = lobby.statusNote ? `${lobby.statusNote} • ${capacity}` : capacity;

          return (
            <View key={lobby.id} style={styles.lobbyCard}>
              <View>
                <Text style={styles.lobbyName}>{lobby.name}</Text>
                <Text style={styles.lobbyMeta}>{meta}</Text>
              </View>
              <View style={styles.buyInPill}>
                <Text style={styles.buyInValue}>{lobby.buyIn}</Text>
                <Text style={styles.buyInLabel}>GP</Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.footerNote}>
        <Text style={styles.footerText}>Stack your props, invite the squad, chase the green.</Text>
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
    marginBottom: 40,
  },
  headerActions: {
    alignItems: 'flex-end',
  },
  brand: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tagline: {
    color: '#C0B9D9',
    fontSize: 15,
    marginTop: 4,
  },
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
  creditValue: {
    color: '#1CE783',
    fontSize: 18,
    fontWeight: '700',
  },
  signOutButton: {
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  signOutLabel: {
    color: '#9088B4',
    fontSize: 13,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    marginBottom: 48,
  },
  actionSpacer: {
    width: 16,
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
  lobbySection: {
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  sectionSubtitle: {
    color: '#9088B4',
    fontSize: 14,
    marginBottom: 24,
  },
  lobbyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(12, 12, 21, 0.9)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 16,
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
  buyInPill: {
    backgroundColor: 'rgba(28, 231, 131, 0.12)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1CE783',
  },
  buyInValue: {
    color: '#1CE783',
    fontSize: 16,
    fontWeight: '700',
  },
  buyInLabel: {
    color: '#6F6895',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
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
