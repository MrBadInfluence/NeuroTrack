/**
 * Auth screen — SSO gate between Onboarding and the main app
 *
 * Supports email/password auth via Supabase, Google OAuth via expo-web-browser,
 * and a "Explore Demo" skip button that bypasses auth entirely.
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import AppInput from '../components/ui/AppInput';
import AppButton from '../components/ui/AppButton';
import { supabase } from '../lib/supabase';
import { storageSet } from '../utils/storage';
import { colors, gradients } from '../theme/colors';

WebBrowser.maybeCompleteAuthSession();

export const DEMO_KEY = 'neurotrack_demo_mode';

const logoImage = require('../../assets/NeuroTrackCANVAimage3.png');

export default function Auth({ onAuthenticated, onSkip }) {
  const [mode,          setMode]          = useState('signin'); // 'signin' | 'signup'
  const [email,         setEmail]         = useState('');
  const [password,      setPassword]      = useState('');
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    // Basic email format check before hitting the network
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) { Alert.alert('Error', error.message); return; }
        Alert.alert('Account created', 'Check your email to confirm your account, then sign in.');
        setMode('signin');
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) { Alert.alert('Sign in failed', error.message); return; }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onAuthenticated();
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      // redirectTo must also be added to:
      //   Supabase Dashboard → Authentication → URL Configuration → Redirect URLs
      //   Google Cloud Console → OAuth 2.0 client → Authorized redirect URIs
      const redirectUri = 'neurotrack://auth-callback';
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUri, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (!data?.url) throw new Error('No OAuth URL returned from Supabase');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

      if (result.type === 'success' && result.url) {
        const redirectUrl = result.url;

        // Parse query and fragment params (avoids false-positive match on error_code=)
        const queryStr = redirectUrl.includes('?') ? redirectUrl.split('?')[1].split('#')[0] : '';
        const fragStr  = redirectUrl.includes('#') ? redirectUrl.split('#')[1] : '';
        const qp = new URLSearchParams(queryStr);
        const fp = new URLSearchParams(fragStr);

        const code          = qp.get('code');
        const access_token  = fp.get('access_token') || qp.get('access_token');
        const refresh_token = fp.get('refresh_token') || qp.get('refresh_token') || '';
        const oauthError    = qp.get('error') || fp.get('error');

        if (oauthError) {
          const desc = qp.get('error_description') || fp.get('error_description') || oauthError;
          throw new Error(desc);
        }

        if (code) {
          // PKCE flow — code in query params, verifier stored by signInWithOAuth
          const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(redirectUrl);
          if (sessionError) throw sessionError;
          if (sessionData?.session) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onAuthenticated();
          }
        } else if (access_token) {
          // Implicit flow — tokens in URL fragment
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
          if (sessionError) throw sessionError;
          if (sessionData?.session) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onAuthenticated();
          }
        } else {
          throw new Error('Google sign-in returned an unexpected response. Please try again.');
        }
      }
      // result.type === 'cancel' or 'dismiss' — user closed the browser, do nothing.
    } catch (err) {
      console.error('[NeuroTrack] Google sign-in error:', err?.message, err);
      Alert.alert(
        'Google Sign-In Failed',
        err?.message || 'An unexpected error occurred. Please try again.',
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSkip = async () => {
    await storageSet(DEMO_KEY, 'true');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSkip();
  };

  return (
    <LinearGradient colors={[colors.indigo50, colors.purple50, colors.white]} style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Branding */}
          <View style={styles.brand}>
            <View style={styles.logoBox}>
              <Image source={logoImage} style={styles.logoImg} resizeMode="contain" />
            </View>
            <Text style={styles.appName}>NeuroTrack</Text>
            <Text style={styles.tagline}>Your epilepsy management companion</Text>
          </View>

          {/* Auth card */}
          <View style={styles.card}>
            {/* Sign in / Create account toggle */}
            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[styles.modeBtn, mode === 'signin' && styles.modeBtnActive]}
                onPress={() => setMode('signin')}
              >
                <Text style={[styles.modeBtnText, mode === 'signin' && styles.modeBtnTextActive]}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, mode === 'signup' && styles.modeBtnActive]}
                onPress={() => setMode('signup')}
              >
                <Text style={[styles.modeBtnText, mode === 'signup' && styles.modeBtnTextActive]}>Create Account</Text>
              </TouchableOpacity>
            </View>

            {/* Google */}
            <TouchableOpacity
              style={[styles.googleBtn, googleLoading && styles.btnDisabled]}
              onPress={handleGoogleSignIn}
              activeOpacity={0.85}
              disabled={googleLoading}
            >
              <Ionicons name="logo-google" size={18} color="#4285F4" />
              <Text style={styles.googleText}>
                {googleLoading ? 'Opening Google…' : 'Continue with Google'}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Email / password */}
            <AppInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={{ height: 14 }} />
            <AppInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
            />
            <View style={{ height: 20 }} />
            <AppButton gradient={gradients.indigo} onPress={handleEmailAuth} loading={loading}>
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </AppButton>
          </View>

          {/* Demo skip */}
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn} activeOpacity={0.7}>
            <Text style={styles.skipText}>Explore Demo  →</Text>
          </TouchableOpacity>

          <Text style={styles.privacyNote}>Your health data is stored privately on your device.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  brand: { alignItems: 'center', gap: 10, marginBottom: 36 },
  logoBox: {
    width: 90, height: 90, borderRadius: 24, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.15, shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16, elevation: 8,
  },
  logoImg: { width: 90, height: 90 },
  appName: { fontSize: 30, fontWeight: '800', color: colors.slate900, letterSpacing: -0.5 },
  tagline: { fontSize: 14, color: colors.slate500, textAlign: 'center' },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.slate100,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
    elevation: 4,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.slate100,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  modeBtn: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center' },
  modeBtnActive: {
    backgroundColor: colors.white,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  modeBtnText: { fontSize: 14, fontWeight: '600', color: colors.slate500 },
  modeBtnTextActive: { color: colors.slate900 },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: colors.slate200,
    borderRadius: 12,
    paddingVertical: 13,
    marginBottom: 16,
    backgroundColor: colors.white,
  },
  btnDisabled: { opacity: 0.6 },
  googleText: { fontSize: 14, fontWeight: '600', color: colors.slate700 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.slate200 },
  dividerText: { fontSize: 13, color: colors.slate400 },
  skipBtn: {
    alignSelf: 'center',
    marginTop: 28,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: { fontSize: 14, fontWeight: '600', color: colors.indigo600 },
  privacyNote: { textAlign: 'center', fontSize: 12, color: colors.slate400, marginTop: 16 },
});
