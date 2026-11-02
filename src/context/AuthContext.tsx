import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../models/types';
import { INITIAL_USER } from '../controllers/useUserProfile';
import { isSupabaseConfigured, supabase } from '../services/supabase';
import { profileService } from '../services/db/profileService';

type AuthContextType = {
  isLoggedIn: boolean;
  isLoadingAuth: boolean;
  currentUser: UserProfile;
  login: (emailOrUser: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  register: (
    nama: string,
    username: string,
    email: string,
    pass: string
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  verifyResetOtp: (
    email: string,
    otp: string,
    newPass: string
  ) => Promise<{ success: boolean; message: string }>;
  updateCurrentUser: (data: Partial<UserProfile>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  isLoadingAuth: true,
  currentUser: INITIAL_USER,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: async () => {},
  resetPassword: async () => ({ success: false, message: '' }),
  verifyResetOtp: async () => ({ success: false, message: '' }),
  updateCurrentUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(isSupabaseConfigured);
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_USER);

  function splitEmail(email: string): string {
    return email.split('@')[0];
  }

  // Sync session on mount
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    async function initSession() {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          const user = data.session.user;
          const remoteProfile = await profileService.fetchProfile(user.id);
          if (remoteProfile) {
            setCurrentUser(remoteProfile);
          } else {
            setCurrentUser({
              id: user.id,
              nama: user.user_metadata?.nama || splitEmail(user.email || 'Pengguna'),
              username: user.user_metadata?.username || splitEmail(user.email || 'user'),
              email: user.email || '',
              avatarUri: null,
              role: 'Pengguna Finora',
            });
          }
          setIsLoggedIn(true);
        } else {
          setCurrentUser(INITIAL_USER);
          setIsLoggedIn(false);
        }
      } catch (err) {
        console.warn('Supabase session init error:', err);
        setCurrentUser(INITIAL_USER);
        setIsLoggedIn(false);
      } finally {
        setIsLoadingAuth(false);
      }
    }

    initSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const user = session.user;
        const remoteProfile = await profileService.fetchProfile(user.id);
        if (remoteProfile) {
          setCurrentUser(remoteProfile);
        } else {
          setCurrentUser({
            id: user.id,
            nama: user.user_metadata?.nama || splitEmail(user.email || 'Pengguna'),
            username: user.user_metadata?.username || splitEmail(user.email || 'user'),
            email: user.email || '',
            avatarUri: null,
            role: 'Pengguna Finora',
          });
        }
        setIsLoggedIn(true);
      } else {
        setCurrentUser(INITIAL_USER);
        setIsLoggedIn(false);
      }
      setIsLoadingAuth(false);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const login = async (emailOrUser: string, pass: string) => {
    const term = emailOrUser.trim().toLowerCase();

    // 1. Local Demo Account Support (explicit demo credentials only)
    if (
      (term === 'demo@finora.app' || term === 'userfinora' || term === 'demo') &&
      pass === 'password123'
    ) {
      setCurrentUser(INITIAL_USER);
      setIsLoggedIn(true);
      return { success: true };
    }

    if (!isSupabaseConfigured) {
      return {
        success: false,
        message: 'Konfigurasi Supabase belum tersedia di file .env.',
      };
    }

    // 2. Resolve username -> email via secure RPC if input is not an email
    let targetEmail = term;
    try {
      if (!term.includes('@')) {
        const { data: resolvedEmail, error: rpcError } = await supabase.rpc(
          'resolve_email_by_username',
          { p_username: term }
        );

        if (rpcError) {
          console.warn('resolve_email_by_username warning:', rpcError.message);
        }

        if (!resolvedEmail || typeof resolvedEmail !== 'string') {
          return {
            success: false,
            message: 'Username tidak ditemukan. Pastikan username sesuai atau masuk menggunakan email.',
          };
        }

        targetEmail = resolvedEmail.trim().toLowerCase();
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: pass,
      });

      if (error) {
        if (error.message.toLowerCase().includes('not confirmed')) {
          return {
            success: false,
            message:
              'Email belum dikonfirmasi. Pastikan opsi "Confirm email" di Dashboard Supabase telah dimatikan.',
          };
        }
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          return {
            success: false,
            message: 'Email/username atau kata sandi tidak sesuai.',
          };
        }
        return { success: false, message: error.message };
      }

      if (data?.user) {
        const remoteProfile = await profileService.fetchProfile(data.user.id);
        if (remoteProfile) {
          setCurrentUser(remoteProfile);
        } else {
          setCurrentUser({
            id: data.user.id,
            nama: data.user.user_metadata?.nama || splitEmail(targetEmail),
            username: data.user.user_metadata?.username || splitEmail(targetEmail),
            email: targetEmail,
            avatarUri: null,
            role: 'Pengguna Finora',
          });
        }
        setIsLoggedIn(true);
        return { success: true };
      }
    } catch (err) {
      console.warn('Supabase auth login exception:', err);
      return {
        success: false,
        message: 'Gagal terhubung ke server autentikasi. Periksa koneksi internet Anda.',
      };
    }

    return {
      success: false,
      message: 'Email/username atau kata sandi tidak sesuai. Silakan daftar jika belum memiliki akun.',
    };
  };

  const register = async (nama: string, username: string, email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim().toLowerCase();

    if (!isSupabaseConfigured) {
      return {
        success: false,
        message: 'Konfigurasi Supabase belum tersedia di file .env.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: pass,
        options: {
          data: {
            nama: nama.trim(),
            username: cleanUsername,
          },
        },
      });

      if (error) {
        console.warn('Supabase signUp error:', error.message);
        if (error.message.toLowerCase().includes('already registered')) {
          return {
            success: false,
            message: 'Email sudah terdaftar. Silakan masuk menggunakan akun Anda.',
          };
        }
        return { success: false, message: error.message };
      }

      if (data?.user) {
        if (!data.session) {
          await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: pass,
          });
        }

        const remoteProfile = await profileService.fetchProfile(data.user.id);
        if (remoteProfile) {
          setCurrentUser(remoteProfile);
        } else {
          setCurrentUser({
            id: data.user.id,
            nama: nama.trim(),
            username: cleanUsername,
            email: cleanEmail,
            avatarUri: null,
            role: 'Pengguna Finora',
          });
        }

        setIsLoggedIn(true);
        return { success: true };
      }
    } catch (err) {
      console.warn('Supabase signUp exception:', err);
      return {
        success: false,
        message: 'Gagal mendaftarkan akun. Periksa koneksi internet Anda dan coba lagi.',
      };
    }

    return {
      success: false,
      message: 'Pendaftaran tidak dapat diproses saat ini. Silakan coba lagi.',
    };
  };

  const logout = async () => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('Supabase signOut error:', err);
    }
    setCurrentUser(INITIAL_USER);
    setIsLoggedIn(false);
  };

  const resetPassword = async (email: string) => {
    const clean = email.trim().toLowerCase();
    if (!isSupabaseConfigured) {
      return {
        success: false,
        message: 'Konfigurasi Supabase belum tersedia di file .env.',
      };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(clean);
      if (error) {
        console.warn('Supabase resetPassword error:', error.message);
        return {
          success: false,
          message: error.message,
        };
      }

      return {
        success: true,
        message: `Kode verifikasi telah dikirim ke ${clean}.`,
      };
    } catch (err) {
      console.warn('Supabase resetPassword exception:', err);
      return {
        success: false,
        message: 'Gagal mengirim kode pemulihan. Periksa koneksi internet Anda.',
      };
    }
  };

  const verifyResetOtp = async (
    email: string,
    otp: string,
    newPass: string
  ): Promise<{ success: boolean; message: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    if (!isSupabaseConfigured) {
      return {
        success: false,
        message: 'Konfigurasi Supabase belum tersedia di file .env.',
      };
    }

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanOtp,
        type: 'recovery',
      });

      if (error) {
        console.warn('verifyOtp error:', error.message);
        return {
          success: false,
          message: error.message || 'Kode OTP tidak valid atau telah kedaluwarsa.',
        };
      }

      if (data?.session) {
        const { error: updateErr } = await supabase.auth.updateUser({
          password: newPass,
        });

        if (updateErr) {
          return {
            success: false,
            message: updateErr.message || 'Gagal memperbarui kata sandi.',
          };
        }

        // Sign out recovery session so user explicitly logs in with new password
        await supabase.auth.signOut();
        setCurrentUser(INITIAL_USER);
        setIsLoggedIn(false);

        return {
          success: true,
          message: 'Kata sandi Anda berhasil diperbarui! Silakan masuk dengan kata sandi baru.',
        };
      }
    } catch (err) {
      console.warn('verifyResetOtp exception:', err);
      return {
        success: false,
        message: 'Gagal memverifikasi kode OTP. Periksa koneksi internet Anda.',
      };
    }

    return {
      success: false,
      message: 'Kode OTP tidak valid atau telah kedaluwarsa.',
    };
  };

  const updateCurrentUser = async (data: Partial<UserProfile>) => {
    const prevEmail = currentUser.email;
    setCurrentUser((prev) => ({ ...prev, ...data }));

    if (typeof currentUser.id === 'string' && currentUser.id.includes('-')) {
      if (
        isSupabaseConfigured &&
        data.email &&
        data.email.trim().toLowerCase() !== prevEmail.trim().toLowerCase()
      ) {
        const { error: authEmailErr } = await supabase.auth.updateUser({
          email: data.email.trim().toLowerCase(),
        });
        if (authEmailErr) {
          console.warn('Supabase auth email sync warning:', authEmailErr.message);
        }
      }
      await profileService.updateProfile(currentUser.id, data);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isLoadingAuth,
        currentUser,
        login,
        register,
        logout,
        resetPassword,
        verifyResetOtp,
        updateCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
