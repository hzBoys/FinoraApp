import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const PIN_STORAGE_KEY = 'finora_security_pin';
export const PIN_ENABLED_STORAGE_KEY = 'finora_security_pin_enabled';
export const AUTOLOCK_DELAY_STORAGE_KEY = 'finora_security_autolock_delay';

export type AutolockOption = {
  label: string;
  seconds: number;
};

export const AUTOLOCK_OPTIONS: AutolockOption[] = [
  { label: 'Segera', seconds: 0 },
  { label: '1 Menit', seconds: 60 },
  { label: '5 Menit', seconds: 300 },
  { label: '15 Menit', seconds: 900 },
  { label: '1 Jam', seconds: 3600 },
  { label: 'Jangan Pernah', seconds: -1 },
];

type SecurityContextType = {
  isPinEnabled: boolean;
  autolockDelay: number; // in seconds
  isAppLocked: boolean;
  isLoadingSecurity: boolean;
  setPin: (newPin: string) => Promise<boolean>;
  removePin: (currentPin: string) => Promise<boolean>;
  changePin: (oldPin: string, newPin: string) => Promise<boolean>;
  setAutolockDelay: (seconds: number) => Promise<boolean>;
  verifyPin: (candidate: string) => boolean;
  unlockApp: (candidate: string) => boolean;
  lockApp: () => void;
};

const SecurityContext = createContext<SecurityContextType>({
  isPinEnabled: false,
  autolockDelay: 60,
  isAppLocked: false,
  isLoadingSecurity: true,
  setPin: async () => false,
  removePin: async () => false,
  changePin: async () => false,
  setAutolockDelay: async () => false,
  verifyPin: () => false,
  unlockApp: () => false,
  lockApp: () => {},
});

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [isPinEnabled, setIsPinEnabled] = useState<boolean>(false);
  const [autolockDelay, setAutolockDelayState] = useState<number>(60); // default 1 minute
  const [isAppLocked, setIsAppLocked] = useState<boolean>(false);
  const [isLoadingSecurity, setIsLoadingSecurity] = useState<boolean>(true);

  const backgroundTimestampRef = useRef<number | null>(null);
  const currentPinRef = useRef<string | null>(null);
  const isPinEnabledRef = useRef<boolean>(false);
  const autolockDelayRef = useRef<number>(60);

  useEffect(() => {
    currentPinRef.current = storedPin;
    isPinEnabledRef.current = isPinEnabled;
    autolockDelayRef.current = autolockDelay;
  }, [storedPin, isPinEnabled, autolockDelay]);

  // Load saved PIN settings on startup
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [savedPin, savedEnabled, savedDelay] = await Promise.all([
          AsyncStorage.getItem(PIN_STORAGE_KEY),
          AsyncStorage.getItem(PIN_ENABLED_STORAGE_KEY),
          AsyncStorage.getItem(AUTOLOCK_DELAY_STORAGE_KEY),
        ]);

        if (!isMounted) return;

        const enabled = savedEnabled === 'true' && !!savedPin;
        setStoredPin(savedPin);
        setIsPinEnabled(enabled);

        if (savedDelay !== null) {
          const parsed = parseInt(savedDelay, 10);
          if (!isNaN(parsed)) {
            setAutolockDelayState(parsed);
          }
        }

        // On initial cold start, if PIN is enabled, lock app immediately
        if (enabled) {
          setIsAppLocked(true);
        }
      } catch (err) {
        console.warn('SecurityContext load error:', err);
      } finally {
        if (isMounted) {
          setIsLoadingSecurity(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Monitor AppState for background -> active transitions (Apple/iOS Autolock behavior)
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        backgroundTimestampRef.current = Date.now();
      } else if (nextState === 'active') {
        const backgroundTime = backgroundTimestampRef.current;
        backgroundTimestampRef.current = null;

        if (isPinEnabledRef.current && currentPinRef.current) {
          const delay = autolockDelayRef.current;
          if (delay === -1) {
            // Never lock on background
            return;
          }

          if (delay === 0) {
            // Lock immediately
            setIsAppLocked(true);
            return;
          }

          if (backgroundTime) {
            const elapsedSeconds = (Date.now() - backgroundTime) / 1000;
            if (elapsedSeconds >= delay) {
              setIsAppLocked(true);
            }
          }
        }
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      sub.remove();
    };
  }, []);

  const setPin = async (newPin: string): Promise<boolean> => {
    if (!newPin || newPin.length < 4) return false;
    try {
      await Promise.all([
        AsyncStorage.setItem(PIN_STORAGE_KEY, newPin),
        AsyncStorage.setItem(PIN_ENABLED_STORAGE_KEY, 'true'),
      ]);
      setStoredPin(newPin);
      setIsPinEnabled(true);
      setIsAppLocked(false);
      return true;
    } catch {
      return false;
    }
  };

  const removePin = async (currentPin: string): Promise<boolean> => {
    if (storedPin && storedPin !== currentPin) return false;
    try {
      await Promise.all([
        AsyncStorage.removeItem(PIN_STORAGE_KEY),
        AsyncStorage.setItem(PIN_ENABLED_STORAGE_KEY, 'false'),
      ]);
      setStoredPin(null);
      setIsPinEnabled(false);
      setIsAppLocked(false);
      return true;
    } catch {
      return false;
    }
  };

  const changePin = async (oldPin: string, newPin: string): Promise<boolean> => {
    if (storedPin && storedPin !== oldPin) return false;
    if (!newPin || newPin.length < 4) return false;
    try {
      await AsyncStorage.setItem(PIN_STORAGE_KEY, newPin);
      setStoredPin(newPin);
      return true;
    } catch {
      return false;
    }
  };

  const setAutolockDelay = async (seconds: number): Promise<boolean> => {
    try {
      await AsyncStorage.setItem(AUTOLOCK_DELAY_STORAGE_KEY, seconds.toString());
      setAutolockDelayState(seconds);
      return true;
    } catch {
      return false;
    }
  };

  const verifyPin = (candidate: string): boolean => {
    return !!storedPin && storedPin === candidate;
  };

  const unlockApp = (candidate: string): boolean => {
    if (verifyPin(candidate)) {
      setIsAppLocked(false);
      return true;
    }
    return false;
  };

  const lockApp = () => {
    if (isPinEnabled && storedPin) {
      setIsAppLocked(true);
    }
  };

  return (
    <SecurityContext.Provider
      value={{
        isPinEnabled,
        autolockDelay,
        isAppLocked,
        isLoadingSecurity,
        setPin,
        removePin,
        changePin,
        setAutolockDelay,
        verifyPin,
        unlockApp,
        lockApp,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurityContext = () => useContext(SecurityContext);
