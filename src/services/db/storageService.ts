import { isSupabaseConfigured, supabase } from '../supabase';

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function cleanBase64String(rawBase64: string): string {
  const commaIdx = rawBase64.indexOf(',');
  const stripped = rawBase64.startsWith('data:') && commaIdx !== -1
    ? rawBase64.slice(commaIdx + 1)
    : rawBase64;
  return stripped.replace(/\s+/g, '');
}

export function normalizeImageMimeType(mimeOrUri?: string | null): 'image/jpeg' | 'image/png' {
  const lower = (mimeOrUri || '').toLowerCase();
  if (lower.includes('png')) {
    return 'image/png';
  }
  return 'image/jpeg';
}

export function decodeBase64ToArrayBuffer(base64Input: string): ArrayBuffer {
  const clean = cleanBase64String(base64Input).replace(/=+$/, '');
  const byteLength = Math.floor((clean.length * 3) / 4);
  const bytes = new Uint8Array(byteLength);

  let buffer = 0;
  let bitsCollected = 0;
  let byteIdx = 0;

  for (let i = 0; i < clean.length; i++) {
    const val = BASE64_CHARS.indexOf(clean[i]);
    if (val === -1) continue;
    buffer = (buffer << 6) | val;
    bitsCollected += 6;
    if (bitsCollected >= 8) {
      bitsCollected -= 8;
      bytes[byteIdx++] = (buffer >> bitsCollected) & 0xff;
    }
  }

  return bytes.buffer.slice(0, byteIdx);
}

export function encodeArrayBufferToBase64(arrayBuffer: ArrayBuffer): string {
  const bytes = new Uint8Array(arrayBuffer);
  let output = '';

  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b3 = i + 2 < bytes.length ? bytes[i + 2] : 0;

    output += BASE64_CHARS[b1 >> 2];
    output += BASE64_CHARS[((b1 & 0x03) << 4) | (b2 >> 4)];
    output += i + 1 < bytes.length ? BASE64_CHARS[((b2 & 0x0f) << 2) | (b3 >> 6)] : '=';
    output += i + 2 < bytes.length ? BASE64_CHARS[b3 & 0x3f] : '=';
  }

  return output;
}

export async function resolveImagePayload(
  imageUri: string,
  providedBase64?: string | null,
  providedMimeType?: string | null
): Promise<{ base64: string; mimeType: 'image/jpeg' | 'image/png'; sizeBytes: number } | null> {
  if (providedBase64 && providedBase64.length > 0) {
    const clean = cleanBase64String(providedBase64);
    const mimeType = normalizeImageMimeType(providedMimeType || imageUri);
    const sizeBytes = Math.floor((clean.length * 3) / 4);
    return { base64: clean, mimeType, sizeBytes };
  }

  if (imageUri.startsWith('data:')) {
    const headerEnd = imageUri.indexOf(',');
    if (headerEnd !== -1) {
      const header = imageUri.slice(0, headerEnd);
      const clean = cleanBase64String(imageUri.slice(headerEnd + 1));
      const mimeType = normalizeImageMimeType(header);
      const sizeBytes = Math.floor((clean.length * 3) / 4);
      return { base64: clean, mimeType, sizeBytes };
    }
  }

  try {
    const res = await fetch(imageUri);
    const contentType = res.headers.get('content-type') || providedMimeType || imageUri;
    const arrayBuffer = await res.arrayBuffer();
    const base64 = encodeArrayBufferToBase64(arrayBuffer);
    return {
      base64,
      mimeType: normalizeImageMimeType(contentType),
      sizeBytes: arrayBuffer.byteLength,
    };
  } catch (err) {
    console.warn('storageService.resolveImagePayload warning:', err);
    return null;
  }
}

export const storageService = {
  async uploadReceiptImage(
    userId: string,
    base64Data: string,
    mimeType: string = 'image/jpeg'
  ): Promise<string | null> {
    if (!isSupabaseConfigured || !userId || !userId.includes('-')) {
      return null;
    }

    try {
      const normalizedMime = normalizeImageMimeType(mimeType);
      const ext = normalizedMime === 'image/png' ? 'png' : 'jpg';
      const rand = Math.random().toString(36).slice(2, 8);
      const filePath = `${userId}/struk_${Date.now()}_${rand}.${ext}`;
      const arrayBuffer = decodeBase64ToArrayBuffer(base64Data);

      const { error } = await supabase.storage.from('receipts').upload(filePath, arrayBuffer, {
        contentType: normalizedMime,
        upsert: true,
      });

      if (error) {
        console.warn('storageService.uploadReceiptImage warning:', error.message);
        return null;
      }

      return `receipts/${filePath}`;
    } catch (err) {
      console.warn('storageService.uploadReceiptImage exception:', err);
      return null;
    }
  },

  async uploadAvatarImage(
    userId: string,
    base64Data: string,
    mimeType: string = 'image/jpeg'
  ): Promise<string | null> {
    if (!isSupabaseConfigured || !userId || !userId.includes('-')) {
      return null;
    }

    try {
      const normalizedMime = normalizeImageMimeType(mimeType);
      const ext = normalizedMime === 'image/png' ? 'png' : 'jpg';
      const filePath = `${userId}/avatar_${Date.now()}.${ext}`;
      const arrayBuffer = decodeBase64ToArrayBuffer(base64Data);

      const { error } = await supabase.storage.from('avatars').upload(filePath, arrayBuffer, {
        contentType: normalizedMime,
        upsert: true,
      });

      if (error) {
        console.warn('storageService.uploadAvatarImage warning:', error.message);
        return null;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      return data?.publicUrl || null;
    } catch (err) {
      console.warn('storageService.uploadAvatarImage exception:', err);
      return null;
    }
  },
};
