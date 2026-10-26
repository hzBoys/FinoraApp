import { supabase } from '../supabase';
import { UserProfile } from '../../models/types';

export const profileService = {
  async fetchProfile(userId: string): Promise<UserProfile | null> {
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
      };
    } catch (err) {
      console.warn('profileService.fetchProfile exception:', err);
      return null;
    }
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
    try {
      const payload: any = {};
      if (updates.nama !== undefined) payload.nama = updates.nama;
      if (updates.username !== undefined) payload.username = updates.username;
      if (updates.email !== undefined) payload.email = updates.email;
      if (updates.avatarUri !== undefined) payload.avatar_url = updates.avatarUri;

      payload.updated_at = new Date().toISOString();

      const { error } = await supabase.from('users').update(payload).eq('id', userId);

      if (error) {
        console.warn('profileService.updateProfile warning:', error.message);
        return false;
      }

      return true;
    } catch (err) {
      console.warn('profileService.updateProfile exception:', err);
      return false;
    }
  },
};
