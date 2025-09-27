import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Participant = {
  id: string;
  name: string;
};

type Lobby = {
  id: string;
  name: string;
  buyIn: number;
  maxSize: number;
  participants: Participant[];
  statusNote?: string;
};

type PartyScreenProps = {
  lobby: Lobby;
  onBackToLobby?: () => void;
  onInvitePress?: () => void;
};

const PartyScreen: React.FC<PartyScreenProps> = ({ lobby, onBackToLobby, onInvitePress }) => {
  const meta = `${lobby.participants.length}/${lobby.maxSize} joined`;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.purpleGlow} />
      <View style={styles.greenGlow} />

      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={onBackToLobby}
          activeOpacity={0.85}
        >
          <Text style={styles.backLabel}>{'< Lobby'}</Text>
        </TouchableOpacity>
        <Text style={styles.brand}>GamePoints</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.partyCard}>
        <Text style={styles.partyTitle}>{lobby.name}</Text>
        <Text style={styles.partyMeta}>{meta} • Buy-in {lobby.buyIn} GP</Text>
        <View style={styles.cardDivider} />
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Players in Betparty</Text>
          <Text style={styles.sectionSubtitle}>
            Waiting on {Math.max(lobby.maxSize - lobby.participants.length, 0)} more
          </Text>
        </View>
        <FlatList
          data={lobby.participants}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.playerRow}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{item.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View>
                <Text style={styles.playerName}>{item.name}</Text>
                <Text style={styles.playerRole}>{item.id === 'me' ? 'Host' : 'Player'}</Text>
              </View>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={styles.playerSeparator} />}
          style={styles.playerList}
          contentContainerStyle={styles.playerListContent}
        />
      </View>

      <TouchableOpacity
        onPress={onInvitePress}
        activeOpacity={0.85}
        style={styles.inviteButton}
      >
        <Text style={styles.inviteLabel}>Invite Players</Text>
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
  purpleGlow: {
    position: 'absolute',
    top: -140,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 280,
    backgroundColor: 'rgba(113, 64, 255, 0.38)',
  },
  greenGlow: {
    position: 'absolute',
    bottom: -160,
    left: -100,
    width: 320,
    height: 320,
    borderRadius: 320,
    backgroundColor: 'rgba(28, 231, 131, 0.22)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 36,
  },
  backLabel: {
    color: '#6F6895',
    fontSize: 14,
    fontWeight: '600',
  },
  brand: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerSpacer: {
    width: 64,
  },
  partyCard: {
    backgroundColor: 'rgba(12, 12, 21, 0.92)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    flex: 1,
  },
  partyTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
  },
  partyMeta: {
    color: '#9088B4',
    fontSize: 14,
    marginBottom: 20,
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: '#6F6895',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  playerList: {
    flexGrow: 0,
  },
  playerListContent: {
    paddingBottom: 12,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerSeparator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 12,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(28, 231, 131, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(28, 231, 131, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarInitial: {
    color: '#1CE783',
    fontSize: 18,
    fontWeight: '700',
  },
  playerName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  playerRole: {
    color: '#6F6895',
    fontSize: 12,
    marginTop: 2,
  },
  inviteButton: {
    marginTop: 24,
    backgroundColor: 'rgba(28, 231, 131, 0.12)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1CE783',
    paddingVertical: 14,
    alignItems: 'center',
  },
  inviteLabel: {
    color: '#1CE783',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
