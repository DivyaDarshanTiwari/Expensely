import { View, Text, StyleSheet } from 'react-native';

export default function GroupExpenseList() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Group Expenses</Text>
      {[
        { name: 'Trip to Goa', amount: '₹4,500' },
        { name: 'Roommates', amount: '₹3,200' },
        { name: 'Office Lunch', amount: '₹2,100' }
      ].map((item, index) => (
        <View style={styles.item} key={index}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.amount}>{item.amount}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8
  },
  name: {
    fontSize: 14,
    color: '#444'
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF'
  }
});
