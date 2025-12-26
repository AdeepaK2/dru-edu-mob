/**
 * Privacy Policy Screen Tests
 * 
 * Tests for the Privacy Policy screen including:
 * - Component rendering
 * - Section expansion/collapse
 * - Navigation behavior
 * - Content display
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

// Import the component
import PrivacyPolicyScreen from '../../../app/(auth)/privacy-policy';

describe('PrivacyPolicyScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the privacy policy screen correctly', () => {
      const { getByText } = render(<PrivacyPolicyScreen />);

      // Check header elements
      expect(getByText('Privacy Policy')).toBeTruthy();
      expect(getByText('Last updated: December 2024')).toBeTruthy();
    });

    it('should render the introduction card', () => {
      const { getByText } = render(<PrivacyPolicyScreen />);

      expect(getByText(/Dr U Education.*is committed to protecting your privacy/)).toBeTruthy();
    });

    it('should render all section titles', () => {
      const { getByText } = render(<PrivacyPolicyScreen />);

      const sectionTitles = [
        '1. Information We Collect',
        '2. How We Use Your Information',
        '3. Information Sharing',
        '4. Data Security',
        '5. Data Retention',
        '6. Your Rights',
        "7. Children's Privacy",
        '8. Updates to This Policy',
        '9. Contact Us',
      ];

      sectionTitles.forEach((title) => {
        expect(getByText(title)).toBeTruthy();
      });
    });

    it('should render the footer with COPPA compliance badge', () => {
      const { getByText } = render(<PrivacyPolicyScreen />);

      expect(getByText(/By using the Dr U Education app/)).toBeTruthy();
      expect(getByText('COPPA Compliant')).toBeTruthy();
    });

    it('should render back button', () => {
      const { getByTestId } = render(<PrivacyPolicyScreen />);
      
      expect(getByTestId('icon-arrow-back')).toBeTruthy();
    });

    it('should render shield icon in header', () => {
      const { getByTestId } = render(<PrivacyPolicyScreen />);
      
      expect(getByTestId('icon-shield-checkmark')).toBeTruthy();
    });
  });

  describe('Section Expansion', () => {
    it('should have first section expanded by default', () => {
      const { getByText } = render(<PrivacyPolicyScreen />);

      // First section content should be visible
      expect(getByText(/Personal Information: Name, email address/)).toBeTruthy();
    });

    it('should expand a section when clicked', async () => {
      const { getByText, queryByText } = render(<PrivacyPolicyScreen />);

      // Click on section 2 to expand
      fireEvent.press(getByText('2. How We Use Your Information'));

      await waitFor(() => {
        expect(getByText(/Provide, maintain, and improve our services/)).toBeTruthy();
      });
    });

    it('should collapse current section when another section is clicked', async () => {
      const { getByText, queryByText } = render(<PrivacyPolicyScreen />);

      // Initially section 1 content is visible
      expect(getByText(/Personal Information: Name, email address/)).toBeTruthy();

      // Click on section 3 to expand it
      fireEvent.press(getByText('3. Information Sharing'));

      await waitFor(() => {
        // Section 3 content should be visible
        expect(getByText(/With Educational Institutions/)).toBeTruthy();
        // Section 1 content should be hidden
        expect(queryByText(/Personal Information: Name, email address/)).toBeNull();
      });
    });

    it('should collapse section when clicking on it again', async () => {
      const { getByText, queryByText } = render(<PrivacyPolicyScreen />);

      // Click on first section to collapse it
      fireEvent.press(getByText('1. Information We Collect'));

      await waitFor(() => {
        // Section 1 content should be hidden
        expect(queryByText(/Personal Information: Name, email address/)).toBeNull();
      });
    });

    it('should show chevron-up icon for expanded section', () => {
      const { getAllByTestId } = render(<PrivacyPolicyScreen />);

      // First section should have chevron-up (expanded)
      const chevronUpIcons = getAllByTestId('icon-chevron-up');
      expect(chevronUpIcons.length).toBeGreaterThanOrEqual(1);
    });

    it('should show chevron-down icon for collapsed sections', () => {
      const { getAllByTestId } = render(<PrivacyPolicyScreen />);

      // Other sections should have chevron-down (collapsed)
      const chevronDownIcons = getAllByTestId('icon-chevron-down');
      expect(chevronDownIcons.length).toBeGreaterThanOrEqual(8); // 8 collapsed sections
    });
  });

  describe('Navigation', () => {
    it('should navigate back when back button is pressed', () => {
      const { getByTestId } = render(<PrivacyPolicyScreen />);

      const backButton = getByTestId('icon-arrow-back').parent.parent;
      fireEvent.press(backButton);

      expect(router.back).toHaveBeenCalled();
    });
  });

  describe('Content Sections', () => {
    it('should display data security section content when expanded', async () => {
      const { getByText } = render(<PrivacyPolicyScreen />);

      fireEvent.press(getByText('4. Data Security'));

      await waitFor(() => {
        expect(getByText(/Encryption of data in transit and at rest/)).toBeTruthy();
        expect(getByText(/Regular security assessments and audits/)).toBeTruthy();
      });
    });

    it('should display your rights section content when expanded', async () => {
      const { getByText } = render(<PrivacyPolicyScreen />);

      fireEvent.press(getByText('6. Your Rights'));

      await waitFor(() => {
        expect(getByText(/Access: You can request a copy/)).toBeTruthy();
        expect(getByText(/Deletion: You can request that we delete/)).toBeTruthy();
      });
    });

    it('should display contact information when contact section is expanded', async () => {
      const { getByText } = render(<PrivacyPolicyScreen />);

      fireEvent.press(getByText('9. Contact Us'));

      await waitFor(() => {
        expect(getByText(/Email: privacy@druedu.com/)).toBeTruthy();
        expect(getByText(/Phone: \+1 \(555\) 123-4567/)).toBeTruthy();
      });
    });

    it('should display children privacy content when expanded', async () => {
      const { getByText } = render(<PrivacyPolicyScreen />);

      fireEvent.press(getByText("7. Children's Privacy"));

      await waitFor(() => {
        expect(getByText(/COPPA.*Children's Online Privacy Protection Act/)).toBeTruthy();
      });
    });
  });

  describe('Section Icons', () => {
    it('should render section icons for each item', () => {
      const { getByTestId } = render(<PrivacyPolicyScreen />);

      // Check for specific section icons
      expect(getByTestId('icon-document-text-outline')).toBeTruthy();
      expect(getByTestId('icon-analytics-outline')).toBeTruthy();
      expect(getByTestId('icon-share-social-outline')).toBeTruthy();
      expect(getByTestId('icon-shield-checkmark-outline')).toBeTruthy();
      expect(getByTestId('icon-time-outline')).toBeTruthy();
      expect(getByTestId('icon-person-circle-outline')).toBeTruthy();
      expect(getByTestId('icon-people-outline')).toBeTruthy();
      expect(getByTestId('icon-refresh-outline')).toBeTruthy();
      expect(getByTestId('icon-mail-outline')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have touchable sections for accessibility', () => {
      const { getByText } = render(<PrivacyPolicyScreen />);

      const section = getByText('1. Information We Collect').parent.parent;
      expect(section.props.accessible || section.props.onPress).toBeTruthy();
    });

    it('should have back button accessible', () => {
      const { getByTestId } = render(<PrivacyPolicyScreen />);
      
      const backButton = getByTestId('icon-arrow-back').parent.parent;
      expect(backButton.props.onPress).toBeTruthy();
    });
  });
});
