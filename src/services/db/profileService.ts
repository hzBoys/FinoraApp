import { supabase } from '../supabase';
import { ThemeMode, UserProfile } from '../../models/types';

export type ProfileUpdateResult = {
  success: boolean;
  error?: string;
};

export const profileService = {
  async fetchProfile(userId: string): Promise<(UserProfile & { themeMode?: ThemeMode }) | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('profileService.fetchProfile warning:', error.message);
        return null;
      }

      if (!data) return null;

      return {
        id: data.id,
        nama: data.nama,
        username: data.username,
        email: data.email,
        avatarUri: data.avatar_url,
        role: data.role || 'Pengguna Finora',
        themeMode: (data.theme_mode as ThemeMode) || undefined,
      };
    } catch (err) {
      console.warn('profileService.fetchProfile exception:', err);
      return null;
    }
  },

  async updateProfile(
    userId: string,
    updates: Partial<UserProfile> & { themeMode?: ThemeMode }
  ): Promise<ProfileUpdateResult> {
    try {
      const payload: Record<string, unknown> = {};
      if (updates.nama !== undefined) payload.nama = updates.nama.trim();
      if (updates.username !== undefined) payload.username = updates.username.trim().toLowerCase();
      if (updates.email !== undefined) payload.email = updates.email.trim().toLowerCase();
      if (updates.avatarUri !== undefined) payload.avatar_url = updates.avatarUri;
      if (updates.themeMode !== undefined) payload.theme_mode = updates.themeMode;

      payload.updated_at = new Date().toISOString();

      const { error } = await supabase.from('users').update(payload).eq('id', userId);

      if (error) {
        console.warn('profileService.updateProfile warning:', error.message);
        if (error.code === '23505') {
          return {
            success: false,
            error: 'Username atau email tersebut sudah digunakan oleh pengguna lain.',
          };
        }
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      console.warn('profileService.updateProfile exception:', err);
      return { success: false, error: err?.message || 'Gagal memperbarui profil.' };
    }
  },
};
