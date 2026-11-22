import { useLocalSearchParams, useRouter } from 'expo-router';
import { Camera } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { PhotoViewer } from '@/components/photo-viewer';
import { CategoryIcon, PhotoTile } from '@/components/plan-bits';
import { ConfirmDialog, EmptyState, Header, Screen } from '@/components/ui';
import { formatShort } from '@/lib/dates';
import { pickImages } from '@/lib/image';
import { errorMessage } from '@/lib/supabase';
import { categoryMeta, colors, fonts } from '@/lib/theme';
import { useApp } from '@/providers/AppProvider';

export default function AlbumScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { plans, photos, addPhotos, deletePhoto, showNotice, busy } = useApp();
  const [viewer, setViewer] = useState<number | null>(null);
  const [photoToDelete, setPhotoToDelete] = useState<string | null>(null);

  const plan = plans.find((item) => item.id === id);
  const planPhotos = photos.filter((photo) => photo.plan_id === id);

  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/recuerdos');
  };

  if (!plan) {
    return (
      <Screen edges={['top', 'bottom']}>
        <Header onBack={back} title="Recuerdo" />
        <EmptyState>Este recuerdo ya no existe.</EmptyState>
      </Screen>
    );
  }

  const category = categoryMeta[plan.category] ?? categoryMeta.especial;
  const target = planPhotos.find((photo) => photo.id === photoToDelete) ?? null;

  const add = async () => {
    try {
      const images = await pickImages({ multiple: true });
      if (images.length) await addPhotos(plan.id, images);
    } catch (error) {
      showNotice(errorMessage(error), 'error');
    }
  };

  const removePhoto = async () => {
    if (!target) return;
    setPhotoToDelete(null);
    try {
      await deletePhoto(target);
      setViewer(null);
    } catch (error) {
      showNotice(errorMessage(error), 'error');
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <Header
        onBack={back}
        title="Recuerdo"
        right={
          <Pressable
            onPress={() => router.push({ pathname: '/plan/[id]', params: { id: plan.id } })}
            style={{ paddingHorizontal: 8, height: 44, justifyContent: 'center' }}
          >
            <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted }}>Ver plan</Text>
          </Pressable>
        }
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', paddingHorizontal: 24, paddingTop: 18, gap: 4 }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 31, color: colors.peach }}>
            {formatShort(plan.plan_date)}
          </Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 20, lineHeight: 29, color: colors.ink, textAlign: 'center' }}>
            {plan.title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <CategoryIcon category={plan.category} size={13} color={colors.faint} />
            <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.faint }}>
              {category.label} · {planPhotos.length} {planPhotos.length === 1 ? 'foto' : 'fotos'}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, paddingHorizontal: 14, paddingTop: 16 }}>
          <Pressable
            onPress={() => void add()}
            disabled={busy}
            style={{
              width: '31.5%',
              aspectRatio: 1,
              borderRadius: 14,
              borderWidth: 1.5,
              borderStyle: 'dashed',
              borderColor: '#dcd3ca',
              backgroundColor: colors.card,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              opacity: busy ? 0.5 : 1,
            }}
          >
            <Camera size={20} color={colors.muted} />
            <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.muted }}>Añadir fotos</Text>
          </Pressable>

          {planPhotos.map((photo, index) => (
            <View key={photo.id} style={{ width: '31.5%' }}>
              <PhotoTile url={photo.url} radius={14} onPress={() => setViewer(index)} />
            </View>
          ))}
        </View>

        <Text
          style={{
            textAlign: 'center',
            fontFamily: fonts.body,
            fontSize: 12,
            color: colors.faint,
            marginTop: 20,
            marginHorizontal: 30,
          }}
        >
          Las fotos que suban aquí las ven los dos.
        </Text>
      </ScrollView>

      <PhotoViewer
        photos={planPhotos}
        index={viewer}
        onClose={() => setViewer(null)}
        onChangeIndex={setViewer}
        onDelete={(photo) => {
          setViewer(null);
          setPhotoToDelete(photo.id);
        }}
      />

      <ConfirmDialog
        visible={Boolean(photoToDelete)}
        title="¿Eliminar esta foto?"
        body="Se borrará para los dos."
        confirmLabel="Eliminar"
        danger
        onCancel={() => setPhotoToDelete(null)}
        onConfirm={() => void removePhoto()}
      />
    </Screen>
  );
}
