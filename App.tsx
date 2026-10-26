import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  View,
} from 'react-native';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';

import { TabKey, Tx, NotificationPreferences } from './src/models/types';
import { ThemeProvider, useThemeContext } from './src/context/ThemeContext';
import { AuthProvider, useAuthContext } from './src/context/AuthContext';
import { useTransactions } from './src/controllers/useTransactions';
import { usePortfolio } from './src/controllers/usePortfolio';
import { useBudget } from './src/controllers/useBudget';
import { useMagicReceipt } from './src/controllers/useMagicReceipt';
import {
  notificationService,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from './src/services/db/notificationService';

import { AppHeader } from './src/views/components/navigation/AppHeader';
import { BottomTabBar } from './src/views/components/navigation/BottomTabBar';
import { AddTransactionModal } from './src/views/components/transactions/AddTransactionModal';
import { MagicReceiptModal } from './src/views/components/modals/MagicReceiptModal';
import { EditProfileModal } from './src/views/components/modals/EditProfileModal';
import { ThemeModal } from './src/views/components/modals/ThemeModal';
import { ForgotPasswordModal } from './src/views/components/modals/ForgotPasswordModal';
import { SetBudgetModal } from './src/views/components/modals/SetBudgetModal';
import { NotificationSettingsModal } from './src/views/components/modals/NotificationSettingsModal';

import { LoginScreen } from './src/views/screens/LoginScreen';
import { RegisterScreen } from './src/views/screens/RegisterScreen';
import { HomeScreen } from './src/views/screens/HomeScreen';
import { TransactionsScreen } from './src/views/screens/TransactionsScreen';
import { BudgetScreen } from './src/views/screens/BudgetScreen';
import { ProfileScreen } from './src/views/screens/ProfileScreen';

function MainApp() {
  const { colors, isDark, themeMode, setThemeMode } = useThemeContext();
  const { isLoggedIn, currentUser, updateCurrentUser, isLoadingAuth } = useAuthContext();

  // Screen & Auth Navigation States (default to 'login')
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  // Tab & Modal States
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isSetBudgetOpen, setIsSetBudgetOpen] = useState(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES
  );

  // Sync notification preferences on user change
  useEffect(() => {
    let isMounted = true;
    async function loadNotif() {
      const p = await notificationService.loadPreferences(currentUser.id);
      if (isMounted) {
        setNotifPrefs(p);
      }
    }
    loadNotif();
    return () => {
      isMounted = false;
    };
  }, [currentUser.id]);

  const handleSaveNotifPrefs = async (newPrefs: NotificationPreferences) => {
    setNotifPrefs(newPrefs);
    await notificationService.savePreferences(currentUser.id, newPrefs);
  };

  // Controllers
  const {
    transactions,
    filtered,
    query,
    setQuery,
    activeCat,
    setActiveCat,
    totalIn,
    totalConsumptionOut,
    filteredIn,
    filteredOut,
    recentTransactions,
    addTransaction,
  } = useTransactions(currentUser.id);

  const { accounts, totalBalance, pillars, deductAccountBalance } = usePortfolio(currentUser.id);

  const handleTransactionAdded = (newTx: Tx) => {
    addTransaction(newTx);
    const targetAccountId = newTx.account_id ?? (accounts.length > 0 ? accounts[0].account_id : 1);
    deductAccountBalance(targetAccountId, newTx.amount, newTx.income);
  };

  const magicReceipt = useMagicReceipt(handleTransactionAdded);

  const {
    budget,
    categorySpendings,
    totalUsed,
    totalPct,
    totalRemaining,
    unallocated,
    nearLimitCategories,
    advisorAnalysis,
    setBudgetLimit,
  } = useBudget(transactions, currentUser.id);

  // Avatar Picker
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
          Alert.alert('Izin Galeri', 'Finora memerlukan akses galeri foto untuk mengubah profil.');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          updateCurrentUser({ avatarUri: result.assets[0].uri });
        }
      } catch {
        Alert.alert('Gagal', 'Terjadi kendala saat memilih foto.');
      }
    } else {
      Alert.alert(
        'Foto Profil',
        'Pilih opsi foto profil demo atau hapus foto.',
        [
          {
            text: 'Avatar Ilustrasi 1',
            onPress: () =>
              updateCurrentUser({
                avatarUri:
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
              }),
          },
          {
            text: 'Avatar Ilustrasi 2',
            onPress: () =>
              updateCurrentUser({
                avatarUri:
                  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
              }),
          },
          ...(currentUser.avatarUri
            ? [
                {
                  text: 'Hapus Foto (Gunakan Inisial)',
                  style: 'destructive' as const,
                  onPress: () => updateCurrentUser({ avatarUri: null }),
                },
              ]
            : []),
          { text: 'Batal', style: 'cancel' as const },
        ]
      );
    }
  };

  // If checking authentication session
  if (isLoadingAuth) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // If Not Logged In, Render Authentication Flow
  if (!isLoggedIn) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        {authScreen === 'login' ? (
          <LoginScreen
            onGoToRegister={() => setAuthScreen('register')}
            onOpenForgotPassword={() => setIsForgotPasswordOpen(true)}
          />
        ) : (
          <RegisterScreen onGoToLogin={() => setAuthScreen('login')} />
        )}

        <ForgotPasswordModal
          visible={isForgotPasswordOpen}
          onClose={() => setIsForgotPasswordOpen(false)}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <AppHeader
        userName={currentUser.nama}
        avatarUri={currentUser.avatarUri}
        onPressProfile={() => setActiveTab('profile')}
      />

      {/* Main Screen Views */}
      {activeTab === 'home' && (
        <HomeScreen
          totalBalance={totalBalance}
          pillars={pillars}
          totalIn={totalIn}
          totalOut={totalConsumptionOut}
          totalBudget={budget.total_anggaran}
          totalUsed={totalUsed}
          totalPct={totalPct}
          totalRemaining={totalRemaining}
          categorySpendings={categorySpendings}
          advisorRecommendation={advisorAnalysis.recommendationText}
          recentTransactions={recentTransactions}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onScanReceipt={() => magicReceipt.setIsOpen(true)}
        />
      )}

      {activeTab === 'transactions' && (
        <TransactionsScreen
          transactions={filtered}
          query={query}
          onChangeQuery={setQuery}
          activeCat={activeCat}
          onSelectCat={setActiveCat}
          totalIn={filteredIn}
          totalOut={filteredOut}
        />
      )}

      {activeTab === 'budget' && (
        <BudgetScreen
          periode={budget.periode}
          totalBudget={budget.total_anggaran}
          totalUsed={totalUsed}
          totalPct={totalPct}
          totalRemaining={totalRemaining}
          unallocated={unallocated}
          categorySpendings={categorySpendings}
          nearLimitCategories={nearLimitCategories}
          onOpenSetBudget={() => setIsSetBudgetOpen(true)}
        />
      )}

      {activeTab === 'profile' && (
        <ProfileScreen
          user={currentUser}
          themeMode={themeMode}
          onPickImage={pickAvatar}
          onOpenEditProfile={() => setIsEditProfileOpen(true)}
          onOpenThemeModal={() => setIsThemeModalOpen(true)}
          onOpenNotificationSettings={() => setIsNotifModalOpen(true)}
          notificationSubtitle={
            notifPrefs.dailyReminder
              ? `Aktif (${notifPrefs.reminderTime} WIB)`
              : 'Nonaktif'
          }
          totalBalance={totalBalance}
        />
      )}

      {/* 1. Modal Catat Transaksi Manual (Dengan Kalender) */}
      <AddTransactionModal
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleTransactionAdded}
        accounts={accounts}
      />

      {/* 2. Modal Pindai Struk (Kamera & Galeri Murni) */}
      <MagicReceiptModal
        visible={magicReceipt.isOpen}
        step={magicReceipt.step}
        imageUri={magicReceipt.receiptImageUri}
        extractedData={magicReceipt.extractedData}
        progress={magicReceipt.ocrProgress}
        onClose={magicReceipt.reset}
        onLaunchCamera={magicReceipt.handleLaunchCamera}
        onPickGallery={magicReceipt.handlePickGallery}
        onConfirm={magicReceipt.confirmAndSaveTransaction}
        accounts={accounts}
      />

      {/* 3. Modal Edit Profil / Pengaturan Akun */}
      <EditProfileModal
        visible={isEditProfileOpen}
        user={currentUser}
        onClose={() => setIsEditProfileOpen(false)}
        onSave={updateCurrentUser}
        onPickAvatar={pickAvatar}
      />

      {/* 4. Modal Pilihan Tema (Light / Dark / System) */}
      <ThemeModal
        visible={isThemeModalOpen}
        currentMode={themeMode}
        onSelectMode={setThemeMode}
        onClose={() => setIsThemeModalOpen(false)}
      />

      {/* 5. Modal Atur Batas Anggaran (Smart Advisor / Manual) */}
      <SetBudgetModal
        visible={isSetBudgetOpen}
        currentTotal={budget.total_anggaran}
        onSave={setBudgetLimit}
        onClose={() => setIsSetBudgetOpen(false)}
      />

      {/* 6. Modal Pengaturan Notifikasi */}
      <NotificationSettingsModal
        visible={isNotifModalOpen}
        preferences={notifPrefs}
        onSave={handleSaveNotifPrefs}
        onClose={() => setIsNotifModalOpen(false)}
      />

      {/* Bottom Navigation Tab Bar */}
      <BottomTabBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />
    </View>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });
  const [fontTimedOut, setFontTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFontTimedOut(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  if (!fontsLoaded && !fontError && !fontTimedOut) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F4F6F4', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#14382C" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
