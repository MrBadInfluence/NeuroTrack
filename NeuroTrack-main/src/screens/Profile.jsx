/**
 * Profile screen — personal details, emergency contact, and neurologist info
 *
 * All data is stored locally in AsyncStorage (nothing is sent to Supabase).
 * The avatar URI is saved under a separate key so the navigation header can
 * load it quickly without parsing the full profile JSON.
 * A brief "Saved!" confirmation replaces the button label for 2.5 seconds
 * after a successful save.
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AppInput from '../components/ui/AppInput';
import AppButton from '../components/ui/AppButton';
import { storageGetJSON, storageSetJSON, storageGet, storageSet } from '../utils/storage';
import { colors, gradients } from '../theme/colors';

const STORAGE_KEY = 'neurotrack_profile';  // AsyncStorage key for the profile JSON
const AVATAR_KEY  = 'neurotrack_avatar';   // AsyncStorage key for the avatar image URI

// All supported profile fields with empty-string defaults
const defaultProfile = {
  name: '', email: '', phone: '', dob: '', condition: '',
  emergency_name: '', emergency_phone: '', emergency_relationship: '',
  neuro_name: '', neuro_phone: '', neuro_clinic: '', neuro_email: '',
};

/** Reusable section card with a gradient icon and title header */
function SectionCard({ iconName, title, gradient, children }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <LinearGradient colors={gradient} style={styles.sectionIcon} start={{x:0,y:0}} end={{x:1,y:1}}>
          <Ionicons name={iconName} size={18} color={colors.white} />
        </LinearGradient>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

export default function Profile() {
  const [profile, setProfile] = useState(defaultProfile);
  const [avatar,  setAvatar]  = useState(null);
  const [saved,   setSaved]   = useState(false);

  useEffect(() => {
    (async () => {
      const p = await storageGetJSON(STORAGE_KEY);
      if (p) setProfile({ ...defaultProfile, ...p });
      const av = await storageGet(AVATAR_KEY);
      if (av) setAvatar(av);
    })();
  }, []);

  // Curried updater: update('name')('Jane') sets profile.name without a separate handler per field
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
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setAvatar(uri);
      await storageSet(AVATAR_KEY, uri);
    }
  };

  const handleSave = async () => {
    await storageSetJSON(STORAGE_KEY, profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500); // revert button label after 2.5 s
  };

  return (
    <LinearGradient
      colors={gradients.bgSlate}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      locations={[0, 0.5, 1]}
    >
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
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
          <Text style={styles.pageTitle}>Profile & Settings</Text>
          <Text style={styles.pageSubtitle}>Your personal details and contacts</Text>
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
        <AppInput label="Doctor Name"      value={profile.neuro_name}   onChangeText={update('neuro_name')}   placeholder="Dr. Sarah Lee" />
        <View style={{ height: 12 }} />
        <AppInput label="Clinic / Hospital" value={profile.neuro_clinic} onChangeText={update('neuro_clinic')} placeholder="Auckland City Hospital" />
        <View style={{ height: 12 }} />
        <AppInput label="Phone Number"     value={profile.neuro_phone}  onChangeText={update('neuro_phone')}  placeholder="+64 9 000 0000" keyboardType="phone-pad" />
        <View style={{ height: 12 }} />
        <AppInput label="Email Address"    value={profile.neuro_email}  onChangeText={update('neuro_email')}  placeholder="dr.lee@hospital.co.nz" keyboardType="email-address" />
      </SectionCard>

      {/* Save button */}
      <AppButton
        gradient={saved ? [colors.emerald500, colors.emerald600] : gradients.indigo}
        onPress={handleSave}
        style={styles.saveBtn}
      >
        {saved ? '✓  Saved!' : '💾  Save Profile'}
      </AppButton>

      <View style={{ height: 30 }} />
    </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  avatarWrapper: { position: 'relative' },
  avatarBg: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: colors.white,
    shadowColor: '#000', shadowOpacity: 0.12, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 4,
    overflow: 'hidden',
    backgroundColor: colors.indigo50,
  },
  avatarImg: { width: 80, height: 80, borderRadius: 40 },
  cameraBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.indigo600,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.white,
  },
  headerText: { flex: 1 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: colors.slate900, marginBottom: 3 },
  pageSubtitle: { fontSize: 13, color: colors.slate500 },
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
  sectionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.slate900 },
  sectionBody: { padding: 16 },
  saveBtn: { marginTop: 8 },
});
