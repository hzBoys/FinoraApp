import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { useAutoPortfolioScan } from './src/controllers/useAutoPortfolioScan';
import { useFinancialProfile } from './src/controllers/useFinancialProfile';
import { accountService } from './src/services/db/accountService';
import { resolveImagePayload, storageService } from './src/services/db/storageService';
import {
  notificationService,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from './src/services/db/notificationService';

import { AppHeader } from './src/views/components/navigation/AppHeader';
import { BottomTabBar, TABS } from './src/views/components/navigation/BottomTabBar';
import { AddTransactionModal } from './src/views/components/transactions/AddTransactionModal';
import { MagicReceiptModal } from './src/views/components/modals/MagicReceiptModal';
import { AutoPortfolioModal } from './src/views/components/modals/AutoPortfolioModal';
import { EditProfileModal } from './src/views/components/modals/EditProfileModal';
import { ThemeModal } from './src/views/components/modals/ThemeModal';
import { ForgotPasswordModal } from './src/views/components/modals/ForgotPasswordModal';
import { SetBudgetModal } from './src/views/components/modals/SetBudgetModal';
import { NotificationSettingsModal } from './src/views/components/modals/NotificationSettingsModal';
import { FinancialProfileModal } from './src/views/components/modals/FinancialProfileModal';

import { LoginScreen } from './src/views/screens/LoginScreen';
import { RegisterScreen } from './src/views/screens/RegisterScreen';
import { HomeScreen } from './src/views/screens/HomeScreen';
import { TransactionsScreen } from './src/views/screens/TransactionsScreen';
import { BudgetScreen } from './src/views/screens/BudgetScreen';
import { ProfileScreen } from './src/views/screens/ProfileScreen';

function MainApp() {
  const { colors, isDark, themeMode, setThemeMode } = useThemeContext();
  const { isLoggedIn, currentUser, updateCurrentUser, isLoadingAuth } = useAuthContext();
  const insets = useSafeAreaInsets();

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
  const [isFinancialProfileOpen, setIsFinancialProfileOpen] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES
  );

  // Horizontal Swiping Pager Mechanics
  const { width: screenWidth } = useWindowDimensions();
  const horizontalScrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);

  useEffect(() => {
    setActiveTab('home');
  }, [isLoggedIn, currentUser.id]);

  const handleSelectTab = (tabKey: TabKey) => {
    const index = TABS.findIndex((t) => t.key === tabKey);
    if (index !== -1) {
      setActiveTab(tabKey);
      horizontalScrollRef.current?.scrollTo({
        x: index * screenWidth,
        animated: true,
      });
    }
  };

  const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(contentOffsetX / screenWidth);
    const targetTab = TABS[pageIndex]?.key;
    if (targetTab && targetTab !== activeTab) {
      setActiveTab(targetTab);
    }
  };

  // Sync notification preferences on user change & initialize native channels
  useEffect(() => {
    let isMounted = true;
    async function loadNotif() {
      await notificationService.initNotificationChannels();
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
    removeTransaction,
  } = useTransactions(currentUser.id);

  const {
    accounts,
    totalBalance,
    pillars,
    updateBalance,
    syncAccountBalanceLocal,
    deductAccountBalance,
  } = usePortfolio(currentUser.id);

  const handleTransactionAdded = async (newTx: Tx) => {
    const targetAccountId = newTx.account_id ?? (accounts.length > 0 ? accounts[0].account_id : 1);
    const txWithAccount: Tx = { ...newTx, account_id: targetAccountId };
    const isRemoteUser = typeof currentUser.id === 'string' && currentUser.id.includes('-');

    deductAccountBalance(targetAccountId, txWithAccount.amount, txWithAccount.income, isRemoteUser);
    const res = await addTransaction(txWithAccount);

    if (isRemoteUser) {
      if (res.usedAtomicRpc && res.newBalance !== null && res.accountId) {
        syncAccountBalanceLocal(res.accountId, res.newBalance);
      } else if (
        !res.usedAtomicRpc &&
        typeof targetAccountId === 'string' &&
        targetAccountId.includes('-')
      ) {
        const targetAcc = accounts.find((a) => a.account_id === targetAccountId);
        if (targetAcc) {
          const delta = txWithAccount.income ? txWithAccount.amount : -txWithAccount.amount;
          const fallbackBalance = Math.max(0, targetAcc.saldo + delta);
          await accountService.updateAccountBalance(targetAccountId, fallbackBalance);
        }
      }
    }

    return res.transactionId;
  };

  const handleTransactionDeleted = async (tx: Tx) => {
    const isRemoteUser = typeof currentUser.id === 'string' && currentUser.id.includes('-');
    if (tx.account_id !== undefined) {
      deductAccountBalance(tx.account_id, tx.amount, !tx.income, isRemoteUser);
    }
    const res = await removeTransaction(tx.id);
    if (isRemoteUser && res.accountId && res.newBalance !== null) {
      syncAccountBalanceLocal(res.accountId, res.newBalance);
    }
  };

  const magicReceipt = useMagicReceipt(handleTransactionAdded, currentUser.id);
  const autoPortfolio = useAutoPortfolioScan(updateBalance, currentUser.id);
  const financialProfile = useFinancialProfile(currentUser.id);

  const {
    budget,
    categorySpendings,
    categoryLimits,
    totalUsed,
    totalPct,
    totalRemaining,
    unallocated,
    nearLimitCategories,
    advisorRecommendationText,
    isAiRecommendation,
    isGeneratingAdvice,
    setBudgetLimit,
    refreshAiAdvisor,
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
          quality: 0.7,
          base64: true,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          await updateCurrentUser({ avatarUri: asset.uri });

          if (typeof currentUser.id === 'string' && currentUser.id.includes('-')) {
            const imgPayload = await resolveImagePayload(asset.uri, asset.base64, asset.mimeType);
            if (imgPayload) {
              const cloudUrl = await storageService.uploadAvatarImage(
                currentUser.id,
                imgPayload.base64,
                imgPayload.mimeType
              );
              if (cloudUrl) {
                await updateCurrentUser({ avatarUri: cloudUrl });
              }
            }
          }
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
          bottomSafeInset={insets.bottom}
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
        onPressProfile={() => handleSelectTab('profile')}
      />

      {/* Horizontal Paging Screen Container for Seamless Sliding */}
      <ScrollView
        ref={horizontalScrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        style={styles.pager}
      >
        <View style={{ width: screenWidth, flex: 1 }}>
          <HomeScreen
            totalBalance={totalBalance}
            pillars={pillars}
            accountCount={accounts.length}
            totalIn={totalIn}
            totalOut={totalConsumptionOut}
            totalBudget={budget.total_anggaran}
            totalUsed={totalUsed}
            totalPct={totalPct}
            totalRemaining={totalRemaining}
            categorySpendings={categorySpendings}
            advisorRecommendation={advisorRecommendationText}
            isAiRecommendation={isAiRecommendation}
            isGeneratingAdvice={isGeneratingAdvice}
            onRefreshAdvisor={refreshAiAdvisor}
            recentTransactions={recentTransactions}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onScanReceipt={() => magicReceipt.setIsOpen(true)}
            onOpenAutoPortfolio={() => autoPortfolio.openModal('scan')}
            onDeleteTransaction={handleTransactionDeleted}
            bottomSafeInset={insets.bottom}
          />
        </View>

        <View style={{ width: screenWidth, flex: 1 }}>
          <TransactionsScreen
            transactions={filtered}
            query={query}
            onChangeQuery={setQuery}
            activeCat={activeCat}
            onSelectCat={setActiveCat}
            totalIn={filteredIn}
            totalOut={filteredOut}
            onDeleteTransaction={handleTransactionDeleted}
            bottomSafeInset={insets.bottom}
          />
        </View>

        <View style={{ width: screenWidth, flex: 1 }}>
          <BudgetScreen
            periode={budget.periode}
            totalBudget={budget.total_anggaran}
            totalUsed={totalUsed}
            totalPct={totalPct}
            totalRemaining={totalRemaining}
            unallocated={unallocated}
            categorySpendings={categorySpendings}
            nearLimitCategories={nearLimitCategories}
            advisorRecommendation={advisorRecommendationText}
            isAiRecommendation={isAiRecommendation}
            isGeneratingAdvice={isGeneratingAdvice}
            onRefreshAdvisor={refreshAiAdvisor}
            onOpenSetBudget={() => setIsSetBudgetOpen(true)}
            bottomSafeInset={insets.bottom}
          />
        </View>

        <View style={{ width: screenWidth, flex: 1 }}>
          <ProfileScreen
            user={currentUser}
            themeMode={themeMode}
            onPickImage={pickAvatar}
            onOpenEditProfile={() => setIsEditProfileOpen(true)}
            onOpenThemeModal={() => setIsThemeModalOpen(true)}
            onOpenNotificationSettings={() => setIsNotifModalOpen(true)}
            onOpenFinancialProfile={() => setIsFinancialProfileOpen(true)}
            notificationSubtitle={
              notifPrefs.dailyReminder
                ? `Aktif (${notifPrefs.reminderTime} WIB)`
                : 'Nonaktif'
            }
            financialProfileSubtitle={
              financialProfile.isLoading
                ? 'Memuat profil...'
                : financialProfile.profile
                ? `Langkah ${financialProfile.profile.profile_step_completed} dari 3 selesai`
                : 'Lengkapi data finansialmu'
            }
            totalBalance={totalBalance}
            bottomSafeInset={insets.bottom}
          />
        </View>
      </ScrollView>

      {/* 1. Modal Catat Transaksi Manual (Dengan Kalender) */}
      <AddTransactionModal
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleTransactionAdded}
        accounts={accounts}
        bottomSafeInset={insets.bottom}
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
        bottomSafeInset={insets.bottom}
      />

      {/* 2B. Modal Auto-Portfolio (Scan Screenshot Saldo AI & Kelola Multi-Akun) */}
      <AutoPortfolioModal
        visible={autoPortfolio.isOpen}
        mode={autoPortfolio.mode}
        onChangeMode={autoPortfolio.setMode}
        step={autoPortfolio.step}
        imageUri={autoPortfolio.balanceImageUri}
        extractedData={autoPortfolio.extractedBalance}
        progress={autoPortfolio.ocrProgress}
        accounts={accounts}
        onClose={autoPortfolio.reset}
        onLaunchCamera={autoPortfolio.handleLaunchCamera}
        onPickGallery={autoPortfolio.handlePickGallery}
        onConfirmBalance={autoPortfolio.confirmAndSaveBalance}
        bottomSafeInset={insets.bottom}
      />

      {/* 3. Modal Edit Profil / Pengaturan Akun */}
      <EditProfileModal
        visible={isEditProfileOpen}
        user={currentUser}
        onClose={() => setIsEditProfileOpen(false)}
        onSave={updateCurrentUser}
        onPickAvatar={pickAvatar}
        bottomSafeInset={insets.bottom}
      />

      {/* 4. Modal Pilihan Tema (Light / Dark / System) */}
      <ThemeModal
        visible={isThemeModalOpen}
        currentMode={themeMode}
        onSelectMode={setThemeMode}
        onClose={() => setIsThemeModalOpen(false)}
        bottomSafeInset={insets.bottom}
      />

      {/* 5. Modal Atur Batas Anggaran (Smart Advisor / Manual) */}
      <SetBudgetModal
        visible={isSetBudgetOpen}
        currentTotal={budget.total_anggaran}
        currentLimits={categoryLimits}
        onSave={setBudgetLimit}
        onClose={() => setIsSetBudgetOpen(false)}
        bottomSafeInset={insets.bottom}
      />

      {/* 6. Modal Pengaturan Notifikasi */}
      <NotificationSettingsModal
        visible={isNotifModalOpen}
        preferences={notifPrefs}
        onSave={handleSaveNotifPrefs}
        onClose={() => setIsNotifModalOpen(false)}
        bottomSafeInset={insets.bottom}
      />

      {/* 7. Modal Profil Finansial */}
      <FinancialProfileModal
        visible={isFinancialProfileOpen}
        currentProfile={financialProfile.profile}
        isSaving={financialProfile.isLoading}
        onSaveStep={async (updates) => {
          await financialProfile.saveProfile(updates);
        }}
        onClose={() => setIsFinancialProfileOpen(false)}
        bottomSafeInset={insets.bottom}
      />

      {/* Bottom Navigation Tab Bar */}
      <BottomTabBar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        bottomSafeInset={insets.bottom}
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
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pager: {
    flex: 1,
  },
});
