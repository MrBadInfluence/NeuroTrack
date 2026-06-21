import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const NOTIF_IDS_KEY = 'neurotrack_notif_ids';

// Expo convention: Sunday=1, Monday=2, ..., Saturday=7
const DAY_TO_WEEKDAY = {
  sunday: 1, monday: 2, tuesday: 3, wednesday: 4,
  thursday: 5, friday: 6, saturday: 7,
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('medication-reminders', {
      name: 'Medication Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF9800',
      sound: 'default',
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function readNotifIds() {
  try {
    const raw = await AsyncStorage.getItem(NOTIF_IDS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function writeNotifIds(map) {
  try {
    await AsyncStorage.setItem(NOTIF_IDS_KEY, JSON.stringify(map));
  } catch {}
}

export async function scheduleReminderNotifications(reminder) {
  // Always cancel existing notifications for this reminder first
  await cancelReminderNotifications(reminder.id);

  if (!reminder.is_active || !reminder.time || !reminder.days_of_week?.length) return;

  const [hourStr, minuteStr] = reminder.time.split(':');
  const hour   = parseInt(hourStr,   10);
  const minute = parseInt(minuteStr, 10);
  if (isNaN(hour) || isNaN(minute)) return;

  const ids = [];
  for (const day of reminder.days_of_week) {
    const weekday = DAY_TO_WEEKDAY[day.toLowerCase()];
    if (!weekday) continue;

    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Time for ${reminder.medication_name}`,
          body: reminder.notes || 'Tap to log your dose.',
          sound: 'default',
          data: { reminderId: reminder.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday,
          hour,
          minute,
          channelId: 'medication-reminders',
        },
      });
      ids.push(id);
    } catch (err) {
      console.warn('[NeuroTrack] Failed to schedule notification:', err?.message);
    }
  }

  const map = await readNotifIds();
  map[reminder.id] = ids;
  await writeNotifIds(map);
}

export async function cancelReminderNotifications(reminderId) {
  const map = await readNotifIds();
  const ids = map[reminderId] || [];
  for (const id of ids) {
    try { await Notifications.cancelScheduledNotificationAsync(id); } catch {}
  }
  delete map[reminderId];
  await writeNotifIds(map);
}

export async function cancelAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
}
