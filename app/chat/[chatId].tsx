import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/src/contexts/AuthContext';
import { chatService, ChatMessage, ChatAttachment } from '../../src/services/chatService';
import { auth as firebaseAuth } from '@/src/utils/firebase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ParentData {
  id: string;
  email: string;
  name?: string;
}

export default function ChatScreen() {
  const params = useLocalSearchParams<{
    chatId: string;
    name: string;
    type: string;
    avatar: string;
    subjects?: string;
    teacherId?: string;
    teacherEmail?: string;
    adminEmail?: string;
  }>();

  const { name, type, avatar, subjects, teacherId, teacherEmail, adminEmail } = params;
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [parentData, setParentData] = useState<ParentData | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const flatListRef = useRef<FlatList>(null);

  // Load parent data from AuthContext or storage
  useEffect(() => {
    const loadParentData = async () => {
      try {
        // First try from AuthContext user
        if (user) {
          console.log('Chat: Got user from AuthContext:', user);
          // Use email as parent ID to match web app (teacher uses parent email as ID)
          setParentData({
            id: user.email, // Use email as ID to match teacher chat
            email: user.email,
            name: user.name,
          });
          return;
        }
        
        // Fallback to AsyncStorage with correct key
        const userData = await AsyncStorage.getItem('@dru_user_data');
        console.log('Chat: userData from storage:', userData);
        if (userData) {
          const parsed = JSON.parse(userData);
          console.log('Chat: Parsed user data:', parsed);
          // Use email as parent ID to match web app
          setParentData({
            id: parsed.email, // Use email as ID to match teacher chat
            email: parsed.email,
            name: parsed.name || parsed.fullName || parsed.displayName,
          });
        } else {
          console.log('Chat: No user data found in storage');
        }
      } catch (error) {
        console.error('Error loading parent data:', error);
      }
    };
    loadParentData();
  }, [user]);

  // Initialize conversation and subscribe to messages
  useEffect(() => {
    if (!parentData) {
      console.log('Chat: No parent data yet, waiting...');
      return;
    }

    console.log('Chat: Initializing with parent data:', parentData);

    let unsubscribe: (() => void) | null = null;

    const initializeChat = async () => {
      try {
        setLoading(true);
        
        // Determine recipient info
        const recipientId = type === 'admin' ? 'system-admin' : (teacherId || '');
        const recipientEmail = type === 'admin' ? (adminEmail || 'dru.coordinator@gmail.com') : (teacherEmail || '');
        const recipientType = type === 'admin' ? 'admin' : 'teacher';
        
        console.log('Chat: Getting/creating conversation with:', {
          parentId: parentData.id,
          parentEmail: parentData.email,
          recipientId,
          recipientEmail,
          recipientType,
        });
        
        // Get or create conversation
        const convId = await chatService.getOrCreateConversation(
          parentData.id,
          parentData.email,
          parentData.name || 'Parent',
          'parent',
          recipientId,
          recipientEmail,
          name || 'Recipient',
          recipientType as 'teacher' | 'admin'
        );
        
        console.log('Chat: Got conversation ID:', convId);
        setConversationId(convId);
        
        // Subscribe to messages
        console.log('Chat: Subscribing to messages...');
        unsubscribe = chatService.subscribeToMessages(convId, (msgs) => {
          console.log('Chat: Received messages:', msgs.length);
          setMessages(msgs);
          setLoading(false);
          
          // Mark messages as read
          if (msgs.length > 0) {
            chatService.markAsRead(convId, parentData.id);
          }
        });
        
      } catch (error) {
        console.error('Error initializing chat:', error);
        setLoading(false);
        
        // Check if it's a Firebase Auth error
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('permission') || errorMessage.includes('Permission')) {
          // Check if Firebase Auth is signed out
          if (!firebaseAuth.currentUser) {
            setAuthError('Session expired. Please log in again to use chat.');
          } else {
            setAuthError('Unable to access chat. Please try again later.');
          }
        } else {
          Alert.alert('Error', 'Failed to load chat. Please try again.');
        }
      }
    };

    initializeChat();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [parentData, type, teacherId, teacherEmail, adminEmail, name]);

  // Pick image from gallery
  const pickImage = useCallback(async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to send images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  }, []);

  // Take photo with camera
  const takePhoto = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your camera to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  }, []);

  // Show image options
  const showImageOptions = useCallback(() => {
    Alert.alert(
      'Send Image',
      'Choose an option',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, [pickImage, takePhoto]);

  // Send image
  const handleSendImage = useCallback(async () => {
    if (!selectedImage || !conversationId || !parentData || uploadingImage) return;

    setUploadingImage(true);
    Keyboard.dismiss();

    try {
      await chatService.sendImageMessage(
        conversationId,
        parentData.id,
        parentData.email,
        parentData.name || 'Parent',
        'parent',
        selectedImage,
        newMessage.trim() || undefined // Optional caption
      );
      
      setSelectedImage(null);
      setNewMessage('');
      
      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending image:', error);
      Alert.alert('Error', 'Failed to send image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  }, [selectedImage, conversationId, parentData, uploadingImage, newMessage]);

  // Send message
  const handleSend = useCallback(async () => {
    if (!newMessage.trim() || !conversationId || !parentData || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);
    Keyboard.dismiss();

    try {
      await chatService.sendMessage(
        conversationId,
        parentData.id,
        parentData.email,
        parentData.name || 'Parent',
        'parent',
        messageText
      );
      
      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      setNewMessage(messageText); // Restore message on error
    } finally {
      setSending(false);
    }
  }, [newMessage, conversationId, parentData, sending]);

  // Format timestamp
  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    if (isYesterday) {
      return 'Yesterday ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + 
           date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // Render message item
  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isMe = item.senderType === 'parent';
    const showDate = index === 0 || 
      (messages[index - 1] && 
       new Date(item.timestamp?.toDate?.() || item.timestamp).toDateString() !== 
       new Date(messages[index - 1].timestamp?.toDate?.() || messages[index - 1].timestamp).toDateString());

    return (
      <View>
        {showDate && (
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>
              {formatDateHeader(item.timestamp)}
            </Text>
          </View>
        )}
        <View style={[styles.messageContainer, isMe ? styles.myMessage : styles.theirMessage]}>
          <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble, item.messageType === 'image' && styles.imageBubble]}>
            {/* Image attachment */}
            {item.messageType === 'image' && item.attachments && item.attachments.length > 0 && (
              <TouchableOpacity onPress={() => setPreviewImage(item.attachments![0].url)}>
                <Image 
                  source={{ uri: item.attachments[0].url }} 
                  style={styles.messageImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}
            {/* Text message or caption */}
            {item.text ? (
              <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText, item.messageType === 'image' && styles.imageCaption]}>
                {item.text}
              </Text>
            ) : null}
            <View style={styles.messageFooter}>
              <Text style={[styles.messageTime, isMe ? styles.myMessageTime : styles.theirMessageTime]}>
                {formatTime(item.timestamp)}
              </Text>
              {isMe && (
                <Ionicons 
                  name={item.read ? "checkmark-done" : "checkmark"} 
                  size={14} 
                  color={item.read ? "#60A5FA" : "#9CA3AF"} 
                  style={styles.readIcon}
                />
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Format date header
  const formatDateHeader = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return 'Today';
    }
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  // Empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Ionicons name="chatbubble-ellipses-outline" size={48} color="#6366F1" />
      </View>
      <Text style={styles.emptyTitle}>Start a Conversation</Text>
      <Text style={styles.emptyText}>
        Send a message to {name} to begin chatting.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        
        <View style={[
          styles.headerAvatar, 
          type === 'admin' ? styles.adminAvatar : null
        ]}>
          <Text style={styles.headerAvatarText}>{avatar}</Text>
        </View>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{name}</Text>
          {type === 'teacher' && subjects ? (
            <Text style={styles.headerSubtitle}>{subjects}</Text>
          ) : type === 'admin' ? (
            <Text style={styles.headerSubtitle}>System Administrator</Text>
          ) : null}
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 64 : 0}
      >
        {authError ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
            <Text style={styles.errorTitle}>Session Expired</Text>
            <Text style={styles.errorText}>{authError}</Text>
            <TouchableOpacity 
              style={styles.reloginButton}
              onPress={async () => {
                await logout();
                router.replace('/(auth)/login');
              }}
            >
              <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
              <Text style={styles.reloginButtonText}>Log In Again</Text>
            </TouchableOpacity>
          </View>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.messagesContent,
              messages.length === 0 && styles.emptyContent
            ]}
            ListEmptyComponent={renderEmptyState}
            onContentSizeChange={() => {
              if (messages.length > 0) {
                flatListRef.current?.scrollToEnd({ animated: false });
              }
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          />
        )}

        {/* Selected Image Preview */}
        {selectedImage && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
            <TouchableOpacity 
              style={styles.removeImageButton}
              onPress={() => setSelectedImage(null)}
            >
              <Ionicons name="close-circle" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}

        {/* Input Area */}
        <View style={[styles.inputContainer, { paddingBottom: insets.bottom || 8 }]}>
          {/* Image picker button */}
          <TouchableOpacity 
            style={styles.attachButton}
            onPress={showImageOptions}
            disabled={sending || uploadingImage}
          >
            <Ionicons name="image-outline" size={24} color="#6366F1" />
          </TouchableOpacity>
          
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder={selectedImage ? "Add a caption..." : "Type a message..."}
              placeholderTextColor="#9CA3AF"
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={1000}
              editable={!sending && !uploadingImage}
            />
          </View>
          <TouchableOpacity 
            style={[
              styles.sendButton, 
              ((!newMessage.trim() && !selectedImage) || sending || uploadingImage) && styles.sendButtonDisabled
            ]}
            onPress={selectedImage ? handleSendImage : handleSend}
            disabled={(!newMessage.trim() && !selectedImage) || sending || uploadingImage}
          >
            {sending || uploadingImage ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Image Preview Modal */}
      <Modal
        visible={!!previewImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.modalCloseButton}
            onPress={() => setPreviewImage(null)}
          >
            <Ionicons name="close" size={32} color="#FFFFFF" />
          </TouchableOpacity>
          {previewImage && (
            <Image 
              source={{ uri: previewImage }} 
              style={styles.modalImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
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
    marginRight: 8,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminAvatar: {
    backgroundColor: '#059669',
  },
  headerAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 1,
  },
  chatContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  reloginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  reloginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageContainer: {
    marginBottom: 8,
  },
  myMessage: {
    alignItems: 'flex-end',
  },
  theirMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  myBubble: {
    backgroundColor: '#6366F1',
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  theirMessageText: {
    color: '#1F2937',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  theirMessageTime: {
    color: '#9CA3AF',
  },
  readIcon: {
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderTopColor: '#E5E7EB',
  },
  attachButton: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 21,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    minHeight: 42,
    maxHeight: 100,
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    color: '#1F2937',
    maxHeight: 80,
    paddingTop: 0,
    paddingBottom: 0,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
  },
  sendButtonDisabled: {
    backgroundColor: '#C7D2FE',
  },
  // Image preview styles
  imagePreviewContainer: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderTopColor: '#E5E7EB',
    position: 'relative',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    left: 104,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  // Message image styles
  imageBubble: {
    padding: 4,
    maxWidth: SCREEN_WIDTH * 0.65,
  },
  messageImage: {
    width: SCREEN_WIDTH * 0.55,
    height: SCREEN_WIDTH * 0.55,
    borderRadius: 8,
    marginBottom: 4,
  },
  imageCaption: {
    marginTop: 4,
    paddingHorizontal: 8,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  modalImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
});
