import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import * as ImagePicker from 'expo-image-picker';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';

import { TabKey, ThemeMode, Tx, NotificationPreferences } from './src/models/types';
import { ThemeProvider, useThemeContext } from './src/context/ThemeContext';
import { AuthProvider, useAuthContext } from './src/context/AuthContext';
import { useTransactions } from './src/controllers/useTransactions';
import { usePortfolio } from './src/controllers/usePortfolio';
import { useBudget } from './src/controllers/useBudget';
import { SaveReceiptTxOutcome, useMagicReceipt } from './src/controllers/useMagicReceipt';
import { useAutoPortfolioScan } from './src/controllers/useAutoPortfolioScan';
import { accountService } from './src/services/db/accountService';
import { profileService } from './src/services/db/profileService';
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
  const [editingTx, setEditingTx] = useState<Tx | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isSetBudgetOpen, setIsSetBudgetOpen] = useState(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES
  );

  // Horizontal Swiping Pager Mechanics
  const { width: screenWidth } = useWindowDimensions();
  const horizontalScrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);

  useEffect(() => {
    setActiveTab('home');
  }, [isLoggedIn, currentUser.id]);

  // Sync user's saved theme_mode from cloud profile on login
  useEffect(() => {
    if (!isLoggedIn || typeof currentUser.id !== 'string' || !currentUser.id.includes('-')) return;
    let mounted = true;
    profileService.fetchProfile(currentUser.id).then((profile) => {
      if (mounted && profile?.themeMode) {
        setThemeMode(profile.themeMode);
      }
    });
    return () => {
      mounted = false;
    };
  }, [isLoggedIn, currentUser.id]);

  const handleSelectThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    if (typeof currentUser.id === 'string' && currentUser.id.includes('-')) {
      profileService.updateProfile(currentUser.id, { themeMode: mode });
    }
  };

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
    editTransaction,
    removeTransaction,
    refreshTransactions,
  } = useTransactions(currentUser.id);

  const {
    accounts,
    totalBalance,
    pillars,
    updateBalance,
    removeAccount,
    syncAccountBalanceLocal,
    deductAccountBalance,
    refreshAccounts,
  } = usePortfolio(currentUser.id);

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
    refreshBudget,
  } = useBudget(transactions, currentUser.id);

  const handleRefreshAll = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshAccounts(), refreshTransactions(), refreshBudget()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshAccounts, refreshTransactions, refreshBudget]);

  // Resolve guaranteed valid UUID account for remote users even during fast post-login scans
  const resolveTargetAccountId = async (newTx: Tx): Promise<string | number> => {
    const isRemoteUser = typeof currentUser.id === 'string' && currentUser.id.includes('-');
    if (!isRemoteUser) {
      return newTx.account_id ?? (accounts.length > 0 ? accounts[0].account_id : 1);
    }

    if (typeof newTx.account_id === 'string' && newTx.account_id.includes('-')) {
      return newTx.account_id;
    }

    let pool = accounts.filter((a) => typeof a.account_id === 'string' && a.account_id.includes('-'));
    if (pool.length === 0) {
      const fresh = await accountService.fetchAccounts(currentUser.id as string);
      if (fresh && fresh.length > 0) {
        pool = fresh;
      }
    }

    if (pool.length === 0) {
      return newTx.account_id ?? 1;
    }

    const methodLower = (newTx.metode_bayar || '').trim().toLowerCase();
    const byName = pool.find((a) => a.nama_akun.trim().toLowerCase() === methodLower);
    if (byName) return byName.account_id;

    const targetType = methodLower.includes('wallet')
      ? 'ewallet'
      : methodLower.includes('invest')
      ? 'investasi'
      : 'bank';
    const byType = pool.find((a) => a.tipe === targetType) ?? pool[0];
    return byType.account_id;
  };

  const handleTransactionAdded = async (
    newTx: Tx,
    scanId?: string | null
  ): Promise<SaveReceiptTxOutcome> => {
    const isRemoteUser = typeof currentUser.id === 'string' && currentUser.id.includes('-');
    const targetAccountId = await resolveTargetAccountId(newTx);
    const txWithAccount: Tx = { ...newTx, account_id: targetAccountId };
    const prevAccount = accounts.find((a) => a.account_id === targetAccountId);
    const prevBalance = prevAccount ? prevAccount.saldo : null;

    deductAccountBalance(targetAccountId, txWithAccount.amount, txWithAccount.income, isRemoteUser);
    const res = await addTransaction(txWithAccount, scanId);

    if (isRemoteUser) {
      if (!res.transactionId) {
        // Roll back optimistic account balance when cloud save failed
        if (prevBalance !== null) {
          syncAccountBalanceLocal(targetAccountId, prevBalance);
        }
        return {
          success: false,
          transactionId: null,
          error:
            res.error ||
            'Transaksi gagal disimpan ke database cloud. Periksa koneksi internet dan status server Supabase.',
        };
      }

      if (res.usedAtomicRpc && res.newBalance !== null && res.accountId) {
        syncAccountBalanceLocal(res.accountId, res.newBalance);
      } else if (
        !res.usedAtomicRpc &&
        typeof targetAccountId === 'string' &&
        targetAccountId.includes('-') &&
        prevBalance !== null
      ) {
        const delta = txWithAccount.income ? txWithAccount.amount : -txWithAccount.amount;
        const fallbackBalance = Math.max(0, prevBalance + delta);
        await accountService.updateAccountBalance(targetAccountId, fallbackBalance);
      } else {
        await refreshAccounts();
      }
    }

    return {
      success: true,
      transactionId: res.transactionId,
    };
  };

  const handleTransactionUpdated = async (
    updatedTx: Tx
  ): Promise<{ success: boolean; error?: string }> => {
    const originalTx = editingTx;
    if (!originalTx) {
      return handleTransactionAdded(updatedTx);
    }

    const isRemoteUser = typeof currentUser.id === 'string' && currentUser.id.includes('-');
    const res = await editTransaction(originalTx.id, updatedTx);

    if (!res.updated) {
      return {
        success: false,
        error: res.error || 'Gagal memperbarui transaksi di database.',
      };
    }

    if (isRemoteUser) {
      if (res.usedAtomicRpc) {
        if (res.oldAccountId && res.oldAccountBalance !== null) {
          syncAccountBalanceLocal(res.oldAccountId, res.oldAccountBalance);
        }
        if (res.newAccountId && res.newAccountBalance !== null) {
          syncAccountBalanceLocal(res.newAccountId, res.newAccountBalance);
        }
      } else {
        await refreshAccounts();
      }
    } else {
      // Offline demo local reconciliation: reverse old impact, apply new impact
      if (originalTx.account_id !== undefined) {
        deductAccountBalance(originalTx.account_id, originalTx.amount, !originalTx.income, true);
      }
      if (updatedTx.account_id !== undefined) {
        deductAccountBalance(updatedTx.account_id, updatedTx.amount, updatedTx.income, true);
      }
    }

    setEditingTx(null);
    return { success: true };
  };

  const handleTransactionDeleted = async (tx: Tx) => {
    const isRemoteUser = typeof currentUser.id === 'string' && currentUser.id.includes('-');
    const prevAccount =
      tx.account_id !== undefined
        ? accounts.find((a) => a.account_id === tx.account_id)
        : undefined;
    const prevBalance = prevAccount ? prevAccount.saldo : null;

    if (tx.account_id !== undefined) {
      deductAccountBalance(tx.account_id, tx.amount, !tx.income, isRemoteUser);
    }
    const res = await removeTransaction(tx.id);

    if (isRemoteUser) {
      if (!res.deleted) {
        if (tx.account_id !== undefined && prevBalance !== null) {
          syncAccountBalanceLocal(tx.account_id, prevBalance);
        }
        Alert.alert(
          'Gagal Menghapus Transaksi',
          res.error || 'Transaksi gagal dihapus dari server. Silakan coba lagi.'
        );
        return;
      }
      if (res.accountId && res.newBalance !== null) {
        syncAccountBalanceLocal(res.accountId, res.newBalance);
      }
    }
  };

  const magicReceipt = useMagicReceipt(handleTransactionAdded, currentUser.id);
  const autoPortfolio = useAutoPortfolioScan(updateBalance, currentUser.id);

  // Avatar Picker (Static import for Expo Go, APK & Web compatibility)
  const pickAvatar = async () => {
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
      Alert.alert('Tidak Didukung', 'Fitur pemilihan foto profil tidak tersedia di perangkat ini.');
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
            onOpenAddModal={() => {
              setEditingTx(null);
              setIsAddModalOpen(true);
            }}
            onScanReceipt={() => magicReceipt.setIsOpen(true)}
            onOpenAutoPortfolio={() => autoPortfolio.openModal('scan')}
            onEditTransaction={(tx) => {
              setEditingTx(tx);
              setIsAddModalOpen(true);
            }}
            onDeleteTransaction={handleTransactionDeleted}
            isRefreshing={isRefreshing}
            onRefresh={handleRefreshAll}
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
            onEditTransaction={(tx) => {
              setEditingTx(tx);
              setIsAddModalOpen(true);
            }}
            onDeleteTransaction={handleTransactionDeleted}
            isRefreshing={isRefreshing}
            onRefresh={handleRefreshAll}
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
            isRefreshing={isRefreshing}
            onRefresh={handleRefreshAll}
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
            notificationSubtitle={
              notifPrefs.dailyReminder
                ? `Aktif (${notifPrefs.reminderTime} WIB)`
                : 'Nonaktif'
            }
            totalBalance={totalBalance}
            bottomSafeInset={insets.bottom}
          />
        </View>
      </ScrollView>

      {/* 1. Modal Catat & Ubah Transaksi Manual (Dengan Kalender & RPC Atomik) */}
      <AddTransactionModal
        visible={isAddModalOpen}
        editingTx={editingTx}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTx(null);
        }}
        onSave={editingTx ? handleTransactionUpdated : handleTransactionAdded}
        accounts={accounts}
        bottomSafeInset={insets.bottom}
      />

      {/* 2. Modal Pindai Struk (Kamera & Galeri Murni + Edit Tanggal & Validasi Bulan Aktif) */}
      <MagicReceiptModal
        visible={magicReceipt.isOpen}
        step={magicReceipt.step}
        isSaving={magicReceipt.isSaving}
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
        onDeleteAccount={(acc) => removeAccount(acc.account_id)}
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

      {/* 4. Modal Pilihan Tema (Light / Dark / System — Persist ke Local & Supabase) */}
      <ThemeModal
        visible={isThemeModalOpen}
        currentMode={themeMode}
        onSelectMode={handleSelectThemeMode}
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
