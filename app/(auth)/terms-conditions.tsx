import { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const TERMS_SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    icon: 'checkmark-circle-outline',
    content: `By downloading, installing, or using the Dr U Education mobile application ("App"), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, please do not use the App.

These Terms constitute a legally binding agreement between you and Dr U Education ("we", "us", or "our"). We reserve the right to modify these Terms at any time, and such modifications shall be effective immediately upon posting.

Your continued use of the App following the posting of modified Terms constitutes your acceptance of such changes.`,
  },
  {
    title: '2. Account Registration',
    icon: 'person-add-outline',
    content: `To use certain features of the App, you must create an account. When registering, you agree to:

• Provide accurate, current, and complete information during the registration process.

• Maintain and promptly update your account information to keep it accurate and complete.

• Maintain the security of your password and accept all risks of unauthorized access to your account.

• Notify us immediately if you discover or suspect any security breaches related to your account.

• Be responsible for all activities that occur under your account.

We reserve the right to suspend or terminate your account if any information provided proves to be inaccurate, false, or incomplete.`,
  },
  {
    title: '3. User Responsibilities',
    icon: 'list-outline',
    content: `As a user of the App, you agree to:

• Use the App only for lawful purposes and in accordance with these Terms.

• Not use the App to harm, threaten, or harass any person.

• Not access or attempt to access accounts or data that you are not authorized to access.

• Not interfere with or disrupt the App or servers or networks connected to the App.

• Not attempt to reverse engineer, decompile, or disassemble any portion of the App.

• Not use automated systems, bots, or scripts to access the App.

• Comply with all applicable local, state, national, and international laws and regulations.`,
  },
  {
    title: '4. Educational Services',
    icon: 'school-outline',
    content: `The App provides educational tracking and communication services connecting parents/guardians with educational institutions. You understand and agree that:

• We facilitate communication between you and educational institutions but do not guarantee the accuracy of academic information.

• Educational institutions are responsible for the accuracy of grades, attendance, and other academic records.

• We are not responsible for any decisions made by educational institutions.

• The App is a supplementary tool and should not be the sole source of information about your child's education.

• Feature availability may vary based on your associated educational institution's subscription level.`,
  },
  {
    title: '5. Intellectual Property',
    icon: 'bulb-outline',
    content: `All content, features, and functionality of the App, including but not limited to:

• Text, graphics, logos, icons, and images
• Software, code, and underlying technology
• User interface design and layout
• Audio, video, and multimedia content

Are owned by Dr U Education or its licensors and are protected by copyright, trademark, and other intellectual property laws.

You are granted a limited, non-exclusive, non-transferable license to use the App for personal, non-commercial purposes only. You may not reproduce, distribute, modify, or create derivative works from any content without our express written permission.`,
  },
  {
    title: '6. Privacy and Data Protection',
    icon: 'shield-outline',
    content: `Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference.

By using the App, you consent to:

• The collection and processing of your personal data as described in our Privacy Policy.

• Receiving communications from us regarding your account and services.

• The storage and processing of your data in servers that may be located outside your country of residence.

We implement appropriate technical and organizational measures to protect your personal information in accordance with applicable data protection laws.`,
  },
  {
    title: '7. Third-Party Services',
    icon: 'link-outline',
    content: `The App may contain links to or integrate with third-party websites, services, or applications. We are not responsible for:

• The content, accuracy, or practices of third-party services.

• Any damages or losses arising from your use of third-party services.

• The privacy practices of third-party services.

Your interactions with third-party services are governed by their respective terms and privacy policies. We encourage you to review such terms before engaging with third-party services.`,
  },
  {
    title: '8. Disclaimers',
    icon: 'warning-outline',
    content: `THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:

• IMPLIED WARRANTIES OF MERCHANTABILITY
• FITNESS FOR A PARTICULAR PURPOSE
• NON-INFRINGEMENT
• ACCURACY OF INFORMATION

We do not warrant that:

• The App will be uninterrupted or error-free.
• Defects will be corrected.
• The App or servers are free of viruses or harmful components.
• The results from using the App will meet your requirements.`,
  },
  {
    title: '9. Limitation of Liability',
    icon: 'alert-circle-outline',
    content: `TO THE MAXIMUM EXTENT PERMITTED BY LAW, DR U EDUCATION SHALL NOT BE LIABLE FOR:

• Any indirect, incidental, special, consequential, or punitive damages.

• Any loss of profits, revenue, data, or goodwill.

• Any damages arising from your use of or inability to use the App.

• Any damages arising from unauthorized access to or alteration of your data.

Our total liability for any claims arising from your use of the App shall not exceed the amount you paid to us, if any, in the twelve (12) months preceding the claim.`,
  },
  {
    title: '10. Indemnification',
    icon: 'umbrella-outline',
    content: `You agree to indemnify, defend, and hold harmless Dr U Education and its officers, directors, employees, agents, and affiliates from and against any and all claims, damages, obligations, losses, liabilities, costs, and expenses arising from:

• Your use of the App.

• Your violation of these Terms.

• Your violation of any rights of a third party.

• Any content you submit or transmit through the App.

This indemnification obligation shall survive the termination of these Terms and your use of the App.`,
  },
  {
    title: '11. Termination',
    icon: 'close-circle-outline',
    content: `We may terminate or suspend your account and access to the App immediately, without prior notice or liability, for any reason, including:

• Breach of these Terms.
• Request by law enforcement or government agencies.
• Discontinuance or material modification of the App.
• Unexpected technical or security issues.

Upon termination:

• Your right to use the App will immediately cease.
• We may delete your account and associated data.
• Provisions that by their nature should survive will remain in effect.`,
  },
  {
    title: '12. Governing Law',
    icon: 'globe-outline',
    content: `These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Dr U Education is incorporated, without regard to conflict of law principles.

Any disputes arising from these Terms or your use of the App shall be resolved through:

1. Good faith negotiation between the parties.

2. Mediation by a mutually agreed upon mediator.

3. Binding arbitration in accordance with applicable arbitration rules.

4. Litigation in the courts of competent jurisdiction as a last resort.

You agree to submit to the personal jurisdiction of the courts located within the governing jurisdiction for resolution of any disputes.`,
  },
  {
    title: '13. Contact Information',
    icon: 'mail-outline',
    content: `If you have any questions about these Terms and Conditions, please contact us at:

Email: legal@druedu.com

Address: Dr U Education Services
Legal Department
123 Education Lane
Learning City, ED 12345

Phone: +1 (555) 123-4567

Business Hours: Monday - Friday, 9:00 AM - 5:00 PM (EST)

We aim to respond to all inquiries within 5 business days.`,
  },
];

