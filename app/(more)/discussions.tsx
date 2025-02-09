import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, FlatList, TouchableOpacity, Image, Alert, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';

// Types
interface Discussion {
  id: string;
  title: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  content: string;
  upvotes: number;
  messages: Message[];
  createdAt: Date;
  hasUserUpvoted?: boolean;
}

interface Message {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  imageUrl?: string;
  createdAt: Date;
}

const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays}d ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}mo ago`;
  }
  
  return `${Math.floor(diffInMonths / 12)}y ago`;
};

export default function DiscussionsScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [messageImage, setMessageImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Create dynamic styles using theme
  const dynamicStyles = {
    discussionViewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      paddingTop: 8,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0, 0, 0, 0.1)',
      backgroundColor: theme.background,
    },
  };

  useEffect(() => {
    loadDiscussions();
  }, []);

  const loadDiscussions = async () => {
    try {
      setIsLoading(true);
      // TODO: Replace with actual API call
      const mockDiscussions: Discussion[] = [
        {
          id: '1',
          title: 'Best spots for rare Pokémon',
          content: 'Looking for recommendations on where to find rare Pokémon in the area.',
          author: {
            id: '1',
            name: 'Ash Ketchum',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ash',
          },
          upvotes: 15,
          messages: [],
          createdAt: new Date('2024-03-10'),
          hasUserUpvoted: false,
        },
        // Add more mock discussions
      ];
      setDiscussions(mockDiscussions);
    } catch (error) {
      console.error('Error loading discussions:', error);
      Alert.alert('Error', 'Failed to load discussions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDiscussion = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/create-discussion');
  };

  const handleUpvote = async (discussionId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    try {
      // TODO: Implement upvote API call
      setDiscussions(prev => prev.map(d => {
        if (d.id === discussionId) {
          return {
            ...d,
            upvotes: d.hasUserUpvoted ? d.upvotes - 1 : d.upvotes + 1,
            hasUserUpvoted: !d.hasUserUpvoted,
          };
        }
        return d;
      }));
    } catch (error) {
      console.error('Error upvoting:', error);
      Alert.alert('Error', 'Failed to upvote discussion');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !messageImage) {
      Alert.alert('Error', 'Please enter a message or attach an image');
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      // TODO: Implement send message API call
      const newMsg: Message = {
        id: Date.now().toString(),
        content: newMessage.trim(),
        author: {
          id: user!.id,
          name: user!.email!.split('@')[0],
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
        },
        imageUrl: messageImage || undefined,
        createdAt: new Date(),
      };

      setSelectedDiscussion(prev => prev ? {
        ...prev,
        messages: [...prev.messages, newMsg],
      } : null);

      setNewMessage('');
      setMessageImage(null);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0].uri) {
        setMessageImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const renderDiscussionItem = ({ item }: { item: Discussion }) => (
    <Animated.View entering={FadeIn}>
      <TouchableOpacity 
        onPress={() => setSelectedDiscussion(item)}
        activeOpacity={0.7}
      >
        <Card style={styles.discussionCard}>
          <View style={styles.discussionHeader}>
            <Image
              source={{ uri: item.author.avatar }}
              style={styles.authorAvatar}
            />
            <View style={styles.discussionInfo}>
              <ThemedText style={styles.discussionTitle}>{item.title}</ThemedText>
              <View style={styles.authorInfo}>
                <ThemedText style={styles.authorName}>{item.author.name}</ThemedText>
                <ThemedText style={styles.discussionDate}>
                  {formatTimeAgo(item.createdAt)}
                </ThemedText>
              </View>
            </View>
          </View>
          
          <ThemedText style={styles.discussionContent} numberOfLines={2}>
            {item.content}
          </ThemedText>

          <View style={styles.discussionFooter}>
            <TouchableOpacity
              onPress={() => handleUpvote(item.id)}
              style={[
                styles.upvoteButton,
                item.hasUserUpvoted && styles.upvoteButtonActive
              ]}
            >
              <Ionicons 
                name={item.hasUserUpvoted ? "heart" : "heart-outline"}
                size={20}
                color={item.hasUserUpvoted ? theme.error : theme.text}
              />
              <ThemedText style={styles.upvoteCount}>{item.upvotes}</ThemedText>
            </TouchableOpacity>

            <View style={styles.messageCount}>
              <Ionicons name="chatbubble-outline" size={20} color={theme.textDim} />
              <ThemedText style={styles.messageCountText}>
                {item.messages.length}
              </ThemedText>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen 
        options={{
          headerShown: false,
        }} 
      />

      <LinearGradient
        colors={[theme.primary, theme.backgroundDim]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <ThemedText style={styles.headerTitle} color="#FFFFFF">
              Discussions
            </ThemedText>
            <ThemedText style={styles.headerSubtitle} color="rgba(255, 255, 255, 0.9)">
              Connect with other trainers
            </ThemedText>
          </View>
          <TouchableOpacity
            onPress={handleCreateDiscussion}
            style={styles.createButton}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {!selectedDiscussion ? (
        <View style={styles.content}>
          <Card style={styles.searchCard}>
            <Ionicons name="search" size={20} color={theme.textDim} />
            <TextInput
              placeholder="Search discussions..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[styles.searchInput, { color: theme.text }]}
              placeholderTextColor={theme.textDim}
            />
          </Card>

          <FlatList
            data={discussions}
            renderItem={renderDiscussionItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.discussionsList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      ) : (
        <View style={styles.discussionView}>
          <View style={[styles.discussionViewHeader, dynamicStyles.discussionViewHeader]}>
            <TouchableOpacity
              onPress={() => setSelectedDiscussion(null)}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <ThemedText style={styles.discussionViewTitle}>
              {selectedDiscussion.title}
            </ThemedText>
          </View>

          <FlatList
            data={selectedDiscussion.messages}
            renderItem={({ item: message }) => (
              <Card style={styles.messageCard}>
                <View style={styles.messageHeader}>
                  <Image
                    source={{ uri: message.author.avatar }}
                    style={styles.messageAvatar}
                  />
                  <View>
                    <ThemedText style={styles.messageSender}>
                      {message.author.name}
                    </ThemedText>
                    <ThemedText style={styles.messageTime}>
                      {formatTimeAgo(message.createdAt)}
                    </ThemedText>
                  </View>
                </View>
                
                <ThemedText style={styles.messageContent}>
                  {message.content}
                </ThemedText>

                {message.imageUrl && (
                  <Image
                    source={{ uri: message.imageUrl }}
                    style={styles.messageImage}
                    resizeMode="cover"
                  />
                )}
              </Card>
            )}
            keyExtractor={(message) => message.id}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
          />

          <Card style={styles.inputContainer}>
            {messageImage && (
              <View style={styles.imagePreview}>
                <Image
                  source={{ uri: messageImage }}
                  style={styles.previewImage}
                />
                <TouchableOpacity
                  onPress={() => setMessageImage(null)}
                  style={styles.removeImageButton}
                >
                  <Ionicons name="close-circle" size={24} color={theme.error} />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.inputRow}>
              <TextInput
                placeholder="Type a message..."
                value={newMessage}
                onChangeText={setNewMessage}
                style={[styles.messageInput, { color: theme.text }]}
                placeholderTextColor={theme.textDim}
                multiline
              />
              <TouchableOpacity onPress={pickImage} style={styles.attachButton}>
                <Ionicons name="image" size={24} color={theme.primary} />
              </TouchableOpacity>
              <Button
                onPress={handleSendMessage}
                style={styles.sendButton}
              >
                <Ionicons name="send" size={20} color="#FFFFFF" />
              </Button>
            </View>
          </Card>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  header: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 20 : 16,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    // marginTop: 15,
    paddingTop: 15,
    color: '#FFFFFF',
    flexShrink: 1,

  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.9,
    color: 'rgba(255, 255, 255, 0.9)',
    flexShrink: 1,
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  content: {
    flex: 1,
    padding: 16,
    marginTop: -16,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  discussionsList: {
    gap: 12,
  },
  discussionCard: {
    padding: 16,
  },
  discussionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  discussionInfo: {
    flex: 1,
  },
  discussionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 14,
    marginRight: 8,
    opacity: 0.8,
  },
  discussionDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  discussionContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  discussionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upvoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  upvoteButtonActive: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
  },
  upvoteCount: {
    marginLeft: 4,
    fontSize: 14,
  },
  messageCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  messageCountText: {
    marginLeft: 4,
    fontSize: 14,
    opacity: 0.7,
  },
  discussionView: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 50 : 30,
  },
  discussionViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    marginRight: 16,
  },
  discussionViewTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  messagesList: {
    padding: 16,
    gap: 12,
  },
  messageCard: {
    padding: 16,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageSender: {
    fontSize: 14,
    fontWeight: '600',
  },
  messageTime: {
    fontSize: 12,
    opacity: 0.6,
  },
  messageContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 8,
  },
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  imagePreview: {
    marginBottom: 8,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    marginRight: 8,
    padding: 8,
    fontSize: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 20,
  },
  attachButton: {
    padding: 8,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    padding: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DiscussionsScreen;
