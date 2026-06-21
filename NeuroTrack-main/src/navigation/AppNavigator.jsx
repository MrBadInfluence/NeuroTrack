/**
 * AppNavigator.jsx — Root Navigation Structure
 *
 * Mirrors the webapp layout exactly:
 *   - Top header bar:  "NeuroTrack" title  |  profile avatar/icon (top-right)
 *   - Bottom tab bar:  Dashboard · Seizures · Medications · Reminders  (4 tabs only)
 *   - Profile is a stack screen, accessed via the top-right avatar button
 *
 * Swipe gestures (on any tab screen):
 *   - Swipe LEFT  → next tab
 *   - Swipe RIGHT → previous tab
 *   - Swipe UP from the bottom tab bar → Profile screen
 *
 * Structure:
 *   RootStack (Stack.Navigator, no header)
 *   └── MainTabs  (Bottom Tab Navigator — carries the shared header)
 *       ├── Dashboard
 *       ├── SeizureTracker
 *       ├── Medications
 *       └── Reminders
 *   └── Profile   (Stack screen — slides in with a back button)
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  TouchableOpacity,
  Image,
  StyleSheet,
  View,
  PanResponder,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import Dashboard      from '../screens/Dashboard';
import SeizureTracker from '../screens/SeizureTracker';
import Medications    from '../screens/Medications';
import Reminders      from '../screens/Reminders';
import Profile        from '../screens/Profile';
import { colors, getTheme } from '../theme/colors';
import { useTheme }  from '../context/ThemeContext';
import { storageGet } from '../utils/storage';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

const AVATAR_KEY = 'neurotrack_avatar';

// Tab order — used for swipe navigation
const TABS = ['Dashboard', 'SeizureTracker', 'Medications', 'Reminders'];

// ─── MainTabs ────────────────────────────────────────────────────────────────
function MainTabs({ navigation }) {
  const [avatar, setAvatar] = useState(null);
  const { isDark } = useTheme();
  const t = getTheme(isDark);
  const insets = useSafeAreaInsets();
  const { width: ww, height: wh } = useWindowDimensions();
  const isLandscape = ww > wh;
  const screenHeightRef = useRef(wh);
  screenHeightRef.current = wh;

  // Reload avatar whenever we return from Profile
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const av = await storageGet(AVATAR_KEY);
        setAvatar(av || null);
      })();
    }, []),
  );

  // ── Swipe gesture handler ─────────────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      // Only claim the responder for clearly intentional gestures so we don't
      // fight with ScrollViews on the tab screens.
      onMoveShouldSetPanResponder: (_, { dx, dy, y0 }) => {
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);
        // Upward swipe starting inside the tab-bar strip → Profile
        const fromTabBar = y0 > screenHeightRef.current - 90;
        if (fromTabBar && dy < -20 && absY > absX) return true;
        // Horizontal swipe clearly more sideways than vertical → tab switch
        if (absX > absY * 1.5 && absX > 20) return true;
        return false;
      },

      onPanResponderRelease: (_, { dx, dy, y0 }) => {
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);

        // ── Swipe UP from tab bar → Profile ──────────────────────────────
        const fromTabBar = y0 > screenHeightRef.current - 90;
        if (fromTabBar && dy < -60 && absY > absX) {
          navigation.navigate('Profile');
          return;
        }

        // ── Horizontal swipe → switch tabs ───────────────────────────────
        if (absX > 60 && absX > absY * 1.5) {
          // Read the current tab index from the live navigation state
          const stackState = navigation.getState();
          const mainTabsRoute = stackState.routes.find(r => r.name === 'MainTabs');
          const curr = mainTabsRoute?.state?.index ?? 0;

          if (dx < 0 && curr < TABS.length - 1) {
            // Swipe left → next tab
            navigation.navigate('MainTabs', { screen: TABS[curr + 1] });
          } else if (dx > 0 && curr > 0) {
            // Swipe right → previous tab
            navigation.navigate('MainTabs', { screen: TABS[curr - 1] });
          }
        }
      },
    }),
  ).current;

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      <Tab.Navigator
        screenOptions={({ navigation }) => ({
          // ── Shared header ──
          headerShown: true,
          headerStyle: {
            backgroundColor: t.surface,
            shadowOpacity:   0,
            elevation:       0,
            borderBottomWidth: 1,
            borderBottomColor: t.border,
          },
          headerTitleStyle: {
            fontSize:   17,
            fontWeight: '800',
            color:      t.text,
          },
          headerTitle: 'NeuroTrack',

          // ── Profile avatar button (top-right) ──
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Profile')}
              style={styles.avatarBtn}
              activeOpacity={0.7}
            >
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImg} />
              ) : (
                <Ionicons name="person-circle-outline" size={30} color={colors.slate600} />
              )}
            </TouchableOpacity>
          ),

          // ── Bottom tab bar ──
          tabBarStyle: {
            backgroundColor: t.surface,
            borderTopColor:  t.border,
            borderTopWidth:  1,
            paddingTop:      isLandscape ? 2 : 6,
            paddingBottom:   insets.bottom + 4,
            height:          (isLandscape ? 44 : 62) + insets.bottom,
          },
          tabBarShowLabel:         !isLandscape,
          tabBarActiveTintColor:   colors.indigo600,
          tabBarInactiveTintColor: isDark ? colors.slate500 : colors.slate400,
          tabBarLabelStyle: {
            fontSize:   11,
            fontWeight: '600',
            marginTop:  1,
          },
        })}
      >
        <Tab.Screen
          name="Dashboard"
          component={Dashboard}
          options={{
            tabBarIcon: ({ color }) => (
              <Ionicons name="grid-outline" size={22} color={color} />
            ),
          }}
        />

        <Tab.Screen
          name="SeizureTracker"
          component={SeizureTracker}
          options={{
            tabBarLabel: 'Seizures',
            tabBarIcon: ({ color }) => (
              <Ionicons name="pulse-outline" size={22} color={color} />
            ),
          }}
        />

        <Tab.Screen
          name="Medications"
          component={Medications}
          options={{
            tabBarIcon: ({ color }) => (
              <Ionicons name="medical-outline" size={22} color={color} />
            ),
            tabBarActiveTintColor: colors.emerald600,
          }}
        />

        <Tab.Screen
          name="Reminders"
          component={Reminders}
          options={{
            tabBarIcon: ({ color }) => (
              <Ionicons name="notifications-outline" size={22} color={color} />
            ),
            tabBarActiveTintColor: colors.amber600,
          }}
        />
      </Tab.Navigator>
    </View>
  );
}

// ─── Root Stack ───────────────────────────────────────────────────────────────
export default function AppNavigator() {
  const { isDark } = useTheme();
  const t = getTheme(isDark);

  return (
    <Stack.Navigator>
      {/* Main four-tab shell — header is handled by the Tab.Navigator */}
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />

      {/* Profile — slides in from the right */}
      <Stack.Screen
        name="Profile"
        component={Profile}
        options={{
          title:           '',
          headerStyle: {
            backgroundColor: t.surface,
            shadowOpacity:   0,
            elevation:       0,
            borderBottomWidth: 1,
            borderBottomColor: t.border,
          },
          headerTintColor: colors.indigo600,
          headerBackTitle: 'Back',
        }}
      />
    </Stack.Navigator>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  avatarBtn: {
    marginRight: 14,
    padding:     2,
  },
  avatarImg: {
    width:        30,
    height:       30,
    borderRadius: 15,
    borderWidth:  2,
    borderColor:  colors.purple200,
  },
});
