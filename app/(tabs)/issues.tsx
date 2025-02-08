import { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import { router } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ThemedText';
import { Issue } from '@/types';
import { issueService } from '@/services/issueService';
import { Colors } from '@/constants/Colors';

export default function IssuesScreen() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIssues();
  }, []);

  const loadIssues = async () => {
    try {
      const data = await issueService.getAllIssues();
      setIssues(data);
    } catch (error) {
      console.error('Error loading issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderIssue = ({ item }: { item: Issue }) => (
    <Card 
      style={styles.issueCard}
      onPress={() => router.push(`/issue/${item.id}`)}
    >
      <ThemedText type="subtitle">{item.title}</ThemedText>
      <ThemedText style={styles.description}>{item.description}</ThemedText>
      <View style={styles.footer}>
        <ThemedText style={styles.status}>{item.status}</ThemedText>
        <ThemedText style={styles.date}>
          {new Date(item.created_at).toLocaleDateString()}
        </ThemedText>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={issues}
        renderItem={renderIssue}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        onRefresh={loadIssues}
        refreshing={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
  },
  issueCard: {
    marginBottom: 16,
    padding: 16,
  },
  description: {
    marginTop: 8,
    color: Colors.light.textDim,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  status: {
    color: Colors.light.primary,
    fontSize: 12,
  },
  date: {
    color: Colors.light.textDim,
    fontSize: 12,
  },
}); 