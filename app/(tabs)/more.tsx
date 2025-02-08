import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import * as Haptics from 'expo-haptics';

interface MoreOptionProps {
  icon: string;
  title: string;
  onPress: () => void;
}

function MoreOption({ icon, title, onPress }: MoreOptionProps) {
  return (
    <TouchableOpacity 
      style={styles.option}
      onPress={() => {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress();
      }}
    >
      <Ionicons name={icon as any} size={24} color={Colors.text.primary} />
      <Text style={styles.optionText}>{title}</Text>
      <Ionicons name="chevron-forward" size={20} color={Colors.text.dim} />
    </TouchableOpacity>
  );
}

export default function MoreScreen() {
  const { signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>More Options</Text>
      
      <MoreOption
        icon="person-circle-outline"
        title="Profile"
        onPress={() => router.push('/(more)/profile')}
      />
      
      <MoreOption
        icon="trophy-outline"
        title="Achievements"
        onPress={() => router.push('/(more)/achievements')}
      />
      
      <MoreOption
        icon="settings-outline"
        title="Settings"
        onPress={() => router.push('/(more)/settings')}
      />
      
      <MoreOption
        icon="log-out-outline"
        title="Logout"
        onPress={signOut}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.light,
    padding: 16,
    paddingTop: 60,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    color: Colors.text.primary,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  optionText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: Colors.text.primary,
  },
}); 