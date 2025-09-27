// PartyScreen.tsx
import React, { useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";

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

type PartyScreenProps = {
  lobby: Lobby;
  currentUserId: string;
  onBackToLobby: () => void;
  onInvitePress: () => void;
};

export default function PartyScreen({ 
  lobby, 
  currentUserId, 
  onBackToLobby, 
  onInvitePress 
}: PartyScreenProps) {
  const [gameStarted, setGameStarted] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{lobby.name}</Text>
      <Text style={styles.lobbyInfo}>Buy-in: ${lobby.buyIn} • {lobby.participants.length}/{lobby.maxSize} players</Text>
      {lobby.statusNote && <Text style={styles.statusNote}>{lobby.statusNote}</Text>}

      {!gameStarted ? (
        <>
          <Text style={styles.subheader}>Players in the room:</Text>
          <FlatList
            data={lobby.participants}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.playerCard}>
                <Text style={styles.playerName}>{item.name}</Text>
                {item.id === lobby.hostId && <Text style={styles.hostTag}>HOST</Text>}
              </View>
            )}
            style={{ width: "100%" }}
          />
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.inviteButton}
              onPress={onInvitePress}
            >
              <Text style={styles.inviteButtonText}>Invite Players</Text>
            </TouchableOpacity>
            
            {currentUserId === lobby.hostId && (
              <TouchableOpacity
                style={styles.startButton}
                onPress={() => setGameStarted(true)}
              >
                <Text style={styles.startButtonText}>Start Game</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity
            style={styles.leaveButton}
            onPress={onBackToLobby}
          >
            <Text style={styles.leaveButtonText}>Leave Party</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.gameContainer}>
          <Text style={styles.subheader}>Suggested Bets & Stats</Text>
          <Text style={styles.text}>[Dynamic game stats will appear here]</Text>
          <TouchableOpacity
            style={styles.leaveButton}
            onPress={onBackToLobby}
          >
            <Text style={styles.leaveButtonText}>Back to Lobby</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#05030A",
    alignItems: "center",
    padding: 24,
    paddingTop: 48,
  },
  header: {
    fontSize: 28,
    fontWeight: "800",
    color: "#8000FF",
    marginBottom: 8,
  },
  lobbyInfo: {
    fontSize: 16,
    color: "#C0B9D9",
    marginBottom: 8,
  },
  statusNote: {
    fontSize: 14,
    color: "#00FF88",
    fontWeight: "600",
    marginBottom: 24,
  },
  subheader: {
    fontSize: 18,
    color: "#FFFFFF",
    marginBottom: 12,
  },
  playerCard: {
    backgroundColor: "rgba(128, 0, 255, 0.1)",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  playerName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  hostTag: {
    color: "#8000FF",
    fontSize: 12,
    fontWeight: "700",
    backgroundColor: "rgba(128, 0, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    marginBottom: 16,
  },
  startButton: {
    backgroundColor: "#8000FF",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  inviteButton: {
    backgroundColor: "rgba(128, 0, 255, 0.2)",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#8000FF",
  },
  inviteButtonText: {
    color: "#8000FF",
    fontSize: 16,
    fontWeight: "700",
  },
  leaveButton: {
    backgroundColor: "transparent",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FF4444",
  },
  leaveButtonText: {
    color: "#FF4444",
    fontSize: 16,
    fontWeight: "600",
  },
  gameContainer: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  text: {
    color: "#C0B9D9",
    fontSize: 16,
    marginTop: 12,
  },
});
// End of PartyScreen.tsx