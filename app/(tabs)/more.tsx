import { View, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  useAnimatedGestureHandler,
  runOnJS,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { useEffect } from 'react';

const SCREEN_HEIGHT = 600; // Approximate screen height
const MAX_TRANSLATE_Y = -SCREEN_HEIGHT + 100;
const MIN_TRANSLATE_Y = -50;

type MenuItem = {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
};

const menuItems: MenuItem[] = [
  {
    id: 'profile',
    title: 'Profile',
    icon: 'person',
    route: '/(more)/profile',
  },
  {
    id: 'discussions',
    title: 'Discussions',
    icon: 'chatbubbles',
    route: '/(more)/discussions',
  },
  {
    id: 'achievements',
    title: 'Achievements',
    icon: 'trophy',
    route: '/(more)/achievements',
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: 'settings',
    route: '/(more)/settings',
  },
];

export default function MoreScreen() {
  const { signOut } = useAuth();
  const pathname = usePathname();
  const translateY = useSharedValue(0);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    if (pathname === '/more') {
      translateY.value = withSpring(-300, {
        damping: 50,
        stiffness: 300,
      });
    }
  }, [pathname]);

  const scrollTo = (destination: number) => {
    'worklet';
    translateY.value = withSpring(destination, {
      damping: 50,
      stiffness: 300,
    });
  };

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: any) => {
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx) => {
      const newTranslateY = ctx.startY + event.translationY;
      translateY.value = Math.max(MAX_TRANSLATE_Y, Math.min(MIN_TRANSLATE_Y, newTranslateY));
    },
    onEnd: (event) => {
      if (event.velocityY < -500) {
        scrollTo(MAX_TRANSLATE_Y);
      } else if (event.velocityY > 500) {
        scrollTo(0);
      } else {
        if (translateY.value < -SCREEN_HEIGHT / 2) {
          scrollTo(MAX_TRANSLATE_Y);
        } else {
          scrollTo(0);
        }
      }
    },
  });

  const rBottomSheetStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const handleMenuPress = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route);
  };

  const handleLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    signOut();
  };

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[
          styles.bottomSheet,
          rBottomSheetStyle,
          { backgroundColor: theme.modalBackground }
        ]}>
          <View style={[styles.line, { backgroundColor: theme.border }]} />
          <View style={styles.content}>
            <ThemedText type="title" style={styles.title}>More Options</ThemedText>
            
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuItem, { borderBottomColor: theme.border }]}
                onPress={() => handleMenuPress(item.route)}
              >
                <View style={[styles.menuIcon, { backgroundColor: theme.backgroundDim }]}>
                  <Ionicons name={item.icon} size={24} color={theme.primary} />
                </View>
                <ThemedText style={styles.menuText}>{item.title}</ThemedText>
                <Ionicons name="chevron-forward" size={24} color={theme.primary} />
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.menuItem, styles.logoutButton]}
              onPress={handleLogout}
            >
              <View style={[styles.menuIcon, { backgroundColor: theme.backgroundDim }]}>
                <Ionicons name="log-out" size={24} color={theme.error} />
              </View>
              <ThemedText style={[styles.menuText, { color: theme.error }]}>Logout</ThemedText>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bottomSheet: {
    height: SCREEN_HEIGHT,
    width: '100%',
    position: 'absolute',
    top: SCREEN_HEIGHT,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  line: {
    width: 40,
    height: 4,
    alignSelf: 'center',
    marginTop: 8,
    borderRadius: 2,
  },
  content: {
    padding: 20,
  },
  title: {
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
  },
  logoutButton: {
    marginTop: 20,
    borderBottomWidth: 0,
  },
}); 