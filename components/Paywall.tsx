import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { SUBSCRIPTION_ENDPOINTS } from '../src/config/api';

const PRICE_PER_STUDENT = 14.99;

export default function Paywall() {
  const router = useRouter();
  const { user, authToken, logout, refreshSubscription } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Use linkedStudents instead of students
  const studentCount = user?.linkedStudents?.length || 1;
  const totalPrice = studentCount * PRICE_PER_STUDENT;

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const handleSubscribe = async (isDev: boolean = false) => {
    setLoading(true);
    try {
      const endpoint = isDev ? SUBSCRIPTION_ENDPOINTS.devSubscribe : SUBSCRIPTION_ENDPOINTS.subscribe;
      const body = isDev 
        ? { studentCount, activate: true }
        : { studentCount, platform: 'android', transactionId: `txn_${Date.now()}` };

      console.log('🔄 Subscribing...', { endpoint, body });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      console.log('📦 Subscription response:', data);

      if (data.success) {
        // Refresh subscription status immediately
        await refreshSubscription();
        Alert.alert('🎉 Subscription Activated!', 'Thank you for subscribing. You now have full access to the app.');
      } else {
        Alert.alert('Error', data.message || 'Failed to activate subscription');
      }
    } catch (error) {
      console.error('❌ Subscription error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: 'school-outline', text: 'Access all student information' },
    { icon: 'stats-chart-outline', text: 'Real-time grade updates' },
    { icon: 'calendar-outline', text: 'Attendance tracking' },
    { icon: 'chatbubbles-outline', text: 'Message teachers directly' },
    { icon: 'document-text-outline', text: 'Progress reports' },
    { icon: 'notifications-outline', text: 'Event notifications' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoPlaceholder}>
            <Ionicons name="school" size={40} color="#4F46E5" />
          </View>
          <Text style={styles.title}>Unlock Full Access</Text>
          <Text style={styles.subtitle}>Subscribe to track your children&apos;s progress</Text>
        </View>

          {/* Pricing Card */}
          <View style={styles.pricingCard}>
            <View style={styles.pricingHeader}>
              <Ionicons name="star" size={24} color="#F59E0B" />
              <Text style={styles.pricingTitle}>Yearly Subscription</Text>
            </View>
            
            <View style={styles.priceBreakdown}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>{studentCount} Student{studentCount > 1 ? 's' : ''}</Text>
                <Text style={styles.priceCalc}>${PRICE_PER_STUDENT}/student</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total per year</Text>
                <Text style={styles.totalPrice}>${totalPrice.toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.badge}>
              <Ionicons name="shield-checkmark" size={16} color="#10B981" />
              <Text style={styles.badgeText}>365 days of full access</Text>
            </View>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>What you get</Text>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Ionicons name={feature.icon as any} size={20} color="#4F46E5" />
                </View>
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            ))}
          </View>

          {/* Subscribe Button */}
          <TouchableOpacity
            style={[styles.subscribeButton, loading && styles.buttonDisabled]}
            onPress={() => handleSubscribe(false)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="card-outline" size={22} color="#fff" />
                <Text style={styles.subscribeButtonText}>Subscribe Now - ${totalPrice.toFixed(2)}/year</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Dev Subscribe (for testing) */}
          {__DEV__ && (
            <TouchableOpacity
              style={styles.devButton}
              onPress={() => handleSubscribe(true)}
              disabled={loading}
            >
              <Ionicons name="code-slash" size={18} color="#6B7280" />
              <Text style={styles.devButtonText}>Dev: Activate Free (Testing Only)</Text>
            </TouchableOpacity>
          )}

          {/* Logout */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color="#EF4444" />
            <Text style={styles.logoutText}>Sign out</Text>
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Subscription automatically renews yearly.{'\n'}
              Cancel anytime from your account settings.
            </Text>
            <View style={styles.footerLinks}>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Terms of Service</Text>
              </TouchableOpacity>
              <Text style={styles.footerDot}>•</Text>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  pricingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  pricingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  pricingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  priceBreakdown: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 16,
    color: '#4B5563',
  },
  priceCalc: {
    fontSize: 16,
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalPrice: {
    fontSize: 28,
    fontWeight: '800',
    color: '#4F46E5',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  featuresContainer: {
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureText: {
    fontSize: 15,
    color: '#4B5563',
    flex: 1,
  },
  subscribeButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  devButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  devButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginBottom: 24,
  },
  logoutText: {
    fontSize: 15,
    color: '#EF4444',
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerLink: {
    fontSize: 12,
    color: '#4F46E5',
  },
  footerDot: {
    color: '#9CA3AF',
  },
});
