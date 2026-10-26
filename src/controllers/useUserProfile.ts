import { useState } from 'react';
import { Alert } from 'react-native';
import { UserProfile } from '../models/types';

export const INITIAL_USER: UserProfile = {
  id: 1,
  nama: 'Pengguna',
  username: 'userfinora',
  email: 'user@finora.app',
  avatarUri: null,
  role: 'Pengguna Finora',
};

export function useUserProfile() {
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);

  const updateProfile = (data: Partial<UserProfile>) => {
    setUser((prev) => ({
      ...prev,
      ...data,
    }));
  };

  const pickAvatar = async () => {
    let ImagePicker: any = null;
    try {
      ImagePicker = require('expo-image-picker');
    } catch {
      ImagePicker = null;
    }

    if (ImagePicker && ImagePicker.launchImageLibraryAsync) {
      try {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            'Izin Akses Diperlukan',
            'Finora membutuhkan izin galeri untuk memilih foto profil.'
          );
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          updateProfile({ avatarUri: result.assets[0].uri });
        }
      } catch {
        Alert.alert('Gagal', 'Terjadi kendala saat membuka galeri foto.');
      }
    } else {
      Alert.alert(
        'Foto Profil',
        'Pilih opsi foto profil demo atau hapus foto.',
        [
          {
            text: 'Gunakan Avatar 1 (Pria)',
            onPress: () => {
              updateProfile({
                avatarUri:
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
              });
            },
          },
          {
            text: 'Gunakan Avatar 2 (Wanita)',
            onPress: () => {
              updateProfile({
                avatarUri:
                  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
              });
            },
          },
          ...(user.avatarUri
            ? [
                {
                  text: 'Hapus Foto (Gunakan Inisial)',
                  style: 'destructive' as const,
                  onPress: () => updateProfile({ avatarUri: null }),
                },
              ]
            : []),
          { text: 'Batal', style: 'cancel' as const },
        ]
      );
    }
  };

  return {
    user,
    updateProfile,
    pickAvatar,
  };
}
