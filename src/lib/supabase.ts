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

  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.';
  if (lower.includes('email not confirmed'))
    return 'Confirma tu correo: revisa el enlace que te enviamos y luego vuelve a entrar.';
  if (lower.includes('already registered') || lower.includes('user already registered'))
    return 'Ese correo ya tiene cuenta. Entra con tu contraseña.';
  if (lower.includes('password should be at least'))
    return 'La contraseña debe tener al menos 6 caracteres.';
  if (lower.includes('new password should be different'))
    return 'La nueva contraseña debe ser diferente a la anterior.';
  if (lower.includes('signups not allowed') || lower.includes('signup is disabled'))
    return 'El registro está desactivado en Supabase.';
  if (lower.includes('rate limit') || lower.includes('too many') || lower.includes('security purposes'))
    return 'Demasiados intentos. Espera un minuto e intenta otra vez.';
  if (lower.includes('redirect'))
    return 'La URL de recuperación no está autorizada en Supabase. Agrega http://localhost:8081/** en Redirect URLs.';
  if (lower.includes('auth session missing') || lower.includes('session_not_found'))
    return 'El enlace expiró. Pide uno nuevo.';
  if (lower.includes('invalid') && (lower.includes('token') || lower.includes('link')))
    return 'El enlace no es válido o ya expiró.';
  if (lower.includes('unable to validate email') || lower.includes('invalid email'))
    return 'Revisa tu correo, parece incompleto.';
  if ((lower.includes('email address') || lower.includes('email')) && lower.includes('invalid'))
    return 'Ese correo no parece válido. Revisa que esté bien escrito.';
  if (message.includes('fetch')) return 'No hay conexión. Revisa tu internet.';
  return message;
}
