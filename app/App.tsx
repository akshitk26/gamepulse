import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>GamePulse</Text>
      <Text style={styles.subtitle}>Hello from Expo 👋</Text>
      <Text style={styles.info}>
        If you can read this on your phone, Expo Go is working.
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 18, marginBottom: 12 },
  info: { fontSize: 14, opacity: 0.7, textAlign: 'center' },
});