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
  arrayUnion,
  increment,
  writeBatch
} from 'firebase/firestore';
import { firestore } from './firebase';

const CONVERSATIONS_COLLECTION = 'chatConversations';
const MESSAGES_COLLECTION = 'chatMessages';

// Types
export interface ChatParticipant {
  id: string;
  name: string;
  email?: string;
  role: 'parent' | 'teacher' | 'admin' | 'student';
  avatar?: string;
}

export interface ChatConversation {
  id: string;
  participants: string[];
  participantDetails: ChatParticipant[];
  lastMessage?: string;
  lastMessageAt?: Date;
  lastMessageBy?: string;
  unreadCount: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'parent' | 'teacher' | 'admin' | 'student';
  message: string;
  messageType: 'text' | 'image' | 'file';
  attachmentUrl?: string;
  attachmentName?: string;
  readBy: string[];
  createdAt: Date;
}

// Helper to convert Timestamp to Date
const toDate = (timestamp: Timestamp | undefined): Date | undefined => {
  return timestamp?.toDate();
};

export class ChatService {
  
  /**
   * Get or create a conversation between two users
   */
  static async getOrCreateConversation(
    participant1: ChatParticipant,
    participant2: ChatParticipant
  ): Promise<ChatConversation> {
    const participantIds = [participant1.id, participant2.id].sort();
    
    // Check if conversation exists
    const conversationsRef = collection(firestore, CONVERSATIONS_COLLECTION);
    const q = query(
      conversationsRef,
      where('participants', '==', participantIds)
    );
    
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      const data = docSnap.data();
      return {
        id: docSnap.id,
        participants: data.participants,
        participantDetails: data.participantDetails,
        lastMessage: data.lastMessage,
        lastMessageAt: toDate(data.lastMessageAt),
        lastMessageBy: data.lastMessageBy,
        unreadCount: data.unreadCount || {},
        createdAt: toDate(data.createdAt) || new Date(),
        updatedAt: toDate(data.updatedAt) || new Date(),
      };
    }
    
    // Create new conversation
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
    
    return {
      id: docRef.id,
      ...newConversation,
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
    const messagesRef = collection(firestore, MESSAGES_COLLECTION);
    const q = query(
      messagesRef,
      where('conversationId', '==', conversationId),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    
    return onSnapshot(q, (snapshot) => {
      const messages: ChatMessage[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          conversationId: data.conversationId,
          senderId: data.senderId,
          senderName: data.senderName,
          senderRole: data.senderRole,
          message: data.message,
          messageType: data.messageType || 'text',
          attachmentUrl: data.attachmentUrl,
          attachmentName: data.attachmentName,
          readBy: data.readBy || [],
          createdAt: toDate(data.createdAt) || new Date(),
        };
      }).reverse();
      callback(messages);
    }, (error) => {
      console.error('Error subscribing to messages:', error);
    });
  }
  
  /**
   * Send a message
   */
  static async sendMessage(
    conversationId: string,
    senderId: string,
    senderName: string,
    senderRole: 'parent' | 'teacher' | 'admin' | 'student',
    message: string
  ): Promise<ChatMessage> {
    const messagesRef = collection(firestore, MESSAGES_COLLECTION);
    const now = Timestamp.now();
    
    const newMessage = {
      conversationId,
      senderId,
      senderName,
      senderRole,
      message,
      messageType: 'text',
      readBy: [senderId],
      createdAt: now,
    };
    
    const docRef = await addDoc(messagesRef, newMessage);
    
    // Update conversation with last message
    const conversationRef = doc(firestore, CONVERSATIONS_COLLECTION, conversationId);
    const conversationSnap = await getDoc(conversationRef);
    
    if (conversationSnap.exists()) {
      const convData = conversationSnap.data();
      const participants = convData.participants || [];
      
      // Prepare updates
      const updates: any = {
        lastMessage: message.length > 100 ? message.substring(0, 100) + '...' : message,
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
      ...newMessage,
      messageType: 'text',
      readBy: [senderId],
      createdAt: now.toDate(),
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
          lastMessage: data.lastMessage,
          lastMessageAt: toDate(data.lastMessageAt),
          lastMessageBy: data.lastMessageBy,
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
