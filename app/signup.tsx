import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

export default function SignUpScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>
      <TextInput placeholder="Email" style={styles.input} />
      <TextInput placeholder="Password" secureTextEntry style={styles.input} />
      <TextInput placeholder="Confirm Password" secureTextEntry style={styles.input} />
      <Button title="Register" onPress={() => {}} />
    </View>
  );
}