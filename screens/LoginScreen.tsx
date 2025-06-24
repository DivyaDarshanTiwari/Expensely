import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert 
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ChartSummary } from '../components/ChartSummary';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [secureText, setSecureText] = useState<boolean>(true);

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert('Success', 'Logged in successfully!');
    } catch (error: any) {
      Alert.alert('Login Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.header}>Welcome Back</Text>
        <Text>Please enter your details to log in</Text>
        <TextInput
          style={styles.input}
          placeholder="john@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Min 8 Characters"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={secureText}
        />
        <TouchableOpacity onPress={() => setSecureText(!secureText)}>
          <Text>{secureText ? "Show" : "Hide"} Password</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
          <Text style={styles.loginText}>LOGIN</Text>
        </TouchableOpacity>
        <Text>
          Don&apos;t have an account? 
          <Text onPress={() => navigation.navigate('SignUp')} style={styles.signup}> SignUp</Text>
        </Text>
      </View>
      <ChartSummary />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', padding: 20 },
  formContainer: { flex: 1, justifyContent: 'center' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  input: { borderWidth: 1, padding: 10, marginVertical: 10, borderRadius: 8 },
  loginBtn: { backgroundColor: '#6C63FF', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  loginText: { color: 'white', fontWeight: 'bold' },
  signup: { color: '#6C63FF' }
});
