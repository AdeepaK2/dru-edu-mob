import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const API_URL = 'http://localhost:3001/api/v1'; // Change to your API URL

export default function SignupScreen() {
  const [step, setStep] = useState(1); // 1: verify email, 2: complete signup
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkedStudents, setLinkedStudents] = useState<any[]>([]);

  const handleVerifyEmail = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success && data.data?.verified) {
        setLinkedStudents(data.data.students || []);
        setName(data.data.parentInfo?.name || '');
        setPhone(data.data.parentInfo?.phone || '');
        setStep(2);
        Alert.alert(
          'Email Verified',
          `Found ${data.data.studentsCount} student(s) linked to this email`
        );
      } else {
        Alert.alert(
          'Email Not Found',
          data.message || 'This email is not registered in our student records. Please contact your school.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
      console.error('Verify email error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!name || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name,
          phone,
        }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert(
          'Account Created!',
          'Your account has been created successfully. You can now login.',
          [
            {
              text: 'Login',
              onPress: () => router.replace('/(auth)/login'),
            },
          ]
        );
      } else {
        Alert.alert('Error', data.message || 'Signup failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
      console.error('Signup error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.logo}>DRU EDU</Text>
        <Text style={styles.subtitle}>Parent Portal</Text>
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.description}>
          {step === 1
            ? 'Enter your email to verify your identity'
            : 'Complete your account setup'}
        </Text>

        {/* Step indicator */}
        <View style={styles.stepIndicator}>
          <View style={[styles.step, step >= 1 && styles.stepActive]}>
            <Text style={[styles.stepText, step >= 1 && styles.stepTextActive]}>1</Text>
          </View>
          <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
          <View style={[styles.step, step >= 2 && styles.stepActive]}>
            <Text style={[styles.stepText, step >= 2 && styles.stepTextActive]}>2</Text>
          </View>
        </View>

        {step === 1 ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.hint}>
              Enter the email registered with your child&apos;s school
            </Text>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleVerifyEmail}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verify Email</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Show linked students */}
            {linkedStudents.length > 0 && (
              <View style={styles.studentsCard}>
                <Text style={styles.studentsTitle}>Linked Students</Text>
                {linkedStudents.map((student, index) => (
                  <View key={index} style={styles.studentItem}>
                    <Text style={styles.studentName}>{student.studentName}</Text>
                    <Text style={styles.studentEmail}>{student.studentEmail}</Text>
                  </View>
                ))}
              </View>
            )}

            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
            />

            <TextInput
              style={styles.input}
              placeholder="Phone Number (optional)"
              placeholderTextColor="#999"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setStep(1)}
            >
              <Text style={styles.backButtonText}>← Back to email verification</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={styles.linkText}>Sign In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
    backgroundColor: '#4F46E5',
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#E0E7FF',
    marginTop: 4,
  },
  form: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 24,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  step: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepActive: {
    backgroundColor: '#4F46E5',
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  stepTextActive: {
    color: '#fff',
  },
  stepLine: {
    width: 60,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: '#4F46E5',
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  hint: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 20,
    marginTop: -4,
  },
  button: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  backButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  backButtonText: {
    color: '#6B7280',
    fontSize: 15,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  footerText: {
    color: '#6B7280',
    fontSize: 15,
  },
  linkText: {
    color: '#4F46E5',
    fontSize: 15,
    fontWeight: '600',
  },
  studentsCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  studentsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
    marginBottom: 12,
  },
  studentItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#C7D2FE',
  },
  studentName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  studentEmail: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
});
