import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { firestore } from '../utils/firebase';

const CONVERSATIONS_COLLECTION = 'chatConversations';
const MESSAGES_COLLECTION = 'chatMessages';

// Types
export interface ChatParticipant {
  id: string;
  name: string;
  email?: string;
  type: 'parent' | 'teacher' | 'admin' | 'student';
  avatar?: string;
}

export interface ChatConversation {
  id: string;
  participants: string[];
  participantDetails: ChatParticipant[];
  lastMessage?: {
    text: string;
    timestamp: Date;
  };
  unreadCount: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatAttachment {
  type: 'image';
  url: string;
  thumbnailUrl?: string;
  fileName?: string;
  fileSize?: number;
  width?: number;
  height?: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderType: 'parent' | 'teacher' | 'admin' | 'student';
  text: string;
  messageType: 'text' | 'image';
  attachments?: ChatAttachment[];
  timestamp: any; // Firestore Timestamp or Date
  read: boolean;
  readBy: string[];
}

// Helper to convert Timestamp to Date
const toDate = (timestamp: Timestamp | undefined): Date | undefined => {
  return timestamp?.toDate();
};

export class ChatService {
  
  /**
   * Get or create a conversation between two users (convenience method)
   */
  static async getOrCreateConversation(
    user1Id: string,
    user1Email: string,
    user1Name: string,
    user1Type: 'parent' | 'teacher' | 'admin' | 'student',
    user2Id: string,
    user2Email: string,
    user2Name: string,
    user2Type: 'parent' | 'teacher' | 'admin' | 'student'
  ): Promise<string> {
    const participant1: ChatParticipant = {
      id: user1Id,
      email: user1Email,
      name: user1Name,
      type: user1Type,
    };
    const participant2: ChatParticipant = {
      id: user2Id,
      email: user2Email,
      name: user2Name,
      type: user2Type,
    };
    
    const conversation = await this.getOrCreateConversationWithParticipants(participant1, participant2);
    return conversation.id;
  }
  
  /**
   * Get or create a conversation between two users (with participant objects)
   */
  static async getOrCreateConversationWithParticipants(
    participant1: ChatParticipant,
    participant2: ChatParticipant
  ): Promise<ChatConversation> {
    const participantIds = [participant1.id, participant2.id].sort();
    console.log('ChatService: Looking for conversation with participants:', participantIds);
    console.log('ChatService: Participant 1:', JSON.stringify(participant1));
    console.log('ChatService: Participant 2:', JSON.stringify(participant2));
    
    // Debug: Query all conversations that contain EITHER participant
    const p1ConvsQuery = query(
      collection(firestore, CONVERSATIONS_COLLECTION),
      where('participants', 'array-contains', participant1.id)
    );
    const p2ConvsQuery = query(
      collection(firestore, CONVERSATIONS_COLLECTION),
      where('participants', 'array-contains', participant2.id)
    );
    
    const [p1Convs, p2Convs] = await Promise.all([
      getDocs(p1ConvsQuery),
      getDocs(p2ConvsQuery)
    ]);
    
    console.log('ChatService DEBUG: Conversations containing participant1 (' + participant1.id + '):', 
      p1Convs.docs.map(d => ({ id: d.id, participants: d.data().participants })));
    console.log('ChatService DEBUG: Conversations containing participant2 (' + participant2.id + '):', 
      p2Convs.docs.map(d => ({ id: d.id, participants: d.data().participants })));
    
    // Find conversations that contain BOTH participants
    const p1ConvIds = new Set(p1Convs.docs.map(d => d.id));
    const sharedConvs = p2Convs.docs.filter(d => p1ConvIds.has(d.id));
    console.log('ChatService DEBUG: Conversations containing BOTH participants:', 
      sharedConvs.map(d => ({ id: d.id, participants: d.data().participants })));
    
    // Check if conversation exists with exact match
    const conversationsRef = collection(firestore, CONVERSATIONS_COLLECTION);
    const q = query(
      conversationsRef,
      where('participants', '==', participantIds)
    );
    
    const snapshot = await getDocs(q);
    console.log('ChatService: Exact match conversations:', snapshot.docs.length);
    
    // Use exact match if found, otherwise check shared conversations
    let existingConv = snapshot.docs[0];
    
    if (!existingConv && sharedConvs.length > 0) {
      // Found conversations containing both participants but with different array format
      console.log('ChatService: No exact match, but found shared conversation:', sharedConvs[0].id);
      existingConv = sharedConvs[0];
    }
    
    if (existingConv) {
      const data = existingConv.data();
      console.log('ChatService: Using existing conversation:', existingConv.id);
      return {
        id: existingConv.id,
        participants: data.participants,
        participantDetails: data.participantDetails,
        lastMessage: data.lastMessage ? {
          text: data.lastMessage,
          timestamp: toDate(data.lastMessageAt) || new Date(),
        } : undefined,
        unreadCount: data.unreadCount || {},
        createdAt: toDate(data.createdAt) || new Date(),
        updatedAt: toDate(data.updatedAt) || new Date(),
      };
    }
    
    // Create new conversation
    console.log('ChatService: Creating new conversation...');
    const now = Timestamp.now();
    const newConversation = {
      participants: participantIds,
      participantDetails: [participant1, participant2],
      unreadCount: {
        [participant1.id]: 0,
        [participant2.id]: 0,
      },
      createdAt: now,
      updatedAt: now,
    };
    
    const docRef = await addDoc(conversationsRef, newConversation);
    console.log('ChatService: Created new conversation:', docRef.id);
    
    return {
      id: docRef.id,
      participants: newConversation.participants,
      participantDetails: newConversation.participantDetails,
      unreadCount: newConversation.unreadCount,
      createdAt: now.toDate(),
      updatedAt: now.toDate(),
    };
  }
  
