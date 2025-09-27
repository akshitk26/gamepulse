import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type BetpartyCreationScreenProps = {
  onBack?: () => void;
  onSubmit?: (payload: { lobbyName: string; buyIn: number; maxSize: number }) => void;
};

const BetpartyCreationScreen: React.FC<BetpartyCreationScreenProps> = ({
  onBack,
  onSubmit,
}) => {
  const [lobbyName, setLobbyName] = useState('');
  const [buyIn, setBuyIn] = useState<number>(20);
  const [maxSize, setMaxSize] = useState<number>(10);

  const canSubmit = useMemo(
    () => lobbyName.trim().length > 0 && buyIn > 0 && maxSize >= 2,
    [lobbyName, buyIn, maxSize]
  );

  const adjustBuyIn = (delta: number) => {
    setBuyIn((prev) => {
      const next = Math.max(0, prev + delta);
      return Math.round(next / 10) * 10;
    });
  };

  const adjustMaxSize = (delta: number) => {
    setMaxSize((prev) => {
      const next = Math.max(2, prev + delta);
      return next;
    });
  };

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }

    onSubmit?.({
      lobbyName: lobbyName.trim(),
      buyIn,
      maxSize,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.purpleGlow} />
      <View style={styles.greenGlow} />

      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.85}
          style={styles.backButton}
        >
          <Text style={styles.backLabel}>{'< Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Betparty</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionLabel}>Lobby Title</Text>
        <TextInput
          value={lobbyName}
          onChangeText={setLobbyName}
          placeholder="Name your Betparty"
          placeholderTextColor="#635F81"
          style={styles.input}
        />

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
            <Text style={styles.stepperValue}>{buyIn} GP</Text>
          </View>
          <TouchableOpacity
            onPress={() => adjustBuyIn(10)}
            style={[styles.stepperButton, styles.stepperButtonRight]}
            activeOpacity={0.8}
          >
            <Text style={styles.stepperLabel}>+10</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Lobby Max Size</Text>
        <View style={styles.stepperRow}>
          <TouchableOpacity
            onPress={() => adjustMaxSize(-1)}
            style={[styles.stepperButton, styles.stepperButtonLeft]}
            activeOpacity={0.8}
          >
            <Text style={styles.stepperLabel}>-</Text>
          </TouchableOpacity>
          <View style={styles.stepperValueBox}>
            <Text style={styles.stepperValue}>{maxSize} Players</Text>
          </View>
          <TouchableOpacity
            onPress={() => adjustMaxSize(1)}
            style={[styles.stepperButton, styles.stepperButtonRight]}
            activeOpacity={0.8}
          >
            <Text style={styles.stepperLabel}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={!canSubmit}
        activeOpacity={0.85}
      >
        <View style={styles.submitContent}>
          <Text
            style={[styles.submitLabel, !canSubmit && styles.submitLabelDisabled]}
          >
            Create Betparty
          </Text>
          <Text
            style={[styles.submitArrow, !canSubmit && styles.submitLabelDisabled]}
          >
            -&gt;
          </Text>
        </View>
      </TouchableOpacity>
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
  formCard: {
    backgroundColor: 'rgba(12, 12, 21, 0.92)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 18,
  },
  sectionLabel: {
    color: '#9088B4',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(5, 3, 10, 0.8)',
    paddingHorizontal: 18,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperButton: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(5, 3, 10, 0.8)',
  },
  stepperButtonLeft: {
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  stepperButtonRight: {
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  stepperLabel: {
    color: '#1CE783',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  stepperValueBox: {
    paddingHorizontal: 20,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(12, 12, 21, 0.9)',
  },
  stepperValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  submitButton: {
    marginTop: 32,
    backgroundColor: '#1CE783',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  submitButtonDisabled: {
    backgroundColor: 'rgba(28, 231, 131, 0.3)',
  },
  submitContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  submitLabel: {
    color: '#05030A',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  submitLabelDisabled: {
    color: 'rgba(5, 3, 10, 0.5)',
  },
  submitArrow: {
    color: '#05030A',
    fontSize: 18,
    fontWeight: '700',
  },
});
