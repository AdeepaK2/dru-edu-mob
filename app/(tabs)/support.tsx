import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'How do I link my child to my account?',
    answer: 'Your child will be linked to your account by the school administrator. Once linked, you will see them in the "My Students" section of your profile.',
  },
  {
    question: 'How do I view my child\'s test results?',
    answer: 'Go to the Home tab and select your child from the student selector at the top. You can then view their test results, progress, and analytics.',
  },
  {
    question: 'How does the subscription work?',
    answer: 'DRU Education offers a yearly subscription at $14.99 per student. This gives you access to detailed analytics, test results, and progress tracking for your linked students.',
  },
  {
    question: 'Can I have multiple children on one account?',
    answer: 'Yes! Your account can have multiple students linked to it. Use the student selector at the top of the Home screen to switch between children.',
  },
  {
    question: 'How do I update my profile information?',
    answer: 'Go to Profile > Edit Profile to update your name and phone number. You can also tap on your profile picture to change it.',
  },
  {
    question: 'I forgot my password. How do I reset it?',
    answer: 'On the login screen, tap "Forgot Password?" and enter your email address. You will receive a password reset link via email.',
  },
  {
    question: 'How do I contact my child\'s teacher?',
    answer: 'The messaging feature is coming soon. In the meantime, please contact the school directly for any communication with teachers.',
  },
  {
    question: 'Why am I not seeing my child\'s data?',
    answer: 'Make sure you have an active subscription and that your child has been linked to your account by the school. If issues persist, contact support.',
  },
];

export default function SupportScreen() {
  const router = useRouter();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleEmail = () => {
    Linking.openURL('mailto:support@drueducation.com?subject=Help Request - DRU Education App').catch(() => {
      Alert.alert('Error', 'Could not open email client');
    });
  };

  const handlePhone = () => {
    Linking.openURL('tel:+61xxxxxxxxx').catch(() => {
      Alert.alert('Error', 'Could not open phone app');
    });
  };

  const handleWebsite = () => {
    Linking.openURL('https://www.drueducation.com').catch(() => {
      Alert.alert('Error', 'Could not open website');
    });
  };

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <View style={styles.contactCard}>
            <TouchableOpacity style={styles.contactItem} onPress={handleEmail}>
              <View style={[styles.contactIcon, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="mail" size={24} color="#6366F1" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Email Support</Text>
                <Text style={styles.contactValue}>support@drueducation.com</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <View style={styles.contactDivider} />

            <TouchableOpacity style={styles.contactItem} onPress={handleWebsite}>
              <View style={[styles.contactIcon, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="globe" size={24} color="#22C55E" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Visit Website</Text>
                <Text style={styles.contactValue}>www.drueducation.com</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Help Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Help</Text>
          <View style={styles.quickHelpGrid}>
            <TouchableOpacity 
              style={styles.quickHelpItem}
              onPress={() => Linking.openURL('https://www.drueducation.com/privacy')}
            >
              <View style={[styles.quickHelpIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="shield-checkmark" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.quickHelpLabel}>Privacy Policy</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickHelpItem}
              onPress={() => Linking.openURL('https://www.drueducation.com/terms')}
            >
              <View style={[styles.quickHelpIcon, { backgroundColor: '#FCE7F3' }]}>
                <Ionicons name="document-text" size={24} color="#EC4899" />
              </View>
              <Text style={styles.quickHelpLabel}>Terms of Service</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickHelpItem}
              onPress={handleEmail}
            >
              <View style={[styles.quickHelpIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="bug" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.quickHelpLabel}>Report a Bug</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickHelpItem}
              onPress={handleEmail}
            >
              <View style={[styles.quickHelpIcon, { backgroundColor: '#E0E7FF' }]}>
                <Ionicons name="bulb" size={24} color="#6366F1" />
              </View>
              <Text style={styles.quickHelpLabel}>Send Feedback</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <View style={styles.faqCard}>
            {faqs.map((faq, index) => (
              <View key={index}>
                <TouchableOpacity
                  style={styles.faqItem}
                  onPress={() => toggleFaq(index)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <Ionicons
                    name={expandedFaq === index ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#6366F1"
                  />
                </TouchableOpacity>
                {expandedFaq === index && (
                  <View style={styles.faqAnswer}>
                    <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                  </View>
                )}
                {index < faqs.length - 1 && <View style={styles.faqDivider} />}
              </View>
            ))}
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfoSection}>
          <Text style={styles.appName}>DRU Education</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appCopyright}>© 2025 DRU Education. All rights reserved.</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  // Contact Card
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
    marginLeft: 14,
  },
  contactLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  contactValue: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  contactDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginLeft: 78,
  },
  // Quick Help Grid
  quickHelpGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickHelpItem: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickHelpIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickHelpLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  // FAQ
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    paddingRight: 12,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 0,
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
  },
  faqDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  // App Info
  appInfoSection: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 16,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366F1',
  },
  appVersion: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  appCopyright: {
    fontSize: 12,
    color: '#D1D5DB',
    marginTop: 8,
  },
});
