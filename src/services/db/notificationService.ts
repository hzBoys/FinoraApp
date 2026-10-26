import AsyncStorage from '@react-native-async-storage/async-storage';
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

export const notificationService = {
  async loadPreferences(userId?: string | number): Promise<NotificationPreferences> {
    try {
      // 1. Try local storage first for fast response
      const localKey = `${STORAGE_KEY_PREFIX}${userId || 'local'}`;
      const cached = await AsyncStorage.getItem(localKey);
      let localPrefs: NotificationPreferences = DEFAULT_NOTIFICATION_PREFERENCES;
      if (cached) {
        localPrefs = { ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(cached) };
      }

      // 2. If authenticated with Supabase UUID, sync from user_metadata
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

  async savePreferences(
    userId: string | number | undefined,
    preferences: NotificationPreferences
  ): Promise<boolean> {
    try {
      const localKey = `${STORAGE_KEY_PREFIX}${userId || 'local'}`;
      await AsyncStorage.setItem(localKey, JSON.stringify(preferences));

      // Sync to Supabase if UUID user
      if (userId && typeof userId === 'string' && userId.includes('-')) {
        const { error } = await supabase.auth.updateUser({
          data: {
            notification_preferences: preferences,
          },
        });
        if (error) {
          console.warn('notificationService.savePreferences Supabase error:', error.message);
          return false;
        }
      }
      return true;
    } catch (err) {
      console.warn('notificationService.savePreferences exception:', err);
      return false;
    }
  },
};
