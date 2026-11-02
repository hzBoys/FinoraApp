import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { supabase } from '../supabase';
import { NotificationPreferences } from '../../models/types';

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  dailyReminder: true,
  reminderTime: '20:00',
  budgetAlert: true,
  weeklyReport: true,
  smartAdvisorTips: true,
};

const STORAGE_KEY_PREFIX = 'finora_notif_prefs_';
const DAILY_REMINDER_ID = 'finora-daily-reminder';

// 1. Configure OS notification display behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const notificationService = {
  /**
   * Initialize Android notification channels
   */
  async initNotificationChannels(): Promise<void> {
    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('daily-reminder', {
          name: 'Pengingat Catat Harian',
          description: 'Notifikasi pengingat untuk mencatat pengeluaran harian Anda di Finora',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2D6A4F',
          enableLights: true,
          enableVibrate: true,
          showBadge: true,
        });

        await Notifications.setNotificationChannelAsync('budget-alert', {
          name: 'Peringatan Limit Anggaran',
          description: 'Pemberitahuan ketika pos pengeluaran mendekati atau melebihi limit',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 200, 100, 200],
          lightColor: '#FF9500',
        });
      } catch (err) {
        console.warn('initNotificationChannels error:', err);
      }
    }
  },

  /**
   * Request native OS permission from device
   */
  async requestNotificationPermission(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (err) {
      console.warn('requestNotificationPermission error:', err);
      return false;
    }
  },

  /**
   * Schedule recurring daily notification on device OS
   */
  async scheduleDailyReminder(hour: number, minute: number): Promise<boolean> {
    try {
      await this.initNotificationChannels();
      const hasPermission = await this.requestNotificationPermission();

      if (!hasPermission) {
        console.warn('Notification permission not granted by device OS');
        return false;
      }

      // Cancel previous scheduled daily reminder to avoid duplicates
      try {
        await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID);
      } catch {
        // ignore if none exists
      }

      await Notifications.scheduleNotificationAsync({
        identifier: DAILY_REMINDER_ID,
        content: {
          title: 'Waktunya Catat Transaksi ✍️',
          body: 'Catat pengeluaran dan pemasukan Anda hari ini di Finora agar anggaran tetap terkontrol.',
          sound: 'default',
          data: { screen: 'home' },
          color: '#2D6A4F',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          channelId: 'daily-reminder',
        },
      });

      return true;
    } catch (err) {
      console.warn('scheduleDailyReminder error:', err);
      return false;
    }
  },

  /**
   * Cancel daily reminder from OS schedule
   */
  async cancelDailyReminder(): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID);
    } catch {
      // ignore
    }
  },

  /**
   * Trigger an immediate test notification to device OS
   */
  async sendTestNotification(): Promise<boolean> {
    try {
      await this.initNotificationChannels();
      const hasPermission = await this.requestNotificationPermission();

      if (!hasPermission) {
        return false;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 Notifikasi Sistem Finora Aktif!',
          body: 'Notifikasi sistem perangkat berhasil dihubungkan. Anda akan menerima pengingat harian sesuai jadwal.',
          sound: 'default',
          color: '#2D6A4F',
        },
        trigger: null, // triggers immediately
      });

      return true;
    } catch (err) {
      console.warn('sendTestNotification error:', err);
      return false;
    }
  },

  /**
   * Load notification preferences from local cache and sync with Supabase
   */
  async loadPreferences(userId?: string | number): Promise<NotificationPreferences> {
    try {
      const localKey = `${STORAGE_KEY_PREFIX}${userId || 'local'}`;
      const cached = await AsyncStorage.getItem(localKey);
      let localPrefs: NotificationPreferences = DEFAULT_NOTIFICATION_PREFERENCES;

      if (cached) {
        localPrefs = { ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(cached) };
      }

      if (userId && typeof userId === 'string' && userId.includes('-')) {
        const { data } = await supabase.auth.getUser();
        const remotePrefs = data?.user?.user_metadata?.notification_preferences;
        if (remotePrefs) {
          const merged = { ...DEFAULT_NOTIFICATION_PREFERENCES, ...remotePrefs };
          await AsyncStorage.setItem(localKey, JSON.stringify(merged));
          return merged;
        }
      }

      return localPrefs;
    } catch (err) {
      console.warn('notificationService.loadPreferences exception:', err);
      return DEFAULT_NOTIFICATION_PREFERENCES;
    }
  },

  /**
   * Save preferences and schedule/cancel OS notification accordingly
   */
  async savePreferences(
    userId: string | number | undefined,
    preferences: NotificationPreferences
  ): Promise<boolean> {
    try {
      const localKey = `${STORAGE_KEY_PREFIX}${userId || 'local'}`;
      await AsyncStorage.setItem(localKey, JSON.stringify(preferences));

      // Sync to Supabase user_metadata
      if (userId && typeof userId === 'string' && userId.includes('-')) {
        await supabase.auth.updateUser({
          data: {
            notification_preferences: preferences,
          },
        });
      }

      // Schedule or cancel OS notification
      if (preferences.dailyReminder) {
        const timeParts = (preferences.reminderTime || '20:00').split(':');
        const hour = parseInt(timeParts[0], 10) || 20;
        const minute = parseInt(timeParts[1], 10) || 0;
        await this.scheduleDailyReminder(hour, minute);
      } else {
        await this.cancelDailyReminder();
      }

      return true;
    } catch (err) {
      console.warn('notificationService.savePreferences exception:', err);
      return false;
    }
  },
};
