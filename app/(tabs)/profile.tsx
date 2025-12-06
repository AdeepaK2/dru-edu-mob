import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Switch,
  Linking,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/src/utils/firebase';
import { useAuth } from '@/src/contexts/AuthContext';
import { useStudent } from '@/src/contexts/StudentContext';
import Paywall from '@/components/Paywall';
import { AUTH_ENDPOINTS } from '@/src/config/api';

interface MenuItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  showArrow?: boolean;
  dangerous?: boolean;
  rightElement?: React.ReactNode;
}

interface NotificationPreferences {
  testResults: boolean;
  attendance: boolean;
  announcements: boolean;
  messages: boolean;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, authToken, hasActiveSubscription, isLoading, logout, subscription, refreshSubscription, updateUser } = useAuth();
  const { students, selectedStudent } = useStudent();

  // State for modals
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [studentsModalVisible, setStudentsModalVisible] = useState(false);
  const [subscriptionModalVisible, setSubscriptionModalVisible] = useState(false);
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);

  // State for edit profile
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [nameError, setNameError] = useState('');

  // State for profile picture
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // State for notifications
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    testResults: true,
    attendance: true,
    announcements: true,
    messages: true,
  });
  const [savingNotifications, setSavingNotifications] = useState(false);

  // Refresh state
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshSubscription();
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshSubscription]);

  // Profile Picture Functions
  const pickImage = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library to upload a profile picture.');
      return;
    }

    // Show action sheet
    Alert.alert(
      'Profile Picture',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: () => launchCamera(),
        },
        {
          text: 'Choose from Library',
          onPress: () => launchImageLibrary(),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const launchCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow camera access to take a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      uploadProfilePicture(result.assets[0].uri);
    }
  };

  const launchImageLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      uploadProfilePicture(result.assets[0].uri);
    }
  };

  const uploadProfilePicture = async (uri: string) => {
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      // Create a blob from the image URI
      const response = await fetch(uri);
      const blob = await response.blob();

      // Create storage reference
      const fileName = `${user.uid}_${Date.now()}.jpg`;
      const storageRef = ref(storage, `parent-profiles/${fileName}`);

      // Upload the file
      await uploadBytes(storageRef, blob);

      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);

      // Update profile via API
      const apiResponse = await fetch(AUTH_ENDPOINTS.profile, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          photoURL: downloadURL,
        }),
      });

      const data = await apiResponse.json();

      if (data.success) {
        // Update local user state
        await updateUser({ photoURL: downloadURL });
        Alert.alert('Success', 'Profile picture updated successfully');
      } else {
        Alert.alert('Error', data.message || 'Failed to update profile picture');
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  // Helper function to extract local number from international format
  const getLocalNumber = (phone: string): string => {
    if (!phone) return '';
    
    let digits = phone.replace(/\D/g, '');
    
    // If it starts with 61 (country code), convert to local format
    if (digits.startsWith('61') && digits.length >= 11) {
      return '0' + digits.substring(2);
    }
    
    // If it starts with 4 (without country code or leading 0), add 0
    if (digits.startsWith('4') && digits.length === 9) {
      return '0' + digits;
    }
    
    // Already in local format or other
    return digits;
  };

  // Helper function to format phone for display (e.g., 0412 345 678)
  const formatPhoneForDisplay = (phone: string): string => {
    const local = getLocalNumber(phone);
    if (local.length === 10 && local.startsWith('04')) {
      return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
    }
    return local;
  };

  // Helper function to validate Australian mobile number
  const validateAustralianMobile = (phone: string): { isValid: boolean; message: string } => {
    if (!phone.trim()) {
      return { isValid: true, message: '' }; // Empty is OK (optional)
    }
    
    let digits = phone.replace(/\D/g, '');
    
    // If it starts with 61 (country code), remove it for validation
    if (digits.startsWith('61') && digits.length >= 11) {
      digits = digits.substring(2);
    }
    
    // Check if it's a valid Australian mobile format
    // 10 digits starting with 04 (e.g., 0412345678)
    if (digits.length === 10 && digits.startsWith('04')) {
      return { isValid: true, message: '' };
    }
    
    // 9 digits starting with 4 (e.g., 412345678)
    if (digits.length === 9 && digits.startsWith('4')) {
      return { isValid: true, message: '' };
    }
    
    // Provide specific error messages
    if (digits.length === 0) {
      return { isValid: true, message: '' }; // Empty is OK
    }
    
    if (!digits.startsWith('04') && !digits.startsWith('4') && !digits.startsWith('61')) {
      return { 
        isValid: false, 
        message: 'Australian mobile numbers start with 04' 
      };
    }
    
    if (digits.length < 9) {
      return { 
        isValid: false, 
        message: `Enter ${10 - digits.length} more digit${10 - digits.length > 1 ? 's' : ''}` 
      };
    }
    
    if (digits.length > 10 && !digits.startsWith('61')) {
      return { 
        isValid: false, 
        message: 'Phone number is too long (10 digits max)' 
      };
    }
    
    return { 
      isValid: false, 
      message: 'Enter valid Australian mobile (e.g., 0412 345 678)' 
    };
  };

  // Helper function to format Australian phone number
  const formatAustralianPhone = (phone: string): string => {
    let digits = phone.replace(/\D/g, '');
    
    // If it starts with 61 (country code already present), remove it first
    if (digits.startsWith('61') && digits.length >= 11) {
      digits = digits.substring(2);
    }
    
    // If it starts with 04, convert to international format
    if (digits.startsWith('04') && digits.length === 10) {
      return `+61${digits.substring(1)}`;
    }
    
    // If it starts with 4 (without 0), add +61
    if (digits.startsWith('4') && digits.length === 9) {
      return `+61${digits}`;
    }
    
    // Return original if empty or doesn't match expected format
    if (digits.length > 0) {
      return `+61${digits}`;
    }
    
    return phone;
  };

  // Helper function to validate name
  const validateName = (name: string): { isValid: boolean; message: string } => {
    if (!name.trim()) {
      return { isValid: false, message: 'Name is required' };
    }
    
    // Check for emojis
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    if (emojiRegex.test(name)) {
      return { isValid: false, message: 'Name cannot contain emojis' };
    }
    
    // Check for numbers
    if (/\d/.test(name)) {
      return { isValid: false, message: 'Name cannot contain numbers' };
    }
    
    // Check minimum length
    if (name.trim().length < 2) {
      return { isValid: false, message: 'Name must be at least 2 characters' };
    }
    
    return { isValid: true, message: '' };
  };

  // Helper function to validate phone input (9 digits starting with 4)
  const validatePhoneInput = (phone: string): { isValid: boolean; message: string } => {
    if (!phone.trim()) {
      return { isValid: true, message: '' }; // Empty is OK (optional)
    }
    
    let digits = phone.replace(/\D/g, '');
    
    // Remove leading 0 if user enters it
    if (digits.startsWith('0')) {
      digits = digits.substring(1);
    }
    
    // Should be 9 digits starting with 4
    if (digits.length === 9 && digits.startsWith('4')) {
      return { isValid: true, message: '' };
    }
    
    // Provide specific error messages
    if (digits.length === 0) {
      return { isValid: true, message: '' }; // Empty is OK
    }
    
    if (!digits.startsWith('4')) {
      return { 
        isValid: false, 
        message: 'Mobile numbers start with 4 (e.g., 412 345 678)' 
      };
    }
    
    if (digits.length < 9) {
      return { 
        isValid: false, 
        message: `Enter ${9 - digits.length} more digit${9 - digits.length > 1 ? 's' : ''}` 
      };
    }
    
    if (digits.length > 9) {
      return { 
        isValid: false, 
        message: 'Too many digits (9 required after +61)' 
      };
    }
    
    return { 
      isValid: false, 
      message: 'Enter 9 digits (e.g., 412 345 678)' 
    };
  };

  // Handle phone input change with validation
  const handlePhoneChange = (value: string) => {
    // Remove any non-digit except spaces for formatting
    let cleaned = value.replace(/[^\d\s]/g, '');
    
    // Remove leading 0 if user types it (since +61 is already shown)
    if (cleaned.replace(/\s/g, '').startsWith('0')) {
      cleaned = cleaned.replace(/^[\s]*0/, '');
    }
    
    setEditPhone(cleaned);
    const validation = validatePhoneInput(cleaned);
    setPhoneError(validation.isValid ? '' : validation.message);
  };

  // Handle name input change with validation
  const handleNameChange = (value: string) => {
    setEditName(value);
    const validation = validateName(value);
    setNameError(validation.isValid ? '' : validation.message);
  };

  // Update profile API call
  const handleUpdateProfile = async () => {
    // Validate name
    const nameValidation = validateName(editName);
    if (!nameValidation.isValid) {
      setNameError(nameValidation.message);
      Alert.alert('Error', nameValidation.message);
      return;
    }

    // Validate phone if provided
    if (editPhone.trim()) {
      const phoneValidation = validatePhoneInput(editPhone);
      if (!phoneValidation.isValid) {
        setPhoneError(phoneValidation.message);
        Alert.alert('Error', `Phone: ${phoneValidation.message}`);
        return;
      }
    }

    setIsSaving(true);
    try {
      // Format phone before sending: add +61 prefix
      const digits = editPhone.replace(/\D/g, '');
      const formattedPhone = digits ? `+61${digits}` : undefined;
      
      const response = await fetch(AUTH_ENDPOINTS.profile, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: editName.trim(),
          phone: formattedPhone,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local user state immediately
        await updateUser({
          name: editName.trim(),
          phone: formattedPhone,
        });
        Alert.alert('Success', 'Profile updated successfully');
        setEditProfileVisible(false);
      } else {
        Alert.alert('Error', data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Update notification preferences
  const handleUpdateNotifications = async () => {
    setSavingNotifications(true);
    try {
      const response = await fetch(AUTH_ENDPOINTS.profile, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          preferences: {
            notifications: notificationPrefs,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert('Success', 'Notification preferences updated');
        setNotificationsModalVisible(false);
      } else {
        Alert.alert('Error', data.message || 'Failed to update preferences');
      }
    } catch (error) {
      console.error('Error updating notifications:', error);
      Alert.alert('Error', 'Failed to update preferences. Please try again.');
    } finally {
      setSavingNotifications(false);
    }
  };

  // Open external links
  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open link');
    });
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Helper to convert stored phone (+61412345678) to input format (412 345 678)
  const getPhoneForInput = (phone: string | undefined): string => {
    if (!phone) return '';
    
    let digits = phone.replace(/\D/g, '');
    
    // Remove country code 61
    if (digits.startsWith('61')) {
      digits = digits.substring(2);
    }
    
    // Remove leading 0 if present
    if (digits.startsWith('0')) {
      digits = digits.substring(1);
    }
    
    // Format with spaces: 412 345 678
    if (digits.length === 9) {
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    }
    
    return digits;
  };

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Account',
      items: [
        {
          id: 'edit-profile',
          icon: 'person-outline',
          label: 'Edit Profile',
          showArrow: true,
          onPress: () => {
            setEditName(user?.name || '');
            setEditPhone(getPhoneForInput(user?.phone));
            setPhoneError('');
            setNameError('');
            setEditProfileVisible(true);
          },
        },
        {
          id: 'students',
          icon: 'people-outline',
          label: 'My Students',
          subtitle: `${students.length} student${students.length !== 1 ? 's' : ''}`,
          showArrow: true,
          onPress: () => setStudentsModalVisible(true),
        },
        {
          id: 'subscription',
          icon: 'card-outline',
          label: 'Subscription',
          subtitle: subscription?.isActive ? 'Active' : 'Inactive',
          showArrow: true,
          onPress: () => setSubscriptionModalVisible(true),
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          id: 'notifications',
          icon: 'notifications-outline',
          label: 'Notifications',
          showArrow: true,
          onPress: () => setNotificationsModalVisible(true),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help',
          icon: 'help-circle-outline',
          label: 'Help & Support',
          showArrow: true,
          onPress: () => openLink('mailto:support@druedu.com'),
        },
        {
          id: 'privacy',
          icon: 'shield-checkmark-outline',
          label: 'Privacy Policy',
          showArrow: true,
          onPress: () => openLink('https://www.drueducation.com/privacy'),
        },
        {
          id: 'terms',
          icon: 'document-text-outline',
          label: 'Terms of Service',
          showArrow: true,
          onPress: () => openLink('https://www.drueducation.com/terms'),
        },
      ],
    },
    {
      title: '',
      items: [
        {
          id: 'logout',
          icon: 'log-out-outline',
          label: 'Logout',
          dangerous: true,
          onPress: handleLogout,
        },
      ],
    },
  ];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!hasActiveSubscription) {
    return <Paywall />;
  }

  // Edit Profile Modal
  const renderEditProfileModal = () => (
    <Modal
      visible={editProfileVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setEditProfileVisible(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setEditProfileVisible(false)}>
            <Ionicons name="close" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={handleUpdateProfile} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator size="small" color="#6366F1" />
            ) : (
              <Text style={styles.saveButton}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={[styles.input, nameError ? styles.inputError : null]}
              value={editName}
              onChangeText={handleNameChange}
              placeholder="Enter your name"
              autoCapitalize="words"
            />
            {nameError ? (
              <Text style={styles.errorText}>{nameError}</Text>
            ) : (
              <Text style={styles.inputHint}>Letters only (no emojis or numbers)</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.phoneInputContainer}>
              <View style={styles.countryCodeBox}>
                <Text style={styles.countryCodeText}>🇦🇺 +61</Text>
              </View>
              <TextInput
                style={[styles.phoneInput, phoneError ? styles.inputError : null]}
                value={editPhone}
                onChangeText={handlePhoneChange}
                placeholder="412 345 678"
                keyboardType="phone-pad"
                maxLength={12}
              />
            </View>
            {phoneError ? (
              <Text style={styles.errorText}>{phoneError}</Text>
            ) : (
              <View>
                <Text style={styles.inputHint}>Enter 9 digits after removing the leading 0</Text>
                <Text style={styles.inputHintExample}>Example: 0412 345 678 → enter 412 345 678</Text>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={[styles.input, styles.disabledInput]}>
              <Text style={styles.disabledText}>{user?.email}</Text>
            </View>
            <Text style={styles.inputHint}>Email cannot be changed</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  // My Students Modal
  const renderStudentsModal = () => (
    <Modal
      visible={studentsModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setStudentsModalVisible(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setStudentsModalVisible(false)}>
            <Ionicons name="close" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>My Students</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          {students.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyStateTitle}>No Students Linked</Text>
              <Text style={styles.emptyStateText}>
                Your linked students will appear here once they are added by an administrator.
              </Text>
            </View>
          ) : (
            students.map((student, index) => (
              <View 
                key={student.studentId} 
                style={[
                  styles.studentCard,
                  selectedStudent?.studentId === student.studentId && styles.selectedStudentCard
                ]}
              >
                <View style={styles.studentAvatar}>
                  <Text style={styles.studentAvatarText}>
                    {student.studentName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{student.studentName}</Text>
                  {student.studentEmail && (
                    <Text style={styles.studentEmail}>{student.studentEmail}</Text>
                  )}
                </View>
                {selectedStudent?.studentId === student.studentId && (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>Current</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  // Subscription Modal
  const renderSubscriptionModal = () => (
    <Modal
      visible={subscriptionModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setSubscriptionModalVisible(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setSubscriptionModalVisible(false)}>
            <Ionicons name="close" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Subscription</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Status Card */}
          <View style={[
            styles.subscriptionStatusCard,
            subscription?.isActive ? styles.activeSubscription : styles.inactiveSubscription
          ]}>
            <Ionicons 
              name={subscription?.isActive ? "checkmark-circle" : "alert-circle"} 
              size={48} 
              color={subscription?.isActive ? "#10B981" : "#EF4444"} 
            />
            <Text style={styles.subscriptionStatusTitle}>
              {subscription?.isActive ? 'Active Subscription' : 'No Active Subscription'}
            </Text>
            <Text style={styles.subscriptionStatusSubtitle}>
              {subscription?.isActive 
                ? `${subscription?.daysRemaining || 0} days remaining`
                : 'Subscribe to access all features'
              }
            </Text>
          </View>

          {/* Details */}
          {subscription?.isActive && (
            <View style={styles.subscriptionDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Plan</Text>
                <Text style={styles.detailValue}>Yearly</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Students</Text>
                <Text style={styles.detailValue}>{subscription?.studentCount || 0}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Price per Student</Text>
                <Text style={styles.detailValue}>${subscription?.pricePerStudent || 14.99}/year</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Amount</Text>
                <Text style={styles.detailValue}>${subscription?.totalAmount || 0}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Expiry Date</Text>
                <Text style={styles.detailValue}>{formatDate(subscription?.expiryDate)}</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  // Notifications Modal
  const renderNotificationsModal = () => (
    <Modal
      visible={notificationsModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setNotificationsModalVisible(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setNotificationsModalVisible(false)}>
            <Ionicons name="close" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Notifications</Text>
          <TouchableOpacity onPress={handleUpdateNotifications} disabled={savingNotifications}>
            {savingNotifications ? (
              <ActivityIndicator size="small" color="#6366F1" />
            ) : (
              <Text style={styles.saveButton}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <Text style={styles.notificationSectionTitle}>Push Notifications</Text>
          
          <View style={styles.notificationItem}>
            <View style={styles.notificationInfo}>
              <Ionicons name="document-text-outline" size={24} color="#6366F1" />
              <View style={styles.notificationText}>
                <Text style={styles.notificationLabel}>Test Results</Text>
                <Text style={styles.notificationDescription}>Get notified when test results are published</Text>
              </View>
            </View>
            <Switch
              value={notificationPrefs.testResults}
              onValueChange={(value) => setNotificationPrefs(prev => ({ ...prev, testResults: value }))}
              trackColor={{ false: '#D1D5DB', true: '#C7D2FE' }}
              thumbColor={notificationPrefs.testResults ? '#6366F1' : '#9CA3AF'}
            />
          </View>

          <View style={styles.notificationItem}>
            <View style={styles.notificationInfo}>
              <Ionicons name="calendar-outline" size={24} color="#6366F1" />
              <View style={styles.notificationText}>
                <Text style={styles.notificationLabel}>Attendance</Text>
                <Text style={styles.notificationDescription}>Get notified about attendance updates</Text>
              </View>
            </View>
            <Switch
              value={notificationPrefs.attendance}
              onValueChange={(value) => setNotificationPrefs(prev => ({ ...prev, attendance: value }))}
              trackColor={{ false: '#D1D5DB', true: '#C7D2FE' }}
              thumbColor={notificationPrefs.attendance ? '#6366F1' : '#9CA3AF'}
            />
          </View>

          <View style={styles.notificationItem}>
            <View style={styles.notificationInfo}>
              <Ionicons name="megaphone-outline" size={24} color="#6366F1" />
              <View style={styles.notificationText}>
                <Text style={styles.notificationLabel}>Announcements</Text>
                <Text style={styles.notificationDescription}>Get notified about class announcements</Text>
              </View>
            </View>
            <Switch
              value={notificationPrefs.announcements}
              onValueChange={(value) => setNotificationPrefs(prev => ({ ...prev, announcements: value }))}
              trackColor={{ false: '#D1D5DB', true: '#C7D2FE' }}
              thumbColor={notificationPrefs.announcements ? '#6366F1' : '#9CA3AF'}
            />
          </View>

          <View style={styles.notificationItem}>
            <View style={styles.notificationInfo}>
              <Ionicons name="chatbubble-outline" size={24} color="#6366F1" />
              <View style={styles.notificationText}>
                <Text style={styles.notificationLabel}>Messages</Text>
                <Text style={styles.notificationDescription}>Get notified about new messages</Text>
              </View>
            </View>
            <Switch
              value={notificationPrefs.messages}
              onValueChange={(value) => setNotificationPrefs(prev => ({ ...prev, messages: value }))}
              trackColor={{ false: '#D1D5DB', true: '#C7D2FE' }}
              thumbColor={notificationPrefs.messages ? '#6366F1' : '#9CA3AF'}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366F1']} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <TouchableOpacity style={styles.avatarContainer} onPress={pickImage} disabled={isUploadingPhoto}>
            {isUploadingPhoto ? (
              <View style={styles.avatarPlaceholder}>
                <ActivityIndicator size="large" color="#6366F1" />
              </View>
            ) : user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0)?.toUpperCase() || 'P'}
                </Text>
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              <Ionicons name="camera" size={14} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Tap to change photo</Text>
          <Text style={styles.userName}>{user?.name || 'Parent'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
          {user?.phone && <Text style={styles.userPhone}>{user.phone}</Text>}
        </View>

        {/* Current Student Indicator */}
        {selectedStudent && (
          <View style={styles.currentStudentCard}>
            <Text style={styles.currentStudentLabel}>Currently Viewing</Text>
            <View style={styles.currentStudentRow}>
              <View style={styles.currentStudentAvatar}>
                <Text style={styles.currentStudentAvatarText}>
                  {selectedStudent.studentName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.currentStudentName}>{selectedStudent.studentName}</Text>
            </View>
          </View>
        )}

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            {section.title && (
              <Text style={styles.sectionTitle}>{section.title}</Text>
            )}
            <View style={styles.menuCard}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem,
                    itemIndex < section.items.length - 1 && styles.menuItemBorder,
                  ]}
                  onPress={item.onPress}
                >
                  <View style={[
                    styles.menuIcon,
                    item.dangerous && styles.dangerousIcon
                  ]}>
                    <Ionicons
                      name={item.icon}
                      size={20}
                      color={item.dangerous ? '#EF4444' : '#6366F1'}
                    />
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={[
                      styles.menuLabel,
                      item.dangerous && styles.dangerousText
                    ]}>
                      {item.label}
                    </Text>
                    {item.subtitle && (
                      <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                    )}
                  </View>
                  {item.rightElement}
                  {item.showArrow && (
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* App Version */}
        <Text style={styles.version}>Version 1.0.0</Text>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modals */}
      {renderEditProfileModal()}
      {renderStudentsModal()}
      {renderSubscriptionModal()}
      {renderNotificationsModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  currentStudentCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  currentStudentLabel: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '500',
    marginBottom: 8,
  },
  currentStudentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentStudentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentStudentAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  currentStudentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 10,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dangerousIcon: {
    backgroundColor: '#FEF2F2',
  },
  menuContent: {
    flex: 1,
    marginLeft: 12,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  dangerousText: {
    color: '#EF4444',
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  version: {
    textAlign: 'center',
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 24,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366F1',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  // Input Styles
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
  },
  disabledInput: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
  },
  disabledText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  inputHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 6,
  },
  // Phone Input with Country Code
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  countryCodeBox: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
  },
  phoneInputError: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  // Student Card
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedStudentCard: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentAvatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  studentInfo: {
    flex: 1,
    marginLeft: 14,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  studentEmail: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  currentBadge: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  currentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Subscription Styles
  subscriptionStatusCard: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
    marginBottom: 20,
  },
  activeSubscription: {
    backgroundColor: '#ECFDF5',
  },
  inactiveSubscription: {
    backgroundColor: '#FEF2F2',
  },
  subscriptionStatusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
  },
  subscriptionStatusSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  subscriptionDetails: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 15,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  // Notification Styles
  notificationSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  notificationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationText: {
    marginLeft: 14,
    flex: 1,
  },
  notificationLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  notificationDescription: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
});
