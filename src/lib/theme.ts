import { Film, Home, Mountain, Plane, Star, Utensils } from 'lucide-react-native';
import type { ComponentType } from 'react';

export const colors = {
  bg: '#f8f6f1',
  card: '#ffffff',
  cream: '#f3eee8',
  ink: '#4a4245',
  muted: '#7d7276',
  faint: '#a89da1',
  line: '#ece6df',
  pink: '#f6c1cc',
  pinkDark: '#e58b9e',
  pinkSoft: '#fadde3',
  rose: '#c0687e',
  peach: '#e58b76',
  blue: '#bcd4ee',
  blueInk: '#5f83ad',
  green: '#5f8f6f',
  greenBg: '#e7f3ec',
  track: '#e6dfd8',
  trackOn: '#f2a7b8',
  overlay: 'rgba(43,38,40,.42)',
  shadow: 'rgba(74,66,69,.10)',
};

export const fonts = {
  display: 'Caveat_700Bold',
  body: 'GowunDodum_400Regular',
};

export const radius = {
  pill: 999,
  card: 20,
  big: 26,
  input: 14,
};

export const categoryMeta = {
  comida: { label: 'Comida', Icon: Utensils, tint: '#fbe9ec', tint2: '#f7dde2' },
  viaje: { label: 'Viaje', Icon: Plane, tint: '#e8f0f9', tint2: '#dbe7f4' },
  cine: { label: 'Cine', Icon: Film, tint: '#efeaf6', tint2: '#e5ddf0' },
  aventura: { label: 'Aventura', Icon: Mountain, tint: '#e7f3ec', tint2: '#d9ecdf' },
  casa: { label: 'En casa', Icon: Home, tint: '#faf1e2', tint2: '#f4e6cd' },
  especial: { label: 'Especial', Icon: Star, tint: '#fbe9ec', tint2: '#e8f0f9' },
} satisfies Record<string, { label: string; Icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>; tint: string; tint2: string }>;

export type CategoryKey = keyof typeof categoryMeta;
export const categoryKeys = Object.keys(categoryMeta) as CategoryKey[];

export const personColor = {
  him: { solid: '#bcd4ee', soft: '#e8f0f9', ink: '#5f83ad' },
  her: { solid: '#f6c1cc', soft: '#fbe9ec', ink: '#c0687e' },
};

export function userTone(userId: string | null | undefined, myId: string | null | undefined) {
  return userId && userId === myId ? personColor.her : personColor.him;
}
