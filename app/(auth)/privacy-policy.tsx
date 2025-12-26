import { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const PRIVACY_SECTIONS = [
  {
    title: '1. Information We Collect',
    icon: 'document-text-outline',
    content: `We collect information you provide directly to us, including:

• Personal Information: Name, email address, phone number, and other contact details when you create an account.

• Student Information: Information about students linked to your account, including their names, grades, and academic records.

• Device Information: Information about the device you use to access our app, including device type, operating system, and unique device identifiers.

• Usage Data: Information about how you use our app, including access times, pages viewed, and features used.

• Communications: Records of your communications with us, including support requests and feedback.`,
  },
  {
    title: '2. How We Use Your Information',
    icon: 'analytics-outline',
    content: `We use the information we collect to:

• Provide, maintain, and improve our services.

• Process transactions and send related information.

• Send you technical notices, updates, security alerts, and administrative messages.

• Respond to your comments, questions, and requests.

• Monitor and analyze trends, usage, and activities in connection with our services.

• Personalize and improve your experience.

• Facilitate communication between parents, students, and educational institutions.`,
  },
  {
    title: '3. Information Sharing',
    icon: 'share-social-outline',
    content: `We may share your information in the following circumstances:

• With Educational Institutions: We share relevant information with schools and educators associated with your students to facilitate educational services.

• With Service Providers: We may share information with third-party vendors who provide services on our behalf.

• For Legal Purposes: We may disclose information if required by law or if we believe disclosure is necessary to protect our rights or the safety of others.

• With Your Consent: We may share information with third parties when you give us explicit consent to do so.

We do NOT sell your personal information to third parties.`,
  },
  {
    title: '4. Data Security',
    icon: 'shield-checkmark-outline',
    content: `We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:

• Encryption of data in transit and at rest.

• Regular security assessments and audits.

• Access controls limiting who can view personal information.

• Secure authentication mechanisms.

However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.`,
  },
  {
    title: '5. Data Retention',
    icon: 'time-outline',
    content: `We retain your personal information for as long as necessary to fulfill the purposes for which it was collected, including:

• As long as your account is active.

• As required by law or regulations.

• As necessary for our legitimate business purposes.

• To resolve disputes and enforce our agreements.

You may request deletion of your data at any time by contacting us.`,
  },
  {
    title: '6. Your Rights',
    icon: 'person-circle-outline',
    content: `You have the following rights regarding your personal information:

• Access: You can request a copy of the personal information we hold about you.

• Correction: You can request that we correct inaccurate or incomplete information.

• Deletion: You can request that we delete your personal information.

• Portability: You can request a copy of your data in a portable format.

• Withdrawal of Consent: You can withdraw your consent at any time where we rely on consent as the legal basis for processing.

To exercise these rights, please contact us using the information provided below.`,
  },
  {
    title: '7. Children\'s Privacy',
    icon: 'people-outline',
    content: `Our app is designed to be used by parents and guardians to monitor their children's educational progress. We take children's privacy seriously and comply with applicable laws, including COPPA (Children's Online Privacy Protection Act).

We do not knowingly collect personal information from children under 13 without parental consent. If we learn that we have collected personal information from a child under 13 without verification of parental consent, we will take steps to delete that information promptly.`,
  },
  {
    title: '8. Updates to This Policy',
    icon: 'refresh-outline',
    content: `We may update this Privacy Policy from time to time. If we make material changes, we will notify you by:

• Posting the updated policy in the app.

• Sending you an email notification.

• Displaying a notice in the app.

We encourage you to review this Privacy Policy periodically to stay informed about how we are protecting your information.`,
  },
  {
    title: '9. Contact Us',
    icon: 'mail-outline',
    content: `If you have any questions about this Privacy Policy or our practices, please contact us at:

Email: privacy@druedu.com

Address: Dr U Education Services
123 Education Lane
Learning City, ED 12345

Phone: +1 (555) 123-4567

We will respond to your inquiry within 30 days.`,
  },
];

export default function PrivacyPolicyScreen() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const scrollRef = useRef<ScrollView>(null);

  const toggleSection = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Ionicons name="shield-checkmark" size={32} color="#fff" />
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <Text style={styles.headerSubtitle}>Last updated: December 2024</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        ref={scrollRef}
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Introduction */}
        <View style={styles.introCard}>
          <Ionicons name="information-circle" size={24} color="#4F46E5" />
          <Text style={styles.introText}>
            Dr U Education ("we", "our", or "us") is committed to protecting your privacy. 
            This Privacy Policy explains how we collect, use, and safeguard your information 
            when you use our mobile application.
          </Text>
        </View>

        {/* Sections */}
        {PRIVACY_SECTIONS.map((section, index) => (
          <TouchableOpacity
            key={index}
            style={styles.sectionCard}
            onPress={() => toggleSection(index)}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons 
                  name={section.icon as any} 
                  size={22} 
                  color="#4F46E5" 
                />
              </View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Ionicons 
                name={expandedIndex === index ? "chevron-up" : "chevron-down"} 
                size={22} 
                color="#6B7280" 
              />
            </View>
            {expandedIndex === index && (
              <View style={styles.sectionContent}>
                <Text style={styles.sectionText}>{section.content}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By using the Dr U Education app, you acknowledge that you have read 
            and understood this Privacy Policy.
          </Text>
          <View style={styles.footerBadge}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.footerBadgeText}>COPPA Compliant</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#4F46E5',
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  introCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  introText: {
    flex: 1,
    fontSize: 14,
    color: '#4338CA',
    lineHeight: 22,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 0,
  },
  sectionText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  footer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  footerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  footerBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
  },
});