export default function TermsConditionsScreen() {
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
          <Ionicons name="document-text" size={32} color="#fff" />
          <Text style={styles.headerTitle}>Terms & Conditions</Text>
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
          <Ionicons name="information-circle" size={24} color="#7C3AED" />
          <Text style={styles.introText}>
            Please read these Terms and Conditions carefully before using the 
            Dr U Education mobile application. These Terms govern your access 
            to and use of our services.
          </Text>
        </View>

        {/* Important Notice */}
        <View style={styles.noticeCard}>
          <Ionicons name="alert-circle" size={24} color="#DC2626" />
          <View style={styles.noticeContent}>
            <Text style={styles.noticeTitle}>Important Notice</Text>
            <Text style={styles.noticeText}>
              By creating an account, you confirm that you are at least 18 years old 
              or have the consent of a parent or legal guardian to use this App.
            </Text>
          </View>
        </View>

        {/* Sections */}
        {TERMS_SECTIONS.map((section, index) => (
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
                  color="#7C3AED" 
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
            By creating an account and using the Dr U Education app, you acknowledge 
            that you have read, understood, and agree to be bound by these Terms and Conditions.
          </Text>
          <View style={styles.footerVersion}>
            <Text style={styles.footerVersionText}>Version 1.0 • Effective: December 2024</Text>
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
    backgroundColor: '#7C3AED',
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
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  introText: {
    flex: 1,
    fontSize: 14,
    color: '#5B21B6',
    lineHeight: 22,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 13,
    color: '#7F1D1D',
    lineHeight: 20,
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
    backgroundColor: '#F5F3FF',
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
  footerVersion: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  footerVersionText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
});
