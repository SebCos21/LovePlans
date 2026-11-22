import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured =
  url.startsWith('https://') && anonKey.length > 40 && !url.includes('TU-PROYECTO');

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        storage: Platform.OS === 'web' ? undefined : AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
        flowType: 'pkce',
      },
    })
  : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase no está configurado. Agrega EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY en .env',
    );
  }
  return supabase;
}

export function errorMessage(error: unknown): string {
  if (!error) return 'Algo salió mal. Intenta de nuevo.';
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('SPACE_FULL')) return 'Ese espacio ya tiene dos personas.';
  if (message.includes('ALREADY_IN_SPACE'))
    return 'Ya haces parte de un espacio. Sal de él antes de unirte a otro.';
  if (message.includes('NOT_MEMBER')) return 'No haces parte de ese espacio.';
  if (message.includes('INVITE_INVALID')) return 'La invitación no existe o ya expiró.';
  if (message.includes('AUTH_REQUIRED')) return 'Inicia sesión para continuar.';
  if (message.includes('already registered') || message.includes('User already registered'))
    return 'Ese correo ya tiene cuenta. Pide un código para entrar.';
  if (message.toLowerCase().includes('rate limit') || message.includes('too many'))
    return 'Demasiados intentos. Espera un minuto e intenta otra vez.';
  if (message.toLowerCase().includes('invalid') && message.toLowerCase().includes('token'))
    return 'El código no es correcto o ya expiró.';
  if (message.includes('fetch')) return 'No hay conexión. Revisa tu internet.';
  return message;
}
