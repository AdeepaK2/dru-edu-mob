import { useState, useRef, useEffect } from 'react';
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
  Image,
} from 'react-native';
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { AUTH_ENDPOINTS } from '../../src/config/api';

export default function SignupScreen() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [linkedStudents, setLinkedStudents] = useState<any[]>([]);
  const [resendTimer, setResendTimer] = useState(0);
  
  const otpInputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleVerifyEmail = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(AUTH_ENDPOINTS.verifyEmail, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success && data.data?.verified) {
        setLinkedStudents(data.data.students || []);
        setName(data.data.parentInfo?.name || '');
        setPhone(data.data.parentInfo?.phone || '');
        setStep(2);
        setResendTimer(60);
        Alert.alert('📧 OTP Sent', `A verification code has been sent to ${email}`);
      } else {
        Alert.alert('❌ Email Not Found', data.message || 'This email is not registered in our student records.');
      }
    } catch {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      const pastedOtp = value.slice(0, 6).split('');
      const newOtp = [...otp];
      pastedOtp.forEach((digit, i) => {
        if (i < 6) newOtp[i] = digit;
      });
      setOtp(newOtp);
      if (pastedOtp.length === 6) {
        otpInputs.current[5]?.focus();
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(AUTH_ENDPOINTS.verifyOtp, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode }),
      });

      const data = await response.json();

      if (data.success) {
        setLinkedStudents(data.data.students || linkedStudents);
        if (data.data.parentInfo?.name) setName(data.data.parentInfo.name);
        if (data.data.parentInfo?.phone) setPhone(data.data.parentInfo.phone);
        setStep(3);
        Alert.alert('✅ Verified', 'Your email has been verified successfully!');
      } else {
        Alert.alert('❌ Invalid Code', data.message || 'The verification code is incorrect.');
      }
    } catch {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    
    setLoading(true);
    try {
      const response = await fetch(AUTH_ENDPOINTS.resendOtp, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setOtp(['', '', '', '', '', '']);
        setResendTimer(60);
        Alert.alert('📧 Code Resent', 'A new verification code has been sent to your email.');
      } else {
        Alert.alert('Error', data.message || 'Failed to resend code.');
      }
    } catch {
      Alert.alert('Error', 'Network error. Please try again.');
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
      const response = await fetch(AUTH_ENDPOINTS.signup, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, phone }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert('🎉 Account Created!', 'Your account has been created successfully.', [
          { text: 'Login Now', onPress: () => router.replace('/(auth)/login') },
        ]);
      } else {
        Alert.alert('Error', data.message || 'Signup failed');
      }
    } catch {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <View style={styles.stepRow}>
        <View style={[styles.stepCircle, step >= 1 && styles.stepCircleActive]}>
          {step > 1 ? <Ionicons name="checkmark" size={16} color="#fff" /> : <Text style={[styles.stepNumber, step >= 1 && styles.stepNumberActive]}>1</Text>}
        </View>
        <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
        <View style={[styles.stepCircle, step >= 2 && styles.stepCircleActive]}>
          {step > 2 ? <Ionicons name="checkmark" size={16} color="#fff" /> : <Text style={[styles.stepNumber, step >= 2 && styles.stepNumberActive]}>2</Text>}
        </View>
        <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />
        <View style={[styles.stepCircle, step >= 3 && styles.stepCircleActive]}>
          <Text style={[styles.stepNumber, step >= 3 && styles.stepNumberActive]}>3</Text>
        </View>
      </View>
      <View style={styles.stepLabels}>
        <Text style={[styles.stepLabel, step >= 1 && styles.stepLabelActive]}>Email</Text>
        <Text style={[styles.stepLabel, step >= 2 && styles.stepLabelActive]}>Verify</Text>
        <Text style={[styles.stepLabel, step >= 3 && styles.stepLabelActive]}>Details</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <Image source={require('../../assets/images/Logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.headerTitle}>Create Account</Text>
      </View>

      <ScrollView style={styles.formContainer} contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
        {renderStepIndicator()}

        {step === 1 && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Verify Your Email</Text>
              <Text style={styles.sectionDescription}>Enter the email address registered with your child&apos;s school</Text>
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={22} color="#6B7280" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="parent@email.com" placeholderTextColor="#9CA3AF" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>

            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={20} color="#4F46E5" />
              <Text style={styles.infoText}>Your email must match the parent email in your child&apos;s school records</Text>
            </View>

            <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleVerifyEmail} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <><Text style={styles.buttonText}>Send Verification Code</Text><Ionicons name="arrow-forward" size={20} color="#fff" /></>}
            </TouchableOpacity>
          </>
        )}

        {step === 2 && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Enter Verification Code</Text>
              <Text style={styles.sectionDescription}>We sent a 6-digit code to {email}</Text>
            </View>

            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => { otpInputs.current[index] = ref; }}
                  style={[styles.otpInput, digit && styles.otpInputFilled]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            <TouchableOpacity style={styles.resendButton} onPress={handleResendOtp} disabled={resendTimer > 0 || loading}>
              <Ionicons name="refresh" size={18} color={resendTimer > 0 ? '#9CA3AF' : '#4F46E5'} />
              <Text style={[styles.resendText, resendTimer > 0 && styles.resendTextDisabled]}>
                {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend code'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleVerifyOtp} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <><Text style={styles.buttonText}>Verify Code</Text><Ionicons name="checkmark" size={20} color="#fff" /></>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={() => { setStep(1); setOtp(['', '', '', '', '', '']); }}>
              <Ionicons name="arrow-back" size={18} color="#6B7280" />
              <Text style={styles.backButtonText}>Change email address</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 3 && (
          <>
            {linkedStudents.length > 0 && (
              <View style={styles.studentsCard}>
                <View style={styles.studentsHeader}>
                  <Ionicons name="people" size={20} color="#4F46E5" />
                  <Text style={styles.studentsTitle}>Linked Students</Text>
                </View>
                {linkedStudents.map((student, index) => (
                  <View key={index} style={styles.studentItem}>
                    <View style={styles.studentAvatar}>
                      <Text style={styles.studentInitial}>{student.studentName?.charAt(0) || 'S'}</Text>
                    </View>
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName}>{student.studentName}</Text>
                      <Text style={styles.studentEmail}>{student.studentEmail}</Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  </View>
                ))}
              </View>
            )}

            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={22} color="#6B7280" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#9CA3AF" value={name} onChangeText={setName} />
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={22} color="#6B7280" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Phone Number (optional)" placeholderTextColor="#9CA3AF" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={22} color="#6B7280" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#9CA3AF" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={22} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={22} color="#6B7280" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Confirm Password" placeholderTextColor="#9CA3AF" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showPassword} />
              </View>
            </View>

            <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSignup} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <><Text style={styles.buttonText}>Create Account</Text><Ionicons name="checkmark" size={20} color="#fff" /></>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={() => setStep(2)}>
              <Ionicons name="arrow-back" size={18} color="#6B7280" />
              <Text style={styles.backButtonText}>Back to verification</Text>
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
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#4F46E5', paddingTop: 50, paddingBottom: 30, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  logo: { width: 70, height: 70 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginTop: 12, letterSpacing: 1 },
  formContainer: { flex: 1 },
  formContent: { padding: 24, paddingBottom: 40 },
  stepIndicator: { marginBottom: 28 },
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  stepCircleActive: { backgroundColor: '#4F46E5' },
  stepNumber: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  stepNumberActive: { color: '#FFFFFF' },
  stepLine: { width: 50, height: 3, backgroundColor: '#E5E7EB', marginHorizontal: 6, borderRadius: 2 },
  stepLineActive: { backgroundColor: '#4F46E5' },
  stepLabels: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 10, marginTop: 8 },
  stepLabel: { fontSize: 12, color: '#9CA3AF' },
  stepLabelActive: { color: '#4F46E5', fontWeight: '600' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 22, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
  sectionDescription: { fontSize: 15, color: '#6B7280', lineHeight: 22 },
  inputGroup: { gap: 14, marginBottom: 20 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, paddingVertical: 16, fontSize: 16, color: '#1F2937' },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#EEF2FF', borderRadius: 12, padding: 14, marginBottom: 20, gap: 10 },
  infoText: { flex: 1, fontSize: 13, color: '#4338CA', lineHeight: 20 },
  otpContainer: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 24 },
  otpInput: { width: 48, height: 56, borderRadius: 12, borderWidth: 2, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', textAlign: 'center', fontSize: 24, fontWeight: '700', color: '#1F2937' },
  otpInputFilled: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  resendButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 20 },
  resendText: { fontSize: 15, color: '#4F46E5', fontWeight: '600' },
  resendTextDisabled: { color: '#9CA3AF' },
  button: { backgroundColor: '#4F46E5', borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
  backButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, gap: 6 },
  backButtonText: { color: '#6B7280', fontSize: 15 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  footerText: { color: '#6B7280', fontSize: 15 },
  linkText: { color: '#4F46E5', fontSize: 15, fontWeight: '700' },
  studentsCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  studentsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  studentsTitle: { fontSize: 15, fontWeight: '600', color: '#4F46E5' },
  studentItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  studentAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  studentInitial: { fontSize: 16, fontWeight: '600', color: '#4F46E5' },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  studentEmail: { fontSize: 13, color: '#6B7280', marginTop: 2 },
});
