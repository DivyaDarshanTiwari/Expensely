import { View, Text, StyleSheet } from 'react-native';

export default function ReportsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reports</Text>
      <Text style={styles.subtitle}>Detailed analytics coming soon!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#f9f9f9' },
  title: { fontSize: 26, fontWeight: '600', color: '#333', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666' },
});
