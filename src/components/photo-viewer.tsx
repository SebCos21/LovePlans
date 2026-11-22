import { Image } from 'expo-image';
import { ChevronLeft, ChevronRight, Trash2, X } from 'lucide-react-native';
import { Modal, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts } from '@/lib/theme';
import type { PlanPhoto } from '@/lib/types';
import { IconButton } from './ui';

export function PhotoViewer({
  photos,
  index,
  onClose,
  onChangeIndex,
  onDelete,
}: {
  photos: PlanPhoto[];
  index: number | null;
  onClose: () => void;
  onChangeIndex: (next: number) => void;
  onDelete: (photo: PlanPhoto) => void;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const photo = index !== null ? photos[index] : null;

  return (
    <Modal visible={Boolean(photo)} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: '#2b2628' }}>
        <View
          style={{
            height: 56,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 8,
          }}
        >
          <IconButton label="Cerrar" onPress={onClose}>
            <X size={24} color="#fff" />
          </IconButton>
          <Text style={{ fontFamily: fonts.body, fontSize: 13, color: 'rgba(255,255,255,.8)' }}>
            {photo ? `${(index ?? 0) + 1} de ${photos.length}` : ''}
          </Text>
          <IconButton label="Eliminar foto" onPress={() => photo && onDelete(photo)}>
            <Trash2 size={21} color="#fff" />
          </IconButton>
        </View>

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 }}>
          {photo?.url ? (
            <Image
              source={{ uri: photo.url }}
              style={{ width: '100%', height: Math.min(height * 0.72, width * 1.2) }}
              contentFit="contain"
              transition={150}
            />
          ) : (
            <Text style={{ fontFamily: fonts.body, fontSize: 13, color: 'rgba(255,255,255,.6)' }}>
              Foto no disponible
            </Text>
          )}
        </View>

        {photos.length > 1 ? (
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: Math.max(34, insets.bottom + 24),
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 26,
            }}
          >
            <Pressable
              onPress={() => index !== null && onChangeIndex((index - 1 + photos.length) % photos.length)}
              style={{ padding: 10 }}
              accessibilityLabel="Foto anterior"
            >
              <ChevronLeft size={28} color="#fff" />
            </Pressable>
            <Pressable
              onPress={() => index !== null && onChangeIndex((index + 1) % photos.length)}
              style={{ padding: 10 }}
              accessibilityLabel="Foto siguiente"
            >
              <ChevronRight size={28} color="#fff" />
            </Pressable>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}
