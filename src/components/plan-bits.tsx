import { Image } from 'expo-image';
import { ImageIcon } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { categoryMeta, colors, fonts } from '@/lib/theme';
import type { CategoryKey } from '@/lib/theme';

export function CategoryIcon({
  category,
  size = 15,
  color = colors.ink,
}: {
  category: CategoryKey;
  size?: number;
  color?: string;
}) {
  const meta = categoryMeta[category] ?? categoryMeta.especial;
  const Icon = meta.Icon;
  return <Icon size={size} color={color} strokeWidth={1.8} />;
}

export function PhotoTile({
  url,
  label,
  tint,
  size,
  radius = 12,
  onPress,
}: {
  url?: string | null;
  label?: string;
  tint?: string;
  size?: number;
  radius?: number;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={{
        width: size ?? '100%',
        aspectRatio: 1,
        borderRadius: radius,
        overflow: 'hidden',
        backgroundColor: tint ?? '#f3eee8',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {url ? (
        <Image
          source={{ uri: url }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={180}
          cachePolicy="memory-disk"
        />
      ) : (
        <View style={{ alignItems: 'center', gap: 4 }}>
          <ImageIcon size={18} color={colors.faint} />
          {label ? <Text style={{ fontFamily: fonts.body, fontSize: 9, color: colors.faint }}>{label}</Text> : null}
        </View>
      )}
    </Pressable>
  );
}
