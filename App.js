/**
 * App.js — NeuroTrack React Native Entry Point
 *
 * Sets up:
 *   1. QueryClientProvider — React Query for all data fetching
 *   2. NavigationContainer — React Navigation bottom tabs
 *   3. Onboarding gate     — shows intro slides on first launch
 */

import React, { useState, useEffect } from 'react';
import { LogBox } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

// Suppress known third-party library warnings that don't affect functionality
LogBox.ignoreLogs([
  'InteractionManager has been deprecated',
]);
import { NavigationContainer } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { queryClientInstance } from './src/utils/queryClient';
import { storageGet } from './src/utils/storage';
import { ONBOARDING_KEY } from './src/screens/Onboarding';
import Onboarding from './src/screens/Onboarding';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/theme/colors';

export default function App() {
  // null = still loading, false = not completed, true = completed
  const [onboarded, setOnboarded] = useState(null);

  useEffect(() => {
    (async () => {
      const val = await storageGet(ONBOARDING_KEY);
      setOnboarded(val === 'true');
    })();
  }, []);

  // Splash while we check AsyncStorage
  if (onboarded === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.indigo600} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClientInstance}>
          <StatusBar style="dark" />

          {!onboarded ? (
            <Onboarding onComplete={() => setOnboarded(true)} />
          ) : (
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          )}
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
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
