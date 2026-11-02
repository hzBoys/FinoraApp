import { useRef, useState } from 'react';
import { Alert } from 'react-native';
import { Account, AccountType } from '../models/types';
import { validateReceiptFile } from './services/magicReceiptService';
import { isGeminiConfigured } from '../services/ai/geminiClient';
import {
  extractBalanceWithGemini,
  OCRBalanceResult,
} from '../services/ai/geminiPortfolioService';
import { resolveImagePayload, storageService } from '../services/db/storageService';
import { scanService } from '../services/db/scanService';

export type AutoPortfolioStep = 'idle' | 'processing' | 'review';
export type AutoPortfolioMode = 'scan' | 'manage';

const MOCK_BALANCE_SAMPLES: OCRBalanceResult[] = [
  { nama_akun: 'BCA', tipe: 'bank', saldo: 4250000, ringkasan_ocr: 'myBCA Info Saldo Rp 4.250.000' },
  { nama_akun: 'GoPay', tipe: 'ewallet', saldo: 685000, ringkasan_ocr: 'GoPay Saldo Utama Rp 685.000' },
  { nama_akun: 'Bibit', tipe: 'investasi', saldo: 3150000, ringkasan_ocr: 'Portofolio Bibit Reksadana Rp 3.150.000' },
];

