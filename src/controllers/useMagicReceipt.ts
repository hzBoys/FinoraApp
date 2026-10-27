import { useState } from 'react';
import { Alert } from 'react-native';
import { Tx } from '../models/types';
import {
  autoCategorizeMerchant,
  OCRReceiptResult,
  validateReceiptFile,
} from './services/magicReceiptService';
import { getDeviceNow } from '../utils/date';

export type MagicReceiptStep = 'idle' | 'processing' | 'review';

export function useMagicReceipt(onTransactionSaved: (tx: Tx) => void) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<MagicReceiptStep>('idle');
  const [receiptImageUri, setReceiptImageUri] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<OCRReceiptResult | null>(null);
  const [ocrProgress, setOcrProgress] = useState(0);

  const reset = () => {
    setIsOpen(false);
    setStep('idle');
    setReceiptImageUri(null);
    setExtractedData(null);
    setOcrProgress(0);
  };

  const startOcrSimulation = (
    imageUri: string,
    sampleMerchant: string = 'Warteg Sederhana',
    sampleNominal: number = 45000,
    sampleDate: string = getDeviceNow().displayDate,
    samplePayment: string = 'QRIS'
  ) => {
    setReceiptImageUri(imageUri);
    setStep('processing');
    setOcrProgress(15);

    const timer1 = setTimeout(() => setOcrProgress(55), 400);
    const timer2 = setTimeout(() => setOcrProgress(88), 900);

    const timer3 = setTimeout(() => {
      setOcrProgress(100);
      const category = autoCategorizeMerchant(sampleMerchant);
      setExtractedData({
        merchant: sampleMerchant,
        nominal: sampleNominal,
        tanggal: sampleDate,
        metode_bayar: samplePayment,
        kategori: category,
      });
      setStep('review');
    }, 1400); // 1.4s (< 3 detik sesuai ER-1.1)

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
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
          allowsEditing: true,
          quality: 0.9,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          const fileSize = asset.fileSize ?? 1500000;
          const validation = validateReceiptFile(fileSize, asset.mimeType ?? 'image/jpeg');
          if (!validation.valid) {
            Alert.alert('File Tidak Valid', validation.error);
            return;
          }
          startOcrSimulation(
            asset.uri,
            'Resto Seafood 88',
            85000,
            getDeviceNow().displayDate,
            'E-Wallet'
          );
        }
      } catch {
        Alert.alert('Gagal', 'Terjadi kendala saat membuka galeri foto.');
      }
    } else {
      startOcrSimulation(
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=80',
        'Resto Seafood 88',
        85000,
        getDeviceNow().displayDate,
        'E-Wallet'
      );
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
          allowsEditing: true,
          quality: 0.9,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          startOcrSimulation(
            result.assets[0].uri,
            'Kopi Kenangan Senja',
            38000,
            getDeviceNow().displayDate,
            'Bank'
          );
        }
      } catch {
        Alert.alert('Gagal', 'Kamera tidak dapat diakses.');
      }
    } else {
      startOcrSimulation(
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&auto=format&fit=crop&q=80',
        'Kopi Kenangan Senja',
        38000,
        getDeviceNow().displayDate,
        'Bank'
      );
    }
  };

  const confirmAndSaveTransaction = (
    merchant: string,
    nominal: number,
    kategori: string,
    tanggal: string,
    metodeBayar: string,
    accountId: number | string = 1
  ) => {
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
    };

    onTransactionSaved(newTx);
    reset();
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
