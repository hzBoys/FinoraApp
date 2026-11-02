import { useRef, useState } from 'react';
import { Alert } from 'react-native';
import { Tx } from '../models/types';
import {
  extractMockReceipt,
  OCRReceiptResult,
  validateReceiptFile,
} from './services/magicReceiptService';
import {
  extractReceiptWithGemini,
  isGeminiConfigured,
} from '../services/ai/geminiReceiptService';
import { resolveImagePayload, storageService } from '../services/db/storageService';
import { scanService } from '../services/db/scanService';

export type MagicReceiptStep = 'idle' | 'processing' | 'review';

export function useMagicReceipt(
  onTransactionSaved: (tx: Tx) => Promise<string | null | void> | void,
  userId?: string | number
) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<MagicReceiptStep>('idle');
  const [receiptImageUri, setReceiptImageUri] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<OCRReceiptResult | null>(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const lastScanIdRef = useRef<string | null>(null);
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
    setStep('idle');
    setReceiptImageUri(null);
    setExtractedData(null);
    setOcrProgress(0);
    lastScanIdRef.current = null;
  };

  const processReceiptAsset = async (
    imageUri: string,
    providedBase64?: string | null,
    providedMimeType?: string | null,
    providedFileSize?: number | null
  ) => {
    const isRemoteUser = typeof userId === 'string' && userId.includes('-');
    const mimeCandidate = providedMimeType || (imageUri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');

    if (providedFileSize && providedFileSize > 0) {
      const check = validateReceiptFile(providedFileSize, mimeCandidate);
      if (!check.valid) {
        Alert.alert('File Tidak Valid', check.error);
        return;
      }
    }

    setReceiptImageUri(imageUri);
    setStep('processing');
    setOcrProgress(18);
    lastScanIdRef.current = null;

    clearProgressTimer();
    progressTimerRef.current = setInterval(() => {
      setOcrProgress((prev) => (prev < 90 ? prev + 9 : prev));
    }, 280);

    try {
      const imagePayload = await resolveImagePayload(imageUri, providedBase64, mimeCandidate);
      if (!imagePayload) {
        throw new Error('Gagal membaca file gambar dari perangkat.');
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

      // Offline Demo Account fallback ONLY if Gemini keys are not configured
      if (!isGeminiConfigured()) {
        if (!isRemoteUser) {
          clearProgressTimer();
          setOcrProgress(100);
          setExtractedData(extractMockReceipt());
          setStep('review');
          return;
        }
        throw new Error('Konfigurasi EXPO_PUBLIC_GEMINI_API_KEYS belum tersedia di file .env.');
      }

      // Run Gemini OCR (Round-Robin 14 Keys) + Cloud Storage upload in parallel for < 3s latency
      const [ocrOutcome, uploadOutcome] = await Promise.allSettled([
        extractReceiptWithGemini(imagePayload.base64, imagePayload.mimeType),
        isRemoteUser
          ? storageService.uploadReceiptImage(userId as string, imagePayload.base64, imagePayload.mimeType)
          : Promise.resolve(null),
      ]);

      const uploadedFileUrl =
        uploadOutcome.status === 'fulfilled' ? uploadOutcome.value : null;

      if (ocrOutcome.status === 'rejected') {
        const errMsg = ocrOutcome.reason?.message || 'Gagal mengekstrak teks struk dengan AI.';
        if (isRemoteUser) {
          await scanService.createScanLog({
            userId: userId as string,
            jenisScan: 'struk',
            fileUrl: uploadedFileUrl,
            teksOcr: errMsg,
            status: 'failed',
          });
        }
        throw new Error(errMsg);
      }

      const aiResult = ocrOutcome.value;

      let scanId: string | null = null;
      if (isRemoteUser) {
        scanId = await scanService.createScanLog({
          userId: userId as string,
          jenisScan: 'struk',
          fileUrl: uploadedFileUrl,
          teksOcr: aiResult.ringkasan_ocr,
          merchantExtracted: aiResult.merchant,
          nominalExtracted: aiResult.nominal,
          kategoriExtracted: aiResult.kategori,
          metodeExtracted: aiResult.metode_bayar,
          processingTimeMs: aiResult.processingTimeMs,
          status: 'success',
        });
      }

      lastScanIdRef.current = scanId;
      clearProgressTimer();
      setOcrProgress(100);
      setExtractedData({
        merchant: aiResult.merchant,
        nominal: aiResult.nominal,
        tanggal: aiResult.tanggal,
        metode_bayar: aiResult.metode_bayar,
        kategori: aiResult.kategori,
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
        'Pemindaian Struk Gagal',
        err?.message || 'Pastikan koneksi internet aktif dan foto struk terlihat jelas.'
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
          Alert.alert('Izin Ditolak', 'Finora membutuhkan akses galeri untuk membaca struk.');
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
          await processReceiptAsset(
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
          Alert.alert('Izin Kamera', 'Finora membutuhkan izin kamera untuk memotret struk.');
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: false,
          quality: 0.7,
          base64: true,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          await processReceiptAsset(
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

  const confirmAndSaveTransaction = async (
    merchant: string,
    nominal: number,
    kategori: string,
    tanggal: string,
    metodeBayar: string,
    accountId: number | string = 1
  ) => {
    const scanIdToLink = lastScanIdRef.current;

    const newTx: Tx = {
      id: Date.now(),
      name: merchant,
      amount: nominal,
      cat: kategori,
      date: tanggal,
      income: false,
      merchant,
      metode_bayar: metodeBayar,
      account_id: accountId,
      catatan: extractedData?.ringkasan_ocr
        ? `Scan AI: ${extractedData.ringkasan_ocr.slice(0, 120)}`
        : undefined,
    };

    reset();
    const savedTxId = await onTransactionSaved(newTx);

    if (scanIdToLink && typeof savedTxId === 'string' && savedTxId.includes('-')) {
      scanService.linkScanToTransaction(scanIdToLink, savedTxId);
    }

    Alert.alert(
      'Transaksi Berhasil Disimpan',
      `Struk dari "${merchant}" sebesar Rp${nominal.toLocaleString('id-ID')} otomatis tercatat ke kategori ${kategori}.`
    );
  };

  return {
    isOpen,
    setIsOpen,
    step,
    setStep,
    receiptImageUri,
    extractedData,
    ocrProgress,
    reset,
    handlePickGallery,
    handleLaunchCamera,
    confirmAndSaveTransaction,
  };
}