export function useAutoPortfolioScan(
  onBalanceSaved: (namaAkun: string, tipe: AccountType, nominalSaldo: number) => Promise<Account | null> | void,
  userId?: string | number
) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AutoPortfolioMode>('scan');
  const [step, setStep] = useState<AutoPortfolioStep>('idle');
  const [balanceImageUri, setBalanceImageUri] = useState<string | null>(null);
  const [extractedBalance, setExtractedBalance] = useState<OCRBalanceResult | null>(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearProgressTimer = () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  };

  const reset = () => {
    clearProgressTimer();
    setIsOpen(false);
    setMode('scan');
    setStep('idle');
    setBalanceImageUri(null);
    setExtractedBalance(null);
    setOcrProgress(0);
  };

  const openModal = (initialMode: AutoPortfolioMode = 'scan') => {
    setMode(initialMode);
    setStep('idle');
    setIsOpen(true);
  };

  const processBalanceAsset = async (
    imageUri: string,
    providedBase64?: string | null,
    providedMimeType?: string | null,
    providedFileSize?: number | null
  ) => {
    const isRemoteUser = typeof userId === 'string' && userId.includes('-');
    const mimeCandidate =
      providedMimeType || (imageUri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');

    if (providedFileSize && providedFileSize > 0) {
      const check = validateReceiptFile(providedFileSize, mimeCandidate);
      if (!check.valid) {
        Alert.alert('File Tidak Valid', check.error);
        return;
      }
    }

    setBalanceImageUri(imageUri);
    setStep('processing');
    setOcrProgress(20);

    clearProgressTimer();
    progressTimerRef.current = setInterval(() => {
      setOcrProgress((prev) => (prev < 90 ? prev + 9 : prev));
    }, 260);

    try {
      const imagePayload = await resolveImagePayload(imageUri, providedBase64, mimeCandidate);
      if (!imagePayload) {
        throw new Error('Gagal membaca file screenshot dari perangkat.');
      }

      const sizeValidation = validateReceiptFile(
        providedFileSize ?? imagePayload.sizeBytes,
        imagePayload.mimeType
      );
      if (!sizeValidation.valid) {
        clearProgressTimer();
        setStep('idle');
        setOcrProgress(0);
        Alert.alert('File Tidak Valid', sizeValidation.error);
        return;
      }

      if (!isGeminiConfigured()) {
        if (!isRemoteUser) {
          clearProgressTimer();
          setOcrProgress(100);
          const sample = MOCK_BALANCE_SAMPLES[Math.floor(Math.random() * MOCK_BALANCE_SAMPLES.length)];
          setExtractedBalance(sample);
          setStep('review');
          return;
        }
        throw new Error('Konfigurasi EXPO_PUBLIC_GEMINI_API_KEYS belum tersedia di file .env.');
      }

      const [ocrOutcome, uploadOutcome] = await Promise.allSettled([
        extractBalanceWithGemini(imagePayload.base64, imagePayload.mimeType),
        isRemoteUser
          ? storageService.uploadReceiptImage(
              userId as string,
              imagePayload.base64,
              imagePayload.mimeType,
              'saldo'
            )
          : Promise.resolve(null),
      ]);

      const uploadedFileUrl = uploadOutcome.status === 'fulfilled' ? uploadOutcome.value : null;

      if (ocrOutcome.status === 'rejected') {
        const errMsg = ocrOutcome.reason?.message || 'Gagal mengekstrak saldo dengan AI.';
        if (isRemoteUser) {
          await scanService.createScanLog({
            userId: userId as string,
            jenisScan: 'saldo',
            fileUrl: uploadedFileUrl,
            teksOcr: errMsg,
            status: 'failed',
          });
        }
        throw new Error(errMsg);
      }

      const aiResult = ocrOutcome.value;
      const pillarLabel =
        aiResult.tipe === 'ewallet'
          ? 'E-Wallet'
          : aiResult.tipe === 'investasi'
          ? 'Investasi'
          : 'Bank';

      let scanId: string | null = null;
      if (isRemoteUser) {
        scanId = await scanService.createScanLog({
          userId: userId as string,
          jenisScan: 'saldo',
          fileUrl: uploadedFileUrl,
          teksOcr: aiResult.ringkasan_ocr,
          merchantExtracted: aiResult.nama_akun,
          nominalExtracted: aiResult.saldo,
          kategoriExtracted: 'Portofolio',
          metodeExtracted: pillarLabel,
          processingTimeMs: aiResult.processingTimeMs,
          status: 'success',
        });
      }

      clearProgressTimer();
      setOcrProgress(100);
      setExtractedBalance({
        nama_akun: aiResult.nama_akun,
        tipe: aiResult.tipe,
        saldo: aiResult.saldo,
        ringkasan_ocr: aiResult.ringkasan_ocr,
        processingTimeMs: aiResult.processingTimeMs,
        scanId,
        fileUrl: uploadedFileUrl,
      });
      setStep('review');
    } catch (err: any) {
      clearProgressTimer();
      setStep('idle');
      setOcrProgress(0);
      Alert.alert(
        'Pemindaian Saldo Gagal',
        err?.message || 'Pastikan screenshot menampilkan nama aplikasi dan nominal saldo dengan jelas.'
      );
    }
  };

  const handlePickGallery = async () => {
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
          Alert.alert('Izin Ditolak', 'Finora membutuhkan akses galeri untuk membaca screenshot saldo.');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.7,
          base64: true,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          await processBalanceAsset(
            asset.uri,
            asset.base64,
            asset.mimeType ?? 'image/jpeg',
            asset.fileSize ?? null
          );
        }
      } catch {
        Alert.alert('Gagal', 'Terjadi kendala saat membuka galeri foto.');
      }
    } else {
      Alert.alert('Tidak Didukung', 'Fitur galeri tidak tersedia pada perangkat ini.');
    }
  };

  const handleLaunchCamera = async () => {
    let ImagePicker: any = null;
    try {
      ImagePicker = require('expo-image-picker');
    } catch {
      ImagePicker = null;
    }

    if (ImagePicker && ImagePicker.launchCameraAsync) {
      try {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Izin Kamera', 'Finora membutuhkan izin kamera untuk memotret layar saldo.');
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: false,
          quality: 0.7,
          base64: true,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          await processBalanceAsset(
            asset.uri,
            asset.base64,
            asset.mimeType ?? 'image/jpeg',
            asset.fileSize ?? null
          );
        }
      } catch {
        Alert.alert('Gagal', 'Kamera tidak dapat diakses.');
      }
    } else {
      Alert.alert('Tidak Didukung', 'Fitur kamera tidak tersedia pada perangkat ini.');
    }
  };

  const confirmAndSaveBalance = async (
    namaAkun: string,
    tipe: AccountType,
    nominalSaldo: number
  ) => {
    const cleanName = namaAkun.trim() || 'Bank';
    const safeNominal = Math.max(0, Math.round(nominalSaldo));
    reset();
    await onBalanceSaved(cleanName, tipe, safeNominal);
    Alert.alert(
      'Portofolio Diperbarui',
      `Saldo akun "${cleanName}" berhasil disinkronkan menjadi Rp${safeNominal.toLocaleString('id-ID')}.`
    );
  };

  return {
    isOpen,
    setIsOpen,
    openModal,
    mode,
    setMode,
    step,
    setStep,
    balanceImageUri,
    extractedBalance,
    ocrProgress,
    reset,
    handlePickGallery,
    handleLaunchCamera,
    confirmAndSaveBalance,
  };
}
