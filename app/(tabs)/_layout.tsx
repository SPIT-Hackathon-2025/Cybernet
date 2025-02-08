import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, TouchableOpacity, Platform, useColorScheme } from 'react-native';
import { HapticTab } from '@/components/HapticTab';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import * as Haptics from 'expo-haptics';
import Animated, { 
  FadeIn, 
  FadeOut,
  Layout,
  withSpring,
  useAnimatedStyle,
  withTiming
} from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';

// Define theme colors
const THEME = {
  primary: '#FF5D00', // Vibrant orange
  inactive: '#94A3B8', // Medium grey for inactive
};

const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);

function TabIcon({ iconName, color, focused }: { iconName: keyof typeof Ionicons.glyphMap; color: string; focused: boolean }) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { 
        scale: withSpring(focused ? 1.2 : 1, {
          mass: 1,
          damping: 15,
          stiffness: 200,
        })
      }
    ],
    opacity: withTiming(focused ? 1 : 0.7, { duration: 200 })
  }));

  return (
    <AnimatedIonicons 
      style={animatedStyle}
      name={focused ? iconName : `${iconName}-outline` as keyof typeof Ionicons.glyphMap}
      size={28} 
      color={color}
    />
  );
}

export default function TabLayout() {
  const { signOut } = useAuth();
  const colorScheme = useColorScheme();

  const handleMorePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/(more)');
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].primary,
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
        tabBarStyle: {
          height: 65,
          backgroundColor: Colors[colorScheme ?? 'light'].background,
          borderTopWidth: 1,
          borderTopColor: Colors[colorScheme ?? 'light'].border,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: 0,
          marginBottom: 4,
        },
        tabBarButton: (props) => <HapticTab {...props} />,
        headerShown: false,
        tabBarItemStyle: {
          paddingVertical: 4,
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon iconName="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="lost-found"
        options={{
          title: 'Lost & Found',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon iconName="search" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="quests"
        options={{
          title: 'Quests',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon iconName="trophy" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: 'Report',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon iconName="alert-circle" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon iconName="menu" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
