/**
 * Terms & Conditions Screen Tests
 * 
 * Tests for the Terms & Conditions screen including:
 * - Component rendering
 * - Section expansion/collapse
 * - Navigation behavior
 * - Content display
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

// Import the component
import TermsConditionsScreen from '../../../app/(auth)/terms-conditions';

describe('TermsConditionsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the terms and conditions screen correctly', () => {
      const { getByText } = render(<TermsConditionsScreen />);

      // Check header elements
      expect(getByText('Terms & Conditions')).toBeTruthy();
      expect(getByText('Last updated: December 2024')).toBeTruthy();
    });

    it('should render the introduction card', () => {
      const { getByText } = render(<TermsConditionsScreen />);

      expect(getByText(/Please read these Terms and Conditions carefully/)).toBeTruthy();
    });

    it('should render the important notice card', () => {
      const { getByText } = render(<TermsConditionsScreen />);

      expect(getByText('Important Notice')).toBeTruthy();
      expect(getByText(/you confirm that you are at least 18 years old/)).toBeTruthy();
    });

    it('should render all section titles', () => {
      const { getByText } = render(<TermsConditionsScreen />);

      const sectionTitles = [
        '1. Acceptance of Terms',
        '2. Account Registration',
        '3. User Responsibilities',
        '4. Educational Services',
        '5. Intellectual Property',
        '6. Privacy and Data Protection',
        '7. Third-Party Services',
        '8. Disclaimers',
        '9. Limitation of Liability',
        '10. Indemnification',
        '11. Termination',
        '12. Governing Law',
        '13. Contact Information',
      ];

      sectionTitles.forEach((title) => {
        expect(getByText(title)).toBeTruthy();
      });
    });

    it('should render the footer with version info', () => {
      const { getByText } = render(<TermsConditionsScreen />);

      expect(getByText(/you acknowledge that you have read, understood, and agree/)).toBeTruthy();
      expect(getByText('Version 1.0 • Effective: December 2024')).toBeTruthy();
    });

    it('should render back button', () => {
      const { getByTestId } = render(<TermsConditionsScreen />);
      
      expect(getByTestId('icon-arrow-back')).toBeTruthy();
    });

    it('should render document-text icon in header', () => {
      const { getByTestId } = render(<TermsConditionsScreen />);
      
      expect(getByTestId('icon-document-text')).toBeTruthy();
    });

    it('should render alert-circle icon for important notice', () => {
      const { getByTestId } = render(<TermsConditionsScreen />);
      
      expect(getByTestId('icon-alert-circle')).toBeTruthy();
    });
  });

  describe('Section Expansion', () => {
    it('should have first section expanded by default', () => {
      const { getByText } = render(<TermsConditionsScreen />);

      // First section content should be visible
      expect(getByText(/If you do not agree to these Terms, please do not use the App/)).toBeTruthy();
    });

    it('should expand a section when clicked', async () => {
      const { getByText } = render(<TermsConditionsScreen />);

      // Click on section 2 to expand
      fireEvent.press(getByText('2. Account Registration'));

      await waitFor(() => {
        expect(getByText(/Provide accurate, current, and complete information/)).toBeTruthy();
      });
    });

    it('should collapse current section when another section is clicked', async () => {
      const { getByText, queryByText } = render(<TermsConditionsScreen />);

      // Initially section 1 content is visible
      expect(getByText(/If you do not agree to these Terms/)).toBeTruthy();

      // Click on section 3 to expand it
      fireEvent.press(getByText('3. User Responsibilities'));

      await waitFor(() => {
        // Section 3 content should be visible
        expect(getByText(/Use the App only for lawful purposes/)).toBeTruthy();
        // Section 1 content should be hidden
        expect(queryByText(/If you do not agree to these Terms/)).toBeNull();
      });
    });

    it('should collapse section when clicking on it again', async () => {
      const { getByText, queryByText } = render(<TermsConditionsScreen />);

      // Click on first section to collapse it
      fireEvent.press(getByText('1. Acceptance of Terms'));

      await waitFor(() => {
        // Section 1 content should be hidden
        expect(queryByText(/If you do not agree to these Terms/)).toBeNull();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate back when back button is pressed', () => {
      const { getByTestId } = render(<TermsConditionsScreen />);

      const backButton = getByTestId('icon-arrow-back').parent.parent;
      fireEvent.press(backButton);

      expect(router.back).toHaveBeenCalled();
    });
  });

  describe('Content Sections', () => {
    it('should display account registration section content when expanded', async () => {
      const { getByText } = render(<TermsConditionsScreen />);

      fireEvent.press(getByText('2. Account Registration'));

      await waitFor(() => {
        expect(getByText(/Provide accurate, current, and complete information/)).toBeTruthy();
        expect(getByText(/Maintain the security of your password/)).toBeTruthy();
      });
    });

    it('should display intellectual property section content when expanded', async () => {
      const { getByText } = render(<TermsConditionsScreen />);

      fireEvent.press(getByText('5. Intellectual Property'));

      await waitFor(() => {
        expect(getByText(/Text, graphics, logos, icons, and images/)).toBeTruthy();
        expect(getByText(/You are granted a limited, non-exclusive/)).toBeTruthy();
      });
    });

    it('should display disclaimers section content when expanded', async () => {
      const { getByText } = render(<TermsConditionsScreen />);

      fireEvent.press(getByText('8. Disclaimers'));

      await waitFor(() => {
        expect(getByText(/THE APP IS PROVIDED "AS IS"/)).toBeTruthy();
        expect(getByText(/IMPLIED WARRANTIES OF MERCHANTABILITY/)).toBeTruthy();
      });
    });

    it('should display contact information when contact section is expanded', async () => {
      const { getByText } = render(<TermsConditionsScreen />);

      fireEvent.press(getByText('13. Contact Information'));

      await waitFor(() => {
        expect(getByText(/Email: legal@druedu.com/)).toBeTruthy();
        expect(getByText(/Phone: \+1 \(555\) 123-4567/)).toBeTruthy();
        expect(getByText(/We aim to respond to all inquiries within 5 business days/)).toBeTruthy();
      });
    });

    it('should display educational services content when expanded', async () => {
      const { getByText } = render(<TermsConditionsScreen />);

      fireEvent.press(getByText('4. Educational Services'));

      await waitFor(() => {
        expect(getByText(/We facilitate communication between you and educational institutions/)).toBeTruthy();
        expect(getByText(/The App is a supplementary tool/)).toBeTruthy();
      });
    });

    it('should display limitation of liability content when expanded', async () => {
      const { getByText } = render(<TermsConditionsScreen />);

      fireEvent.press(getByText('9. Limitation of Liability'));

      await waitFor(() => {
        expect(getByText(/TO THE MAXIMUM EXTENT PERMITTED BY LAW/)).toBeTruthy();
        expect(getByText(/Any indirect, incidental, special, consequential/)).toBeTruthy();
      });
    });

    it('should display termination content when expanded', async () => {
      const { getByText } = render(<TermsConditionsScreen />);

      fireEvent.press(getByText('11. Termination'));

      await waitFor(() => {
        expect(getByText(/We may terminate or suspend your account/)).toBeTruthy();
        expect(getByText(/Your right to use the App will immediately cease/)).toBeTruthy();
      });
    });
  });

  describe('Section Icons', () => {
    it('should render section icons for each item', () => {
      const { getByTestId } = render(<TermsConditionsScreen />);

      // Check for specific section icons
      expect(getByTestId('icon-checkmark-circle-outline')).toBeTruthy();
      expect(getByTestId('icon-person-add-outline')).toBeTruthy();
      expect(getByTestId('icon-list-outline')).toBeTruthy();
      expect(getByTestId('icon-school-outline')).toBeTruthy();
      expect(getByTestId('icon-bulb-outline')).toBeTruthy();
      expect(getByTestId('icon-shield-outline')).toBeTruthy();
      expect(getByTestId('icon-link-outline')).toBeTruthy();
      expect(getByTestId('icon-warning-outline')).toBeTruthy();
    });
  });

  describe('Important Notice Card', () => {
    it('should display age requirement notice', () => {
      const { getByText } = render(<TermsConditionsScreen />);

      const noticeText = getByText(/you confirm that you are at least 18 years old/);
      expect(noticeText).toBeTruthy();
    });

    it('should display parent/guardian consent option', () => {
      const { getByText } = render(<TermsConditionsScreen />);

      expect(getByText(/have the consent of a parent or legal guardian/)).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have touchable sections for accessibility', () => {
      const { getByText } = render(<TermsConditionsScreen />);

      const section = getByText('1. Acceptance of Terms').parent.parent;
      expect(section.props.accessible || section.props.onPress).toBeTruthy();
    });

    it('should have back button accessible', () => {
      const { getByTestId } = render(<TermsConditionsScreen />);
      
      const backButton = getByTestId('icon-arrow-back').parent.parent;
      expect(backButton.props.onPress).toBeTruthy();
    });
  });
});
