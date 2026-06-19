/**
 * App.js — NeuroTrack entry point
 *
 * Flow: Splash → Onboarding (first launch) → Auth (SSO) → Main app
 * Demo mode (skip auth) is stored in AsyncStorage so it persists across restarts.
 */

import React, { useState, useEffect, useRef } from 'react';
import { AppState, View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { NavigationContainer } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { queryClientInstance } from './src/utils/queryClient';
import { storageGet, storageRemove } from './src/utils/storage';
import ErrorBoundary from './src/components/ErrorBoundary';
import { ONBOARDING_KEY } from './src/screens/Onboarding';
import { DEMO_KEY } from './src/screens/Auth';
import Onboarding from './src/screens/Onboarding';
import Auth from './src/screens/Auth';
import AppNavigator from './src/navigation/AppNavigator';
import { syncOfflineQueue } from './src/api/localClient';
import { supabase } from './src/lib/supabase';
import { requestNotificationPermission, cancelAllNotifications } from './src/lib/notifications';
import { colors } from './src/theme/colors';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

export default function App() {
  // null = still loading from storage
  const [onboarded, setOnboarded] = useState(null);
  // 'loading' | 'unauthenticated' | 'authenticated' | 'skipped'
  const [authState, setAuthState] = useState('loading');

  useEffect(() => {
    // Track whether the component is still mounted and whether demo mode is active.
    // The demoActive ref prevents the Supabase auth listener from overriding
    // the 'skipped' state that the async IIFE sets.
    let isMounted = true;
    const demoActive = { current: false };

    (async () => {
      const onboardedVal = await storageGet(ONBOARDING_KEY);
      if (isMounted) setOnboarded(onboardedVal === 'true');

      const demoMode = await storageGet(DEMO_KEY);
      if (demoMode === 'true') {
        demoActive.current = true;
        if (isMounted) setAuthState('skipped');
      }
      // Auth state is now driven solely by onAuthStateChange below,
      // which fires INITIAL_SESSION immediately after the subscription is set up.
    })();

    // onAuthStateChange fires INITIAL_SESSION on mount (replaces the old getSession() call),
    // then SIGNED_IN / SIGNED_OUT as the user authenticates or logs out.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (demoActive.current) return; // demo mode takes precedence
      if (event === 'SIGNED_OUT') {
        setAuthState('unauthenticated');
      } else if (session) {
        setAuthState('authenticated');
      } else if (event === 'INITIAL_SESSION' && !session) {
        setAuthState('unauthenticated');
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Sync offline queue on launch and whenever the app comes to foreground
  useEffect(() => {
    syncOfflineQueue();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') syncOfflineQueue();
    });
    return () => sub.remove();
  }, []);

  // Request notification permission once the app finishes loading
  useEffect(() => {
    if (onboarded === null || authState === 'loading') return;
    requestNotificationPermission();
  }, [onboarded, authState]);

  const handleSignOut = async () => {
    await storageRemove(DEMO_KEY);
    await supabase.auth.signOut();
    setAuthState('unauthenticated');
  };

  const handleDeleteAccount = async () => {
    // Cancel all scheduled notifications before wiping AsyncStorage so the
    // notification ID map is still readable when cancelAllNotifications runs.
    await cancelAllNotifications();
    await AsyncStorage.clear();
    await supabase.auth.signOut();
    setAuthState('unauthenticated');
    setOnboarded(false);
  };

  // Show spinner while reading AsyncStorage / Supabase session
  if (onboarded === null || authState === 'loading') {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.indigo600} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClientInstance}>
          <ThemeProvider>
            <ThemedStatusBar />

            {!onboarded ? (
              <Onboarding onComplete={() => setOnboarded(true)} />
            ) : authState === 'unauthenticated' ? (
              <Auth
                onAuthenticated={() => setAuthState('authenticated')}
                onSkip={() => setAuthState('skipped')}
              />
            ) : (
              <AuthProvider
                signOut={handleSignOut}
                deleteAccount={handleDeleteAccount}
                isAuthenticated={authState === 'authenticated'}
                isDemo={authState === 'skipped'}
              >
                <NavigationContainer>
                  <AppNavigator />
                </NavigationContainer>
              </AuthProvider>
            )}
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
});
