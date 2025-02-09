import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Image } from 'react-native';
import { Stack } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// Types
interface Discussion {
  id: string;
  title: string;
  author: string;
  upvotes: number;
  messages: Message[];
  createdAt: Date;
}

interface Message {
  id: string;
  content: string;
  author: string;
  imageUrl?: string;
  createdAt: Date;
}

export default function DiscussionsScreen() {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [messageImage, setMessageImage] = useState<string | null>(null);

  const handleCreateDiscussion = () => {
    // Open modal or navigate to create discussion screen
  };

  const handleUpvote = (discussionId: string) => {
    // Handle upvote logic
  };

  const handleSendMessage = async () => {
    // Handle sending message with optional image
  };

  const pickImage = async () => {
    // Image picker logic
  };

  const renderDiscussionItem = ({ item }: { item: Discussion }) => (
    <TouchableOpacity 
      onPress={() => setSelectedDiscussion(item)}
      className="p-4 bg-white rounded-lg mb-2 shadow-sm"
    >
      <View className="flex-row justify-between items-center">
        <Text className="font-bold text-lg">{item.title}</Text>
        <TouchableOpacity
          onPress={() => handleUpvote(item.id)}
          className="flex-row items-center"
        >
          <FontAwesome name="thumbs-up" size={16} color="#666" />
          <Text className="ml-1">{item.upvotes}</Text>
        </TouchableOpacity>
      </View>
      <Text className="text-gray-500 mt-1">Posted by {item.author}</Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-100">
      <Stack.Screen 
        options={{
          title: "Discussions",
          headerRight: () => (
            <TouchableOpacity onPress={handleCreateDiscussion}>
              <FontAwesome name="plus" size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }} 
      />

      {/* Search Bar */}
      <View className="p-4">
        <TextInput
          placeholder="Search discussions..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          className="bg-white p-3 rounded-lg"
        />
      </View>

      {!selectedDiscussion ? (
        // Discussions List
        <FlatList
          data={discussions}
          renderItem={renderDiscussionItem}
          keyExtractor={(item) => item.id}
          className="px-4"
        />
      ) : (
        // Selected Discussion View
        <View className="flex-1">
          <View className="flex-1 px-4">
            <FlatList
              data={selectedDiscussion.messages}
              renderItem={({ item: message }) => (
                <View className="bg-white p-3 rounded-lg mb-2">
                  <Text className="font-semibold">{message.author}</Text>
                  {message.imageUrl && (
                    <Image
                      source={{ uri: message.imageUrl }}
                      className="w-full h-48 rounded-lg mt-2"
                      resizeMode="cover"
                    />
                  )}
                  <Text className="mt-1">{message.content}</Text>
                </View>
              )}
              keyExtractor={(message) => message.id}
            />
          </View>

          {/* Message Input */}
          <View className="p-4 bg-white border-t border-gray-200">
            <View className="flex-row items-center">
              <TextInput
                placeholder="Type a message..."
                value={newMessage}
                onChangeText={setNewMessage}
                className="flex-1 bg-gray-100 p-3 rounded-lg mr-2"
                multiline
              />
              <TouchableOpacity onPress={pickImage}>
                <FontAwesome name="image" size={24} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleSendMessage}
                className="ml-2"
              >
                <FontAwesome name="send" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>
            {messageImage && (
              <Image
                source={{ uri: messageImage }}
                className="w-20 h-20 mt-2 rounded"
              />
            )}
          </View>
        </View>
      )}
    </View>
  );
}
