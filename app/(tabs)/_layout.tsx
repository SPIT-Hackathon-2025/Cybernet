import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

// Define theme colors
const THEME = {
  primary: '#FF5D00', // Vibrant orange
  secondary: '#FFB74D', // Light orange
  background: '#F8F9FA', // Light grey background
  surface: '#FFFFFF', // White surface
  inactive: '#94A3B8', // Medium grey for inactive
};

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: THEME.primary,
      tabBarInactiveTintColor: THEME.inactive,
      tabBarStyle: {
        height: 60,
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: THEME.surface,
        borderRadius: 16,
        paddingBottom: 6,
        paddingTop: 6,
        elevation: 0,
        borderTopWidth: 0,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 0,
      },
      headerShown: false,
      tabBarItemStyle: {
        paddingTop: 0,
        height: 48,
      },
    }}>
      <Tabs.Screen
        name="report"
        options={{
          title: 'Report',
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              padding: 4,
              backgroundColor: focused ? `${THEME.primary}10` : 'transparent',
              borderRadius: 8,
            }}>
              <Ionicons 
                name={focused ? "warning" : "warning-outline"} 
                size={24} 
                color={color}
                style={{ fontWeight: focused ? '900' : '400' }}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="lost-found"
        options={{
          title: 'Lost & Found',
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              padding: 4,
              backgroundColor: focused ? `${THEME.primary}10` : 'transparent',
              borderRadius: 8,
            }}>
              <Ionicons 
                name={focused ? "search-circle" : "search-circle-outline"} 
                size={26} 
                color={color}
                style={{ fontWeight: focused ? '900' : '400' }}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="quests"
        options={{
          title: 'Quests',
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              padding: 4,
              backgroundColor: focused ? `${THEME.primary}10` : 'transparent',
              borderRadius: 8,
            }}>
              <Ionicons 
                name={focused ? "trophy" : "trophy-outline"} 
                size={24} 
                color={color}
                style={{ fontWeight: focused ? '900' : '400' }}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              padding: 4,
              backgroundColor: focused ? `${THEME.primary}10` : 'transparent',
              borderRadius: 8,
            }}>
              <Ionicons 
                name={focused ? "person-circle" : "person-circle-outline"} 
                size={24} 
                color={color}
                style={{ fontWeight: focused ? '900' : '400' }}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
