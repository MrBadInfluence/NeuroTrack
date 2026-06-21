/**
 * Onboarding screen — intro slideshow shown on first app launch
 *
 * Six slides, navigable via the Next button, dot indicators, or a horizontal
 * swipe gesture (PanResponder). On the final slide the button says "Get Started".
 * Pressing Skip or completing the last slide writes ONBOARDING_KEY to
 * AsyncStorage and calls onComplete() to switch App.js to the main navigator.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  PanResponder,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { storageSet } from '../utils/storage';
import { colors } from '../theme/colors';

const logoImage = require('../../assets/NeuroTrackCANVAimage3.png');

const { width } = Dimensions.get('window');

// AsyncStorage key checked by App.js to decide whether to show onboarding
export const ONBOARDING_KEY = 'neurotrack_onboarded';

const slides = [
  {
    useLogo: true,
    title: 'Welcome to NeuroTrack',
    description: 'Your personal seizure and medication management companion. Simple, private, and always with you.',
    gradient: [colors.indigo500, '#7c3aed'],
    bg: [colors.indigo50, colors.purple50],
  },
  {
    icon: 'grid-outline',
    iconColor: colors.white,
    title: 'Dashboard Overview',
    description: 'See your seizure count, active medications, reminders, and a monthly summary at a glance.',
    gradient: [colors.indigo500, '#3b82f6'],
    bg: [colors.indigo50, '#eff6ff'],
  },
  {
    icon: 'pulse-outline',
    iconColor: colors.white,
    title: 'Track Seizures',
    description: 'Log each seizure with type, duration, triggers, and notes. Review your history and spot patterns over time.',
    gradient: ['#8b5cf6', colors.indigo500],
    bg: ['#f5f3ff', colors.indigo50],
  },
  {
    icon: 'medical-outline',
    iconColor: colors.white,
    title: 'Manage Medications',
    description: 'Keep track of your prescriptions, dosages, and schedules. Stay on top of your treatment plan.',
    gradient: [colors.emerald500, colors.teal500],
    bg: [colors.emerald50, '#f0fdfa'],
  },
  {
    icon: 'notifications-outline',
    iconColor: colors.white,
    title: 'Set Reminders',
    description: 'Never miss a dose. Create medication reminders and stay on your schedule.',
    gradient: [colors.amber500, colors.orange500],
    bg: [colors.amber50, colors.orange50],
  },
  {
    icon: 'person-outline',
    iconColor: colors.white,
    title: 'Your Profile',
    description: 'Add your personal details, emergency contact, and neurologist info — all stored privately on your device.',
    gradient: ['#f43f5e', '#ec4899'],
    bg: [colors.rose50, colors.pink50],
    isLast: true,
  },
];

export default function Onboarding({ onComplete }) {
  const [current, setCurrent] = useState(0);
  const slide = slides[current];
  const isLast = current === slides.length - 1;

  const touchStartX = useRef(0);

  // Advance to the next slide, or mark onboarding complete on the last slide
  const goNext = async () => {
    if (isLast) {
      await storageSet(ONBOARDING_KEY, 'true');
      onComplete();
      return;
    }
    setCurrent(c => c + 1);
  };

  // Jump directly to a specific slide via the dot indicators
  const goTo = (i) => setCurrent(i);

  // Horizontal swipe handler — a delta of 50px or more triggers a slide change
  const panResponder = useRef(
    PanResponder.create({
      // Only claim the responder once the finger has moved clearly sideways —
      // this prevents stealing tap events from the CTA button and dot indicators.
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.5,
      onPanResponderGrant: (evt) => {
        touchStartX.current = evt.nativeEvent.pageX;
      },
      onPanResponderRelease: (evt) => {
        const delta = touchStartX.current - evt.nativeEvent.pageX;
        if (Math.abs(delta) < 50) return; // ignore tiny swipes
        setCurrent(c => {
          if (delta > 0 && c < slides.length - 1) return c + 1; // swipe left → next
          if (delta < 0 && c > 0) return c - 1;                 // swipe right → previous
          return c;
        });
      },
    }),
  ).current;

  return (
    <LinearGradient colors={slide.bg} style={styles.container} {...panResponder.panHandlers}>
      <StatusBar barStyle="dark-content" />

      {/* Skip button */}
      <View style={styles.topRow}>
        {!isLast && (
          <TouchableOpacity
            onPress={async () => { await storageSet(ONBOARDING_KEY, 'true'); onComplete(); }}
            style={styles.skipBtn}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Slide content */}
      <View style={styles.content}>
        {slide.useLogo ? (
          <View style={styles.logoBox}>
            <Image source={logoImage} style={styles.logoImg} resizeMode="contain" />
          </View>
        ) : (
          <LinearGradient
            colors={slide.gradient}
            style={styles.iconBox}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name={slide.icon} size={44} color={slide.iconColor} />
          </LinearGradient>
        )}

        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.description}>{slide.description}</Text>
      </View>

      {/* Bottom: dots + CTA */}
      <View style={styles.bottom}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goTo(i)}>
              <View style={[styles.dot, i === current ? styles.dotActive : styles.dotInactive]} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={goNext} activeOpacity={0.85} style={styles.ctaWrapper}>
          <LinearGradient
            colors={slide.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cta}
          >
            <Text style={styles.ctaText}>
              {isLast ? '✓  Get Started' : 'Next  →'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 56,
    paddingBottom: 40,
  },
  topRow: {
    alignItems: 'flex-end',
    height: 32,
  },
  skipBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  skipText: {
    fontSize: 14,
    color: colors.slate400,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  iconBox: {
    width: 100,
    height: 100,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 10,
  },
  logoBox: {
    width: 120,
    height: 120,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 10,
  },
  logoImg: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.slate900,
    textAlign: 'center',
    marginTop: 8,
  },
  description: {
    fontSize: 16,
    color: colors.slate500,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  bottom: {
    alignItems: 'center',
    gap: 24,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    borderRadius: 4,
    height: 8,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.indigo600,
  },
  dotInactive: {
    width: 8,
    backgroundColor: colors.slate300,
  },
  ctaWrapper: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
  },
  cta: {
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