  /**
   * Subscribe to messages in a conversation (real-time)
   */
  static subscribeToMessages(
    conversationId: string,
    callback: (messages: ChatMessage[]) => void
  ): () => void {
    console.log('ChatService: Subscribing to messages for conversation:', conversationId);
    const messagesRef = collection(firestore, MESSAGES_COLLECTION);
    const q = query(
      messagesRef,
      where('conversationId', '==', conversationId),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    
    return onSnapshot(q, (snapshot) => {
      console.log('ChatService: Snapshot received, docs count:', snapshot.docs.length);
      const messages: ChatMessage[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const readBy = data.readBy || [];
        return {
          id: docSnap.id,
          conversationId: data.conversationId,
          senderId: data.senderId,
          senderName: data.senderName,
          senderType: data.senderRole || data.senderType, // Support both field names
          text: data.message || data.text || '', // Support both field names
          messageType: data.messageType || 'text',
          attachments: data.attachments || [],
          timestamp: data.createdAt, // Keep as Firestore Timestamp for formatting
          read: readBy.length > 1, // Read if more than just sender
          readBy: readBy,
        };
      }).reverse();
      console.log('ChatService: Calling callback with', messages.length, 'messages');
      callback(messages);
    }, (error: any) => {
      console.error('ChatService: Error subscribing to messages:', error);
      console.error('ChatService: Error code:', error?.code);
      console.error('ChatService: Error message:', error?.message);
      // Check if it's an index error and log the link
      if (error?.message?.includes('index')) {
        console.error('Firestore index required. Create index at Firebase Console or use this link if available in error.');
      }
      // Return empty array on error so UI doesn't stay loading forever
      callback([]);
    });
  }
  
  /**
   * Send a message (convenience method)
   */
  static async sendMessage(
    conversationId: string,
    senderId: string,
    senderEmail: string,
    senderName: string,
    senderType: 'parent' | 'teacher' | 'admin' | 'student',
    text: string,
    attachments?: ChatAttachment[]
  ): Promise<ChatMessage> {
    return this.sendMessageInternal(conversationId, senderId, senderName, senderType, text, attachments);
  }
  
  /**
   * Send a message (internal implementation)
   */
  static async sendMessageInternal(
    conversationId: string,
    senderId: string,
    senderName: string,
    senderType: 'parent' | 'teacher' | 'admin' | 'student',
    text: string,
    attachments?: ChatAttachment[]
  ): Promise<ChatMessage> {
    const messagesRef = collection(firestore, MESSAGES_COLLECTION);
    const now = Timestamp.now();
    
    const messageType = attachments && attachments.length > 0 ? 'image' : 'text';
    const lastMessageText = messageType === 'image' ? '📷 Image' : text;
    
    const newMessage: any = {
      conversationId,
      senderId,
      senderName,
      senderRole: senderType, // Use senderRole for consistency with Firestore schema
      message: text, // Use message field for consistency
      messageType,
      readBy: [senderId],
      createdAt: now,
    };
    
    if (attachments && attachments.length > 0) {
      newMessage.attachments = attachments;
    }
    
    const docRef = await addDoc(messagesRef, newMessage);
    
    // Update conversation with last message
    const conversationRef = doc(firestore, CONVERSATIONS_COLLECTION, conversationId);
    const conversationSnap = await getDoc(conversationRef);
    
    if (conversationSnap.exists()) {
      const convData = conversationSnap.data();
      const participants = convData.participants || [];
      
      // Prepare updates
      const updates: any = {
        lastMessage: lastMessageText.length > 100 ? lastMessageText.substring(0, 100) + '...' : lastMessageText,
        lastMessageAt: now,
        lastMessageBy: senderId,
        updatedAt: now,
      };
      
      // Increment unread for other participants
      for (const participantId of participants) {
        if (participantId !== senderId) {
          updates[`unreadCount.${participantId}`] = increment(1);
        }
      }
      
      await updateDoc(conversationRef, updates);
    }
    
    return {
      id: docRef.id,
      conversationId,
      senderId,
      senderName,
      senderType,
      text,
      timestamp: now,
      read: false,
      readBy: [senderId],
    };
  }
  
  /**
   * Mark messages as read
   */
  static async markAsRead(conversationId: string, userId: string): Promise<void> {
    // Reset unread count for this user
    const conversationRef = doc(firestore, CONVERSATIONS_COLLECTION, conversationId);
    await updateDoc(conversationRef, {
      [`unreadCount.${userId}`]: 0,
    });
  }
  
  /**
   * Subscribe to conversations for a user
   */
  static subscribeToConversations(
    userId: string,
    callback: (conversations: ChatConversation[]) => void
  ): () => void {
    const conversationsRef = collection(firestore, CONVERSATIONS_COLLECTION);
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const conversations: ChatConversation[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          participants: data.participants,
          participantDetails: data.participantDetails,
          lastMessage: data.lastMessage ? {
            text: data.lastMessage,
            timestamp: toDate(data.lastMessageAt) || new Date(),
          } : undefined,
          unreadCount: data.unreadCount || {},
          createdAt: toDate(data.createdAt) || new Date(),
          updatedAt: toDate(data.updatedAt) || new Date(),
        };
      });
      callback(conversations);
    }, (error) => {
      console.error('Error subscribing to conversations:', error);
    });
  }
}

// Export convenience instance
export const chatService = ChatService;
