import { router } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

export default function VerifyEmailScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="mail-open" size={48} color="#4F46E5" />
          </View>
        </View>
        
        <Text style={styles.title}>Check Your Email</Text>
        <Text style={styles.description}>
          We&apos;ve sent a verification link to your email address. Please check your inbox and click the link to verify your account.
        </Text>

        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Didn&apos;t receive the email?</Text>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            <Text style={styles.tipText}>Check your spam folder</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            <Text style={styles.tipText}>Make sure your email is correct</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            <Text style={styles.tipText}>Wait a few minutes and try again</Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace('/(auth)/login')}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
          <Text style={styles.buttonText}>Back to Login</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resendButton}>
          <Text style={styles.resendText}>Resend Verification Email</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Image source={require('../../assets/images/Logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.footerText}>Dr U Education Parent Portal</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    paddingBottom: 100,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
    paddingHorizontal: 10,
  },
  tipsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 14,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  tipText: {
    fontSize: 14,
    color: '#6B7280',
  },
  button: {
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 20,
    padding: 12,
  },
  resendText: {
    color: '#4F46E5',
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 50,
    height: 50,
  },
  footerText: {
    color: '#9CA3AF',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
