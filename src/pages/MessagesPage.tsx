import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Search, Paperclip, Send, Image, Video, File, Heart, Share2, Smile, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { auth, db, storage } from '@/config/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, getDocs, updateDoc, doc, limit, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getUserProfile } from '@/services/firebaseService';
import DonationModal from '@/components/donations/DonationModal';
import { toast } from 'sonner';

type MessageType = 'text' | 'image' | 'video' | 'document';

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  read: boolean;
  type: MessageType;
  fileUrl?: string;
  fileName?: string;
  caption?: string;
}

interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageTimestamp: Date;
  unreadCount: number;
  userDetails?: {
    displayName: string;
    photoURL: string;
    isOnline: boolean;
    lastSeen?: Date;
  };
}

interface User {
  uid: string;
  displayName?: string;
  username?: string;
  email?: string;
  photoURL?: string;
  isOnline?: boolean;
  lastSeen?: Date;
  bio?: string;
  followers?: string[];
  following?: string[];
}

const MessagesPage: React.FC = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAttachOptions, setShowAttachOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({});

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Get current user
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch conversations for the current user
  useEffect(() => {
    if (!user) return;

    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageTimestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const conversationsData: Conversation[] = [];
      
      for (const doc of snapshot.docs) {
        const conversation = doc.data() as Conversation;
        conversation.id = doc.id;
        
        // Get the other participant's details
        const otherParticipantId = conversation.participants.find(id => id !== user.uid);
        if (otherParticipantId) {
          const userDetails = await getUserProfile(otherParticipantId);
          if (userDetails) {
            conversation.userDetails = {
              displayName: userDetails.displayName || 'Unknown User',
              photoURL: userDetails.photoURL || '/default-avatar.png',
              isOnline: userDetails.isOnline || false,
              lastSeen: userDetails.lastSeen
            };
          }
        }
        
        conversationsData.push(conversation);
      }
      
      setConversations(conversationsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

    const messagesRef = collection(db, `conversations/${selectedConversation.id}/messages`);
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    // Set up a real-time listener for messages
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => {
        const data = doc.data();
        // Convert Firestore timestamps to Date objects
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp ? new Date(data.timestamp.seconds * 1000) : new Date()
        };
      }) as Message[];
      
      setMessages(messagesData);
      
      // Mark messages as read if they're from the other user
      snapshot.docChanges().forEach(async change => {
        if (change.type === 'added') {
          const message = change.doc.data();
          if (message.senderId !== user.uid && !message.read) {
            await updateDoc(doc(messagesRef, change.doc.id), {
              read: true
            });
            
            // Update unread count in conversation
            if (selectedConversation) {
              await updateDoc(doc(db, 'conversations', selectedConversation.id), {
                unreadCount: 0
              });
            }
          }
        }
      });
    });

    return () => unsubscribe();
  }, [selectedConversation, user]);

  // Handle clicking outside the emoji picker
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !fileInputRef.current?.files?.length) return;
    if (!user || !selectedConversation) return;

    try {
      // Get the other user's ID from the conversation participants
      const otherUserId = selectedConversation.participants.find(id => id !== user.uid);
      if (!otherUserId) {
        throw new Error('Cannot find the other participant');
      }

      const messagesRef = collection(db, `conversations/${selectedConversation.id}/messages`);
      
      // Add the message document
      const messageData = {
        senderId: user.uid,
        text: newMessage,
        timestamp: serverTimestamp(),
        read: false,
        type: 'text'
      };
      
      await addDoc(messagesRef, messageData);

      // Update last message in conversation document and increment unread count for other user
      await updateDoc(doc(db, 'conversations', selectedConversation.id), {
        lastMessage: newMessage,
        lastMessageTimestamp: serverTimestamp(),
        // Increment unread count for the recipient
        unreadCount: selectedConversation.unreadCount + 1
      });

      setNewMessage('');
      
      console.log('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    }
  };

  const handleFileUpload = async (type: MessageType, file: File) => {
    if (!user || !selectedConversation) return;
    
    try {
      setLoading(true);
      
      // Upload file to Firebase Storage
      const storageRef = ref(storage, `messages/${selectedConversation.id}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      // Get the other user's ID from the conversation participants
      const otherUserId = selectedConversation.participants.find(id => id !== user.uid);
      if (!otherUserId) {
        throw new Error('Cannot find the other participant');
      }
      
      // Add message with file reference
      const messagesRef = collection(db, `conversations/${selectedConversation.id}/messages`);
      
      await addDoc(messagesRef, {
        senderId: user.uid,
        text: newMessage, // Optional caption
        timestamp: serverTimestamp(),
        read: false,
        type,
        fileUrl: downloadURL,
        fileName: file.name
      });
      
      // Update last message in conversation
      const lastMessageText = type === 'image' 
        ? '📷 Photo' 
        : type === 'video' 
          ? '📹 Video'
          : '📄 Document';
          
      // Update the conversation document directly
      await updateDoc(doc(db, 'conversations', selectedConversation.id), {
        lastMessage: lastMessageText,
        lastMessageTimestamp: serverTimestamp(),
        // Increment unread count for recipient
        unreadCount: selectedConversation.unreadCount + 1
      });
      
      setNewMessage('');
      setShowAttachOptions(false);
      setLoading(false);
      
      console.log(`${type} uploaded successfully`);
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      toast.error(`Failed to upload ${type}. Please try again.`);
      setLoading(false);
    }
  };

  const handleAttachmentClick = (type: 'image' | 'video' | 'document') => {
    if (type === 'image') imageInputRef.current?.click();
    else if (type === 'video') videoInputRef.current?.click();
    else fileInputRef.current?.click();
    
    setShowAttachOptions(false);
  };

  const formatTime = (timestamp: Date) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const messageDate = new Date(timestamp);
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) return t('messaging.justNow');
    if (diffMins < 60) return `${diffMins} ${t('messaging.minutesAgo')}`;
    
    const hours = messageDate.getHours();
    const minutes = messageDate.getMinutes();
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const filteredConversations = conversations.filter(convo => 
    convo.userDetails?.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderMessage = (message: Message) => {
    const isCurrentUser = message.senderId === user?.uid;
    
    return (
      <div 
        className={`flex mb-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
      >
        <div 
          className={`max-w-[70%] ${
            isCurrentUser 
              ? 'bg-blue-500 text-white rounded-tl-lg rounded-tr-lg rounded-bl-lg' 
              : 'bg-gray-200 dark:bg-gray-700 rounded-tl-lg rounded-tr-lg rounded-br-lg'
          } px-3 py-2 break-words`}
        >
          {message.type === 'text' && (
            <p>{message.text}</p>
          )}
          
          {message.type === 'image' && (
            <div className="space-y-2">
              <img 
                src={message.fileUrl} 
                alt="Image" 
                className="rounded max-w-full cursor-pointer"
                onClick={() => window.open(message.fileUrl, '_blank')}
              />
              {message.text && <p className="text-sm">{message.text}</p>}
            </div>
          )}
          
          {message.type === 'video' && (
            <div className="space-y-2">
              <video 
                src={message.fileUrl} 
                controls
                className="rounded max-w-full"
              />
              {message.text && <p className="text-sm">{message.text}</p>}
            </div>
          )}
          
          {message.type === 'document' && (
            <div className="flex items-center space-x-2">
              <File className="h-5 w-5" />
              <a 
                href={message.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {message.fileName || 'Document'}
              </a>
            </div>
          )}
          
          <div className={`text-xs mt-1 ${isCurrentUser ? 'text-blue-200' : 'text-gray-500'}`}>
            {formatTime(message.timestamp)}
          </div>
        </div>
      </div>
    );
  };

  const handleEmojiClick = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };
  
  const searchUsers = async () => {
    if (!userSearchTerm.trim()) return;
    
    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      
      // Get all users and filter client-side for flexibility
      const snapshot = await getDocs(usersRef);
      
      // Get current user's following list
      const currentUserDoc = await getDoc(doc(db, 'users', user?.uid));
      const currentUserData = currentUserDoc.data();
      const following = currentUserData?.following || [];
      
      // Filter results by search term across multiple fields
      const searchTermLower = userSearchTerm.toLowerCase();
      const users = snapshot.docs
        .map(doc => {
          const userData = doc.data();
          return {
            id: doc.id,
            uid: userData.uid || doc.id, // Ensure we have a uid for searching
            username: userData.username || '',
            displayName: userData.displayName || userData.username || '',
            email: userData.email || '',
            photoURL: userData.photoURL || '',
            bio: userData.bio || '',
            isFollowing: following.includes(userData.uid || doc.id)
          };
        })
        .filter(user => {
          // Don't include the current user in results
          if (user.uid === auth.currentUser?.uid) return false;
          
          // Search across multiple fields
          return (
            user.username.toLowerCase().includes(searchTermLower) ||
            user.displayName.toLowerCase().includes(searchTermLower) ||
            user.email.toLowerCase().includes(searchTermLower) ||
            user.uid.toLowerCase().includes(searchTermLower)
          );
        })
        .slice(0, 10); // Limit results to 10 users
      
      console.log('Search results:', users);
      setSearchResults(users);
      setLoading(false);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users. Please try again.');
      setLoading(false);
    }
  };
  
  const handleFollow = async (userId: string) => {
    if (!user) return;
    
    try {
      setFollowLoading(prev => ({ ...prev, [userId]: true }));
      
      // Get current user document
      const currentUserRef = doc(db, 'users', user.uid);
      const currentUserDoc = await getDoc(currentUserRef);
      const currentUserData = currentUserDoc.data() || {};
      
      // Get target user document
      const targetUserRef = doc(db, 'users', userId);
      const targetUserDoc = await getDoc(targetUserRef);
      const targetUserData = targetUserDoc.data() || {};
      
      // Check if already following
      const following = currentUserData.following || [];
      const isFollowing = following.includes(userId);
      
      if (isFollowing) {
        // Unfollow: Remove from current user's following and target user's followers
        await updateDoc(currentUserRef, {
          following: following.filter(id => id !== userId)
        });
        
        const targetFollowers = targetUserData.followers || [];
        await updateDoc(targetUserRef, {
          followers: targetFollowers.filter(id => id !== user.uid)
        });
        
        toast.success('User unfollowed successfully');
      } else {
        // Follow: Add to current user's following and target user's followers
        await updateDoc(currentUserRef, {
          following: [...following, userId]
        });
        
        const targetFollowers = targetUserData.followers || [];
        await updateDoc(targetUserRef, {
          followers: [...targetFollowers, user.uid]
        });
        
        toast.success('User followed successfully');
      }
      
      // Update local state to reflect the change
      setSearchResults(prev => 
        prev.map(result => 
          result.uid === userId ? { ...result, isFollowing: !isFollowing } : result
        )
      );
      
      setFollowLoading(prev => ({ ...prev, [userId]: false }));
    } catch (error) {
      console.error('Error following user:', error);
      toast.error('Failed to follow user. Please try again.');
      setFollowLoading(prev => ({ ...prev, [userId]: false }));
    }
  };
  
  const startNewConversation = async (userId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      console.log("Starting conversation with user ID:", userId);
      
      // Check if conversation already exists
      const conversationsRef = collection(db, 'conversations');
      const q = query(
        conversationsRef,
        where('participants', 'array-contains', user.uid)
      );
      const querySnapshot = await getDocs(q);
      
      let existingConversation = null;
      
      querySnapshot.forEach(doc => {
        const conversation = doc.data();
        if (conversation.participants.includes(userId)) {
          existingConversation = {
            id: doc.id,
            ...conversation
          };
        }
      });
      
      if (existingConversation) {
        console.log("Found existing conversation:", existingConversation.id);
        setSelectedConversation(existingConversation as Conversation);
      } else {
        // Create new conversation
        const userProfile = await getUserProfile(userId);
        
        if (!userProfile) {
          // Try to get directly from users collection by ID in case uid is different
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (!userDoc.exists()) {
            toast.error("Could not find user details");
            setLoading(false);
            return;
          }
          
          const userData = userDoc.data();
          // Create conversation with direct user ID
          console.log("Creating conversation with user from direct lookup:", userData);
          
          // Create the conversation document
          const newConversationRef = await addDoc(conversationsRef, {
            participants: [user.uid, userId],
            lastMessage: 'New conversation started',
            lastMessageTimestamp: serverTimestamp(),
            unreadCount: 0
          });
          
          console.log("Created conversation with ID:", newConversationRef.id);
          
          // Create conversation with available user data
          const newConversation = {
            id: newConversationRef.id,
            participants: [user.uid, userId],
            lastMessage: 'New conversation started',
            lastMessageTimestamp: new Date(),
            unreadCount: 0,
            userDetails: {
              displayName: userData?.displayName || userData?.username || 'Unknown User',
              photoURL: userData?.photoURL || '/default-avatar.png',
              isOnline: userData?.isOnline || false,
              lastSeen: userData?.lastSeen
            }
          };
          
          // Add message and update state
          const messagesRef = collection(db, `conversations/${newConversationRef.id}/messages`);
          await addDoc(messagesRef, {
            senderId: user.uid,
            text: 'Hi there!',
            timestamp: serverTimestamp(),
            read: false,
            type: 'text'
          });
          
          toast.success(`Started a conversation with ${newConversation.userDetails.displayName}`);
          setSelectedConversation(newConversation);
          setConversations(prev => [newConversation, ...prev]);
        } else {
          // Create conversation with found user profile
          console.log("Creating conversation with user from profile lookup:", userProfile);
          
          // Create the conversation document
          const newConversationRef = await addDoc(conversationsRef, {
            participants: [user.uid, userId],
            lastMessage: 'New conversation started',
            lastMessageTimestamp: serverTimestamp(),
            unreadCount: 0
          });
          
          console.log("Created conversation with ID:", newConversationRef.id);
          
          // Create new conversation object
          const newConversation = {
            id: newConversationRef.id,
            participants: [user.uid, userId],
            lastMessage: 'New conversation started',
            lastMessageTimestamp: new Date(),
            unreadCount: 0,
            userDetails: {
              displayName: userProfile?.displayName || userProfile?.username || 'Unknown User',
              photoURL: userProfile?.photoURL || '/default-avatar.png',
              isOnline: userProfile?.isOnline || false,
              lastSeen: userProfile?.lastSeen
            }
          };
          
          // Add initial message to start the conversation
          const messagesRef = collection(db, `conversations/${newConversationRef.id}/messages`);
          await addDoc(messagesRef, {
            senderId: user.uid,
            text: 'Hi there!',
            timestamp: serverTimestamp(),
            read: false,
            type: 'text'
          });
          
          // Let user know the conversation was created
          toast.success(`Started a conversation with ${newConversation.userDetails.displayName}`);
          
          // Update state with new conversation
          setSelectedConversation(newConversation);
          setConversations(prev => [newConversation, ...prev]);
        }
      }
      
      // Close new conversation modal
      setShowNewConversation(false);
      setUserSearchTerm('');
      setSearchResults([]);
      setLoading(false);
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Failed to create conversation. Please try again.');
      setLoading(false);
    }
  };

  // Add a function to handle keyboard events for sending messages
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="container mx-auto py-6 h-[calc(100vh-80px)]">
      <div className="grid grid-cols-12 gap-4 h-full">
        {/* Conversations List */}
        <div className="col-span-12 md:col-span-4 lg:col-span-3 h-full">
          <Card className="h-full flex flex-col">
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold mb-2">{t('messaging.title')}</h2>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder={t('messaging.searchConversation')}
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setShowNewConversation(true)}
                  className="flex-shrink-0"
                >
                  <UserPlus className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {/* New Conversation Modal */}
            {showNewConversation && (
              <div className="absolute z-10 left-0 top-0 w-full h-full bg-background/90">
                <div className="max-w-md mx-auto mt-20 p-4 bg-card border rounded-lg shadow-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">{t('messaging.newMessage')}</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setShowNewConversation(false);
                        setUserSearchTerm('');
                        setSearchResults([]);
                      }}
                    >
                      ✕
                    </Button>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center space-x-2">
                      <Input
                        placeholder={t('messaging.searchByName')}
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                        className="flex-grow"
                        disabled={loading}
                      />
                      <Button 
                        onClick={searchUsers} 
                        disabled={loading || !userSearchTerm.trim()}
                        className="flex-shrink-0"
                      >
                        {loading ? 
                          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" /> :
                          <Search className="h-4 w-4" />
                        }
                      </Button>
                    </div>
                    {userSearchTerm.trim() && searchResults.length === 0 && !loading && (
                      <p className="text-xs text-muted-foreground mt-1">
                        No users found matching "{userSearchTerm}". Try a different search term.
                      </p>
                    )}
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto">
                    {loading ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                      </div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((user) => (
                        <div 
                          key={user.id} 
                          className="flex items-center p-3 hover:bg-muted rounded cursor-pointer border-b"
                          onClick={() => startNewConversation(user.uid || user.id)}
                        >
                          <Avatar className="mr-3 h-10 w-10">
                            <AvatarImage src={user.photoURL} alt={user.displayName || user.username || ''} />
                            <AvatarFallback>{(user.displayName?.[0] || user.username?.[0] || 'U').toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-grow min-w-0">
                            <p className="font-medium truncate">{user.displayName || user.username || 'Unknown User'}</p>
                            {user.email && (
                              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            )}
                            {user.bio && (
                              <p className="text-xs text-muted-foreground truncate">{user.bio.substring(0, 30)}{user.bio.length > 30 ? '...' : ''}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 ml-2">
                            <Button 
                              variant={user.isFollowing ? "default" : "outline"} 
                              size="sm" 
                              className="text-xs px-2 py-0 h-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFollow(user.uid || user.id);
                              }}
                              disabled={followLoading[user.uid || user.id]}
                            >
                              {followLoading[user.uid || user.id] ? (
                                <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                              ) : (
                                <>{user.isFollowing ? 'Unfollow' : 'Follow'}</>
                              )}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                startNewConversation(user.uid || user.id);
                              }}
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : userSearchTerm.trim() ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No users found matching "{userSearchTerm}"</p>
                        <p className="text-xs mt-2">Try a different search term or check spelling</p>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Search for users to start a conversation</p>
                        <p className="text-xs mt-2">Try searching by name, email, or user ID</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <p>{t('common.loading')}</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <p>{t('messaging.noMessages')}</p>
                  <p className="mt-2 text-sm">{t('messaging.startConversation')}</p>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-3 border-b cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center space-x-3 ${
                      selectedConversation?.id === conversation.id ? 'bg-gray-100 dark:bg-gray-800' : ''
                    }`}
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <div className="relative">
                      <Avatar>
                        <AvatarImage src={conversation.userDetails?.photoURL} alt={conversation.userDetails?.displayName || ''} />
                        <AvatarFallback>{conversation.userDetails?.displayName?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      {conversation.userDetails?.isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium truncate">{conversation.userDetails?.displayName}</h3>
                        <span className="text-xs text-gray-500">
                          {conversation.lastMessageTimestamp && formatTime(conversation.lastMessageTimestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{conversation.lastMessage}</p>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <Badge variant="default" className="bg-blue-500 text-white">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="col-span-12 md:col-span-8 lg:col-span-9 h-full">
          {selectedConversation ? (
            <Card className="h-full flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={selectedConversation.userDetails?.photoURL} alt={selectedConversation.userDetails?.displayName || ''} />
                    <AvatarFallback>{selectedConversation.userDetails?.displayName?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{selectedConversation.userDetails?.displayName}</h3>
                    <p className="text-xs text-gray-500">
                      {selectedConversation.userDetails?.isOnline ? (
                        t('messaging.online')
                      ) : selectedConversation.userDetails?.lastSeen ? (
                        `${t('messaging.lastSeen')} ${formatTime(selectedConversation.userDetails.lastSeen)}`
                      ) : (
                        t('messaging.offline')
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <DonationModal 
                    buttonText={t('donation.donate')} 
                    buttonVariant="outline" 
                    buttonClassName="text-xs px-3 py-1 h-8" 
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs px-3 py-1 h-8"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: `Chat with ${selectedConversation.userDetails?.displayName || 'User'}`,
                          text: `Join my conversation with ${selectedConversation.userDetails?.displayName || 'User'} on Zoophie`,
                          url: window.location.href,
                        }).catch(error => console.error('Error sharing', error));
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success('Link copied to clipboard!');
                      }
                    }}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    {t('common.share')}
                  </Button>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Search className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {t('messaging.viewProfile')}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center text-center text-gray-500">
                    <p>{t('messaging.startConversation')}</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <React.Fragment key={message.id}>
                      {renderMessage(message)}
                    </React.Fragment>
                  ))
                )}
                <div ref={messageEndRef} />
              </div>

              {/* Message Input */}
              <div className="flex items-center p-3 border-t">
                <div className="flex items-center space-x-2 mr-2">
                  <div className="relative">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setShowAttachOptions(!showAttachOptions)}
                            className="rounded-full"
                          >
                            <Paperclip className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {t('messaging.attach')}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    {showAttachOptions && (
                      <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-2 flex flex-col space-y-2 border z-10">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="flex items-center justify-start space-x-2"
                          onClick={() => handleAttachmentClick('image')}
                        >
                          <Image className="h-4 w-4" />
                          <span>{t('messaging.photo')}</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="flex items-center justify-start space-x-2"
                          onClick={() => handleAttachmentClick('video')}
                        >
                          <Video className="h-4 w-4" />
                          <span>{t('messaging.video')}</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="flex items-center justify-start space-x-2"
                          onClick={() => handleAttachmentClick('document')}
                        >
                          <File className="h-4 w-4" />
                          <span>{t('messaging.file')}</span>
                        </Button>
                      </div>
                    )}
                    
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload('document', e.target.files[0]);
                        }
                      }}
                    />
                    <input
                      type="file"
                      ref={imageInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload('image', e.target.files[0]);
                        }
                      }}
                    />
                    <input
                      type="file"
                      ref={videoInputRef}
                      className="hidden"
                      accept="video/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload('video', e.target.files[0]);
                        }
                      }}
                    />
                  </div>
                  
                  <div className="relative">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="rounded-full"
                          >
                            <Smile className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {t('messaging.emoji')}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    {showEmojiPicker && (
                      <div 
                        ref={emojiPickerRef} 
                        className="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-2 border grid grid-cols-8 gap-1 max-h-[200px] overflow-y-auto w-[250px] z-10"
                      >
                        {["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", 
                          "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", 
                          "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", 
                          "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", 
                          "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", 
                          "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤔", 
                          "🤗", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", 
                          "😦", "😧", "😮", "😲", "😴", "🤤", "😪", "😵", "🤐", "🥴", 
                          "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "💩", "👎", 
                          "👏", "🙌", "👐", "🤲", "🤝", "❤️", "🧡", "💛", 
                          "💚", "💙", "💜", "🖤", "🤎", "🤍", "🔥", "💯", "💢", "💫"].map((emoji, index) => (
                          <button 
                            key={`emoji-${index}-${emoji}`}
                            className="text-xl hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded cursor-pointer"
                            onClick={() => handleEmojiClick(emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t('messages.type_message')}
                  className="flex-grow mr-2"
                  onKeyDown={handleKeyDown}
                />
                <Button onClick={handleSendMessage} size="icon" className="bg-primary">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center p-4">
                <h3 className="text-xl font-medium mb-2">{t('messaging.title')}</h3>
                <p className="text-gray-500">{t('messaging.startConversation')}</p>
                <Button 
                  className="mt-4"
                  onClick={() => setShowNewConversation(true)}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  {t('messaging.newMessage')}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;