/**
 * Profile screen — personal details, settings, and account management
 *
 * Sections:
 *   • Avatar + personal info (name, DOB, email, phone, condition)
 *   • Emergency contact
 *   • Neurologist / healthcare provider
 *   • App Settings — screen mode (Light / Device / Dark)
 *   • Export Data — share 3 / 6 / 12-month report
 *   • Account — Google sync, sign out, delete account
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, Alert, Share, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AppInput from '../components/ui/AppInput';
import AppButton from '../components/ui/AppButton';
import { parseISO, isAfter, subMonths } from 'date-fns';
import { storageGetJSON, storageSetJSON, storageGet, storageSet } from '../utils/storage';
import { supabase } from '../lib/supabase';
import { localClient } from '../api/localClient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { colors, gradients, getTheme } from '../theme/colors';

const STORAGE_KEY = 'neurotrack_profile';
const AVATAR_KEY  = 'neurotrack_avatar';

const defaultProfile = {
  name: '', email: '', phone: '', dob: '', condition: '',
  emergency_name: '', emergency_phone: '', emergency_relationship: '',
  neuro_name: '', neuro_phone: '', neuro_clinic: '', neuro_email: '',
};

function SectionCard({ iconName, title, gradient, children }) {
  const { isDark } = useTheme();
  const t = getTheme(isDark);
  return (
    <View style={[styles.section, { backgroundColor: t.surface, borderColor: t.border }]}>
      <View style={[styles.sectionHeader, { borderBottomColor: t.border }]}>
        <LinearGradient colors={gradient} style={styles.sectionIcon} start={{x:0,y:0}} end={{x:1,y:1}}>
          <Ionicons name={iconName} size={18} color={colors.white} />
        </LinearGradient>
        <Text style={[styles.sectionTitle, { color: t.text }]}>{title}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

export default function Profile() {
  const [profile,       setProfile]       = useState(defaultProfile);
  const [avatar,        setAvatar]        = useState(null);
  const [saved,         setSaved]         = useState(false);
  const [exporting,     setExporting]     = useState(false);
  const [googleSyncing, setGoogleSyncing] = useState(false);

  const insets = useSafeAreaInsets();
  const hPad   = Math.max(16, Math.max(insets.left, insets.right) + 8);

  const { mode: themeMode, setMode: setThemeMode, isDark } = useTheme();
  const t = getTheme(isDark);
  const { signOut, deleteAccount, isAuthenticated, isDemo } = useAuth();

  useEffect(() => {
    (async () => {
      const p = await storageGetJSON(STORAGE_KEY);
      if (p) setProfile({ ...defaultProfile, ...p });

      if (isAuthenticated) {
        // Always fetch fresh user metadata from Supabase so the Google avatar
        // URL never goes stale (remote URLs can expire or change).
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const meta = user.user_metadata || {};
            const googleAvatar = meta.avatar_url || meta.picture;
            if (googleAvatar) {
              setAvatar(googleAvatar);
              await storageSet(AVATAR_KEY, googleAvatar);
            } else {
              // No Google avatar — use whatever the user picked locally
              const av = await storageGet(AVATAR_KEY);
              if (av) setAvatar(av);
            }
            // Auto-fill name/email when profile is blank
            if (!p?.name) {
              const updated = {
                ...defaultProfile, ...(p || {}),
                name:  meta.full_name || meta.name  || '',
                email: meta.email     || user.email || '',
              };
              setProfile(updated);
              await storageSetJSON(STORAGE_KEY, updated);
            }
          }
        } catch {
          // Supabase unavailable — fall back to cached avatar
          const av = await storageGet(AVATAR_KEY);
          if (av) setAvatar(av);
        }
      } else {
        const av = await storageGet(AVATAR_KEY);
        if (av) setAvatar(av);
      }
    })();
  }, []);

  const update = (key) => (val) => setProfile(p => ({ ...p, [key]: val }));

  const handleAvatarChange = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setAvatar(uri);
      await storageSet(AVATAR_KEY, uri);
    }
  };

  const handleSave = async () => {
    await storageSetJSON(STORAGE_KEY, profile);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // Pull name / email / avatar from the signed-in Google account
  const handleGoogleSync = async () => {
    setGoogleSyncing(true);
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) throw new Error('Not signed in');
      const meta = user.user_metadata || {};
      const updated = {
        ...profile,
        name:  meta.full_name || meta.name  || profile.name,
        email: meta.email     || user.email || profile.email,
      };
      // Save Google avatar if we don't have one yet
      if (!avatar && (meta.avatar_url || meta.picture)) {
        const picUri = meta.avatar_url || meta.picture;
        setAvatar(picUri);
        await storageSet(AVATAR_KEY, picUri);
      }
      setProfile(updated);
      await storageSetJSON(STORAGE_KEY, updated);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Synced', 'Profile updated from your Google account.');
    } catch (err) {
      const msg = err?.message || '';
      const isAuthErr = msg.toLowerCase().includes('session') || msg.toLowerCase().includes('auth') || msg.toLowerCase().includes('token');
      Alert.alert(
        'Sync failed',
        isAuthErr
          ? 'Your session has expired. Please sign out and sign back in with Google, then try again.'
          : `Could not fetch your Google account details: ${msg || 'Unknown error'}`,
      );
    } finally {
      setGoogleSyncing(false);
    }
  };

  // Build a text report for the selected number of months and share it
  const handleExport = async (months) => {
    setExporting(true);
    try {
      const now      = new Date();
      const since    = subMonths(now, months);
      const sinceStr = since.toISOString().split('T')[0];
      const todayStr = now.toISOString().split('T')[0];

      const [seizures, medications, doseLogs] = await Promise.all([
        localClient.entities.Seizure.list('-date_time', 500),
        localClient.entities.Medication.list('-created_date', 100),
        localClient.entities.DoseLog.list('-created_date', 1000),
      ]);

      const filteredSeizures = seizures.filter(s => {
        const rawDate = s.date_time || s.created_date;
        if (!rawDate) return false;
        return isAfter(parseISO(rawDate), since);
      });
      const filteredLogs = doseLogs.filter(d => {
        if (!d.scheduled_date) return false;
        return isAfter(parseISO(d.scheduled_date), since);
      });
      const takenCount    = filteredLogs.filter(d => d.status === 'taken').length;
      const totalCount    = filteredLogs.length;
      const adherencePct  = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : null;
      const activeMeds    = medications.filter(m => m.is_active);

      const seizureLines = filteredSeizures.map(s => {
        const date = s.date_time ? new Date(s.date_time).toLocaleDateString() : 'Unknown';
        const time = s.date_time ? new Date(s.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
        const dur  = s.duration_seconds
          ? s.duration_seconds < 60
            ? `${s.duration_seconds}s`
            : `${Math.floor(s.duration_seconds / 60)}m ${s.duration_seconds % 60}s`
          : null;
        return [
          `• ${date}${time ? ' at ' + time : ''}`,
          `  Type: ${s.seizure_type || 'Unknown'}`,
          dur               ? `  Duration: ${dur}`                    : null,
          s.severity        ? `  Severity: ${s.severity}`             : null,
          s.nocturnal       ? '  (Nocturnal)'                         : null,
          s.triggers        ? `  Triggers: ${s.triggers}`             : null,
          s.post_ictal_symptoms ? `  Post-ictal: ${s.post_ictal_symptoms}` : null,
          s.notes           ? `  Notes: ${s.notes}`                   : null,
        ].filter(Boolean).join('\n');
      });

      const medLines = activeMeds.map(m =>
        [`• ${m.name} ${m.dosage}`,
          m.frequency ? `  ${m.frequency}` : null,
          m.prescribing_doctor ? `  Dr. ${m.prescribing_doctor}` : null,
        ].filter(Boolean).join('\n'),
      );

      const report = [
        '=== NeuroTrack Health Report ===',
        `Period : Last ${months} month${months > 1 ? 's' : ''}`,
        `From   : ${sinceStr}`,
        `To     : ${todayStr}`,
        `Created: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
        '',
        '--- SEIZURES ---',
        `Total: ${filteredSeizures.length}`,
        '',
        ...(filteredSeizures.length > 0 ? seizureLines : ['  No seizures in this period.']),
        '',
        '--- MEDICATIONS (Active) ---',
        `Total: ${activeMeds.length}`,
        '',
        ...(activeMeds.length > 0 ? medLines : ['  No active medications.']),
        '',
        '--- ADHERENCE ---',
        `Doses logged : ${totalCount}`,
        `Doses taken  : ${takenCount}`,
        `Adherence    : ${adherencePct !== null ? adherencePct + '%' : 'N/A'}`,
        '',
        '=== End of Report ===',
      ].join('\n');

      await Share.share({
        title:   `NeuroTrack ${months}-Month Report`,
        message: report,
      });
    } catch (err) {
      Alert.alert('Export failed', err.message || 'Could not generate the report.');
    } finally {
      setExporting(false);
    }
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Clear All Local Data',
      'This will permanently erase all your seizure logs, medications, reminders, and profile data from this device and sign you out. Your Supabase account credentials are not deleted from the server.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear & Sign Out',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await deleteAccount();
          },
        },
      ],
    );
  };

  const confirmSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ],
    );
  };

  const THEME_OPTIONS = [
    { key: 'light',  label: 'Light',  icon: 'sunny-outline' },
    { key: 'device', label: 'Device', icon: 'phone-portrait-outline' },
    { key: 'dark',   label: 'Dark',   icon: 'moon-outline' },
  ];

  const EXPORT_OPTIONS = [
    { months: 3,  label: '3 Months' },
    { months: 6,  label: '6 Months' },
    { months: 12, label: '12 Months' },
  ];

  return (
    <LinearGradient
      colors={t.bgGradient}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      locations={[0, 0.5, 1]}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingLeft: hPad, paddingRight: hPad }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar + page title */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleAvatarChange} style={styles.avatarWrapper} activeOpacity={0.8}>
            <LinearGradient colors={gradients.indigo} style={styles.avatarBg}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImg} />
              ) : (
                <Ionicons name="person-outline" size={36} color={colors.indigo400} />
              )}
            </LinearGradient>
            <View style={styles.cameraBtn}>
              <Ionicons name="camera" size={12} color={colors.white} />
            </View>
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={[styles.pageTitle, { color: t.text }]}>Profile & Settings</Text>
            <Text style={[styles.pageSubtitle, { color: t.textMuted }]}>Your personal details and contacts</Text>
          </View>
        </View>

        {/* Personal Information */}
        <SectionCard iconName="person-outline" title="Personal Information" gradient={gradients.indigo}>
          <AppInput label="Full Name"  value={profile.name}  onChangeText={update('name')}  placeholder="Jane Smith" />
          <View style={{ height: 12 }} />
          <AppInput label="Date of Birth" value={profile.dob} onChangeText={update('dob')} placeholder="dd-mm-yyyy" />
          <View style={{ height: 12 }} />
          <AppInput label="Email Address" value={profile.email} onChangeText={update('email')} placeholder="jane@example.com" keyboardType="email-address" />
          <View style={{ height: 12 }} />
          <AppInput label="Phone Number" value={profile.phone} onChangeText={update('phone')} placeholder="+64 21 000 0000" keyboardType="phone-pad" />
          <View style={{ height: 12 }} />
          <AppInput label="Primary Condition / Diagnosis" value={profile.condition} onChangeText={update('condition')} placeholder="e.g. Focal Epilepsy" />
        </SectionCard>

        {/* Emergency Contact */}
        <SectionCard iconName="shield-outline" title="Emergency Contact" gradient={['#f43f5e','#ec4899']}>
          <AppInput label="Contact Name"  value={profile.emergency_name}         onChangeText={update('emergency_name')}         placeholder="John Smith" />
          <View style={{ height: 12 }} />
          <AppInput label="Relationship"  value={profile.emergency_relationship} onChangeText={update('emergency_relationship')} placeholder="e.g. Parent, Spouse" />
          <View style={{ height: 12 }} />
          <AppInput label="Phone Number"  value={profile.emergency_phone}        onChangeText={update('emergency_phone')}        placeholder="+64 21 000 0000" keyboardType="phone-pad" />
        </SectionCard>

        {/* Neurologist */}
        <SectionCard iconName="medkit-outline" title="Neurologist / Healthcare Provider" gradient={gradients.emerald}>
          <AppInput label="Doctor Name"       value={profile.neuro_name}   onChangeText={update('neuro_name')}   placeholder="Dr. Sarah Lee" />
          <View style={{ height: 12 }} />
          <AppInput label="Clinic / Hospital" value={profile.neuro_clinic} onChangeText={update('neuro_clinic')} placeholder="Auckland City Hospital" />
          <View style={{ height: 12 }} />
          <AppInput label="Phone Number"      value={profile.neuro_phone}  onChangeText={update('neuro_phone')}  placeholder="+64 9 000 0000" keyboardType="phone-pad" />
          <View style={{ height: 12 }} />
          <AppInput label="Email Address"     value={profile.neuro_email}  onChangeText={update('neuro_email')}  placeholder="dr.lee@hospital.co.nz" keyboardType="email-address" />
        </SectionCard>

        {/* Save button */}
        <AppButton
          gradient={saved ? [colors.emerald500, colors.emerald600] : gradients.indigo}
          onPress={handleSave}
          style={styles.saveBtn}
        >
          {saved ? 'Saved!' : 'Save Profile'}
        </AppButton>

        {/* ── App Settings ── */}
        <SectionCard iconName="settings-outline" title="App Settings" gradient={gradients.violet}>
          <Text style={[styles.settingLabel, { color: t.textMuted }]}>Screen Mode</Text>
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.themeBtn,
                  { borderColor: t.border, backgroundColor: isDark ? colors.slate800 : colors.slate50 },
                  themeMode === opt.key && { borderColor: colors.indigo400, backgroundColor: isDark ? colors.indigo900 : colors.indigo50 },
                ]}
                onPress={() => { Haptics.selectionAsync(); setThemeMode(opt.key); }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={opt.icon}
                  size={18}
                  color={themeMode === opt.key ? colors.indigo600 : colors.slate400}
                />
                <Text style={[styles.themeBtnText, { color: t.textMuted }, themeMode === opt.key && styles.themeBtnTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SectionCard>

        {/* ── Export Data ── */}
        <SectionCard iconName="share-outline" title="Export & Share Data" gradient={gradients.teal}>
          <Text style={[styles.settingLabel, { color: t.textMuted }]}>Share your health report with your neurologist</Text>
          <View style={styles.exportRow}>
            {EXPORT_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.months}
                style={styles.exportBtn}
                onPress={() => handleExport(opt.months)}
                disabled={exporting}
                activeOpacity={0.8}
              >
                <LinearGradient colors={gradients.teal} style={styles.exportBtnGrad} start={{x:0,y:0}} end={{x:1,y:0}}>
                  {exporting ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <>
                      <Ionicons name="document-text-outline" size={14} color={colors.white} />
                      <Text style={styles.exportBtnText}>{opt.label}</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </SectionCard>

        {/* ── Account ── */}
        <SectionCard iconName="person-circle-outline" title="Account" gradient={gradients.rose}>
          {/* Google sync — only shown when signed in with Google */}
          {isAuthenticated && (
            <TouchableOpacity
              style={styles.accountRow}
              onPress={handleGoogleSync}
              disabled={googleSyncing}
              activeOpacity={0.8}
            >
              <View style={styles.accountRowLeft}>
                <View style={[styles.accountIcon, { backgroundColor: '#e8f0fe' }]}>
                  <Ionicons name="logo-google" size={18} color="#4285F4" />
                </View>
                <View>
                  <Text style={[styles.accountRowTitle, { color: t.text }]}>Sync from Google</Text>
                  <Text style={[styles.accountRowSub, { color: t.textFaint }]}>Auto-fill profile with your Google account</Text>
                </View>
              </View>
              {googleSyncing
                ? <ActivityIndicator size="small" color={colors.indigo600} />
                : <Ionicons name="chevron-forward" size={18} color={colors.slate300} />}
            </TouchableOpacity>
          )}

          {/* Sign out */}
          {(isAuthenticated || isDemo) && (
            <TouchableOpacity
              style={[styles.accountRow, { borderTopWidth: 1, borderTopColor: t.border }]}
              onPress={confirmSignOut}
              activeOpacity={0.8}
            >
              <View style={styles.accountRowLeft}>
                <View style={[styles.accountIcon, { backgroundColor: isDark ? colors.slate700 : colors.slate100 }]}>
                  <Ionicons name="log-out-outline" size={18} color={colors.slate600} />
                </View>
                <View>
                  <Text style={[styles.accountRowTitle, { color: t.text }]}>{isDemo ? 'Exit Demo' : 'Sign Out'}</Text>
                  <Text style={[styles.accountRowSub, { color: t.textFaint }]}>Return to the sign-in screen</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.slate300} />
            </TouchableOpacity>
          )}

          {/* Delete account */}
          <TouchableOpacity
            style={[styles.accountRow, { borderTopWidth: 1, borderTopColor: t.border }]}
            onPress={confirmDeleteAccount}
            activeOpacity={0.8}
          >
            <View style={styles.accountRowLeft}>
              <View style={[styles.accountIcon, { backgroundColor: isDark ? '#2a0a0a' : colors.red100 }]}>
                <Ionicons name="trash-outline" size={18} color={colors.red600} />
              </View>
              <View>
                <Text style={[styles.accountRowTitle, { color: colors.red600 }]}>Clear All Local Data</Text>
                <Text style={[styles.accountRowSub, { color: t.textFaint }]}>Erase local data and sign out</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.slate300} />
          </TouchableOpacity>
        </SectionCard>

        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: 'transparent' },
  content:  { padding: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  avatarWrapper: { position: 'relative' },
  avatarBg: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: colors.white,
    shadowColor: '#000', shadowOpacity: 0.12, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 4,
    overflow: 'hidden', backgroundColor: colors.indigo50,
  },
  avatarImg:  { width: 80, height: 80, borderRadius: 40 },
  cameraBtn:  {
    position: 'absolute', bottom: 0, right: 0,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.indigo600,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.white,
  },
  headerText:    { flex: 1 },
  pageTitle:     { fontSize: 22, fontWeight: '800', color: colors.slate900, marginBottom: 3 },
  pageSubtitle:  { fontSize: 13, color: colors.slate500 },
  section: {
    backgroundColor: colors.white, borderRadius: 16,
    borderWidth: 1, borderColor: colors.slate100,
    overflow: 'hidden', marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderBottomWidth: 1, borderBottomColor: colors.slate100,
  },
  sectionIcon:  { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.slate900 },
  sectionBody:  { padding: 16 },
  saveBtn:      { marginTop: 8, marginBottom: 16 },

  // Settings
  settingLabel: { fontSize: 13, color: colors.slate600, marginBottom: 10 },
  themeRow: { flexDirection: 'row', gap: 8 },
  themeBtn: {
    flex: 1, flexDirection: 'column', alignItems: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 12,
    borderWidth: 1.5, borderColor: colors.slate200,
    backgroundColor: colors.slate50,
  },
  themeBtnActive:     { borderColor: colors.indigo400, backgroundColor: colors.indigo50 },
  themeBtnText:       { fontSize: 12, fontWeight: '600', color: colors.slate400 },
  themeBtnTextActive: { color: colors.indigo600 },

  // Export
  exportRow:    { flexDirection: 'row', gap: 8 },
  exportBtn:    { flex: 1, borderRadius: 12, overflow: 'hidden' },
  exportBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 11,
  },
  exportBtnText: { fontSize: 12, fontWeight: '700', color: colors.white },

  // Account
  accountRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  accountRowBorder: { borderTopWidth: 1, borderTopColor: colors.slate100 },
  accountRowLeft:   { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  accountIcon:      { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  accountRowTitle:  { fontSize: 14, fontWeight: '600', color: colors.slate800 },
  accountRowSub:    { fontSize: 12, color: colors.slate400, marginTop: 1 },
});
