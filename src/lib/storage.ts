import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Almacenamiento universal. En web usa localStorage; en nativo, AsyncStorage.
 */
export const storage = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },
  async set(key: string, value: unknown): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {
      // sin almacenamiento disponible (modo privado, cuota llena)
    }
  },
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // noop
    }
  },
};

export async function copyText(text: string): Promise<void> {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const Clipboard = await import('expo-clipboard');
  await Clipboard.setStringAsync(text);
}

export function isStandalone(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone;
  return window.matchMedia?.('(display-mode: standalone)').matches || iosStandalone === true;
}

export function isIOS(): boolean {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') return Platform.OS === 'ios';
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function isInAppBrowser(): boolean {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') return false;
  return /FBAN|FBAV|Instagram|Line\/|WhatsApp/i.test(navigator.userAgent);
}

export function publicAppUrl(): string {
  const configured = process.env.EXPO_PUBLIC_APP_URL;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const origin = window.location.origin;
    if (!configured || configured.includes('localhost') || configured.includes('127.0.0.1')) {
      return origin;
    }
    return configured.replace(/\/$/, '');
  }
  return (configured ?? 'https://loveplans.vercel.app').replace(/\/$/, '');
}

export function inviteUrl(code: string): string {
  return `${publicAppUrl()}/i/${code}`;
}
