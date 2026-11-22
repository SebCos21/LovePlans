import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, Heart, Pencil, Plus, RotateCcw } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { PhotoViewer } from '@/components/photo-viewer';
import { CategoryIcon, PhotoTile } from '@/components/plan-bits';
import { CatMark, ConfirmDialog, EmptyState, Header, IconButton, Screen } from '@/components/ui';
import { formatLong, formatWeekdayShort } from '@/lib/dates';
import { pickImages } from '@/lib/image';
import { errorMessage } from '@/lib/supabase';
import { categoryMeta, colors, fonts, userTone } from '@/lib/theme';
import { useApp } from '@/providers/AppProvider';

export default function PlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const {
    plans,
    photos,
    members,
    myId,
    toggleFavorite,
    toggleDone,
    deletePlan,
    addPhotos,
    deletePhoto,
    showNotice,
    busy,
  } = useApp();

  const plan = plans.find((item) => item.id === id);
  const planPhotos = photos.filter((photo) => photo.plan_id === id);
  const [viewer, setViewer] = useState<number | null>(null);
  const [confirmPlan, setConfirmPlan] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<string | null>(null);

  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/planes');
  };

  if (!plan) {
    return (
      <Screen edges={['top', 'bottom']}>
        <Header onBack={back} title="Plan" />
        <EmptyState>Este plan ya no existe o fue eliminado.</EmptyState>
      </Screen>
    );
  }

  const author = members.find((member) => member.user_id === plan.created_by);
  const authorColor = userTone(plan.created_by, myId).solid;
  const category = categoryMeta[plan.category] ?? categoryMeta.especial;
  const photoToDeleteObject = planPhotos.find((photo) => photo.id === photoToDelete) ?? null;

  const addMorePhotos = async () => {
    try {
      const images = await pickImages({ multiple: true });
      if (images.length) await addPhotos(plan.id, images);
    } catch (error) {
      showNotice(errorMessage(error), 'error');
    }
  };

  const markDone = async () => {
    try {
      const willBeDone = !plan.is_done;
      await toggleDone(plan.id);
      if (willBeDone) router.push({ pathname: '/plan/[id]/album', params: { id: plan.id } });
    } catch (error) {
      showNotice(errorMessage(error), 'error');
    }
  };

  const removePlan = async () => {
    setConfirmPlan(false);
    try {
      await deletePlan(plan.id);
      router.replace('/(tabs)/planes');
    } catch (error) {
      showNotice(errorMessage(error), 'error');
    }
  };

  const removePhoto = async () => {
    if (!photoToDeleteObject) return;
    setPhotoToDelete(null);
    try {
      await deletePhoto(photoToDeleteObject);
      setViewer(null);
    } catch (error) {
      showNotice(errorMessage(error), 'error');
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <Header
        onBack={back}
        title={plan.is_done ? 'Recuerdo' : 'Plan'}
        right={
          <>
            <IconButton
              label="Favorito"
              onPress={() =>
                void toggleFavorite(plan.id).catch((error) => showNotice(errorMessage(error), 'error'))
              }
            >
              <Heart
                size={20}
                color={plan.is_favorite ? colors.pinkDark : colors.faint}
                fill={plan.is_favorite ? colors.pinkDark : 'none'}
              />
            </IconButton>
            <IconButton
              label="Editar plan"
              onPress={() => router.push({ pathname: '/nuevo', params: { id: plan.id } })}
            >
              <Pencil size={19} color={colors.ink} />
            </IconButton>
          </>
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: 'center', paddingTop: 22, gap: 6 }}>
          <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.faint }}>
            {plan.is_done ? 'Cumplido' : 'Plan'} · propuesto por {author?.profile.display_name ?? 'alguien'}
          </Text>
          <CatMark width={92} height={66} />
        </View>

        <View style={{ paddingHorizontal: 26, paddingTop: 8 }}>
          <Text style={{ fontFamily: fonts.body, fontSize: 22, lineHeight: 32, color: colors.ink }}>
            {plan.title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <CategoryIcon category={plan.category} size={13} color={colors.faint} />
            <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.faint }}>
              {category.label} · {formatWeekdayShort(plan.plan_date)}
            </Text>
          </View>
        </View>

        <View
          style={{
            paddingHorizontal: 26,
            paddingTop: 20,
            flexDirection: 'row',
            flexWrap: 'wrap',
            rowGap: 18,
          }}
        >
          <Info label="Fecha" value={formatLong(plan.plan_date)} />
          <Info label="Lugar" value={plan.place || 'Por decidir'} />
          <Info
            label="Lo propuso"
            value={author?.profile.display_name ?? '—'}
            dotColor={authorColor}
          />
          <Info label="Prioridad" value={plan.is_favorite ? 'Favorito' : 'Normal'} />
        </View>

        <View style={{ paddingHorizontal: 26, paddingTop: 20 }}>
          <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.faint }}>Notas</Text>
          <Text
            style={{
              fontFamily: fonts.body,
              fontSize: 14,
              lineHeight: 24,
              marginTop: 4,
              color: plan.notes ? colors.ink : colors.faint,
            }}
          >
            {plan.notes || 'Sin notas todavía.'}
          </Text>
        </View>

        <View style={{ paddingHorizontal: 26, paddingTop: 22 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.faint }}>Fotos de la cita</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.faint }}>
              {planPhotos.length} {planPhotos.length === 1 ? 'foto' : 'fotos'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            <Pressable
              onPress={() => void addMorePhotos()}
              disabled={busy}
              style={{
                width: '23%',
                aspectRatio: 1,
                borderRadius: 12,
                borderWidth: 1.5,
                borderStyle: 'dashed',
                borderColor: '#dcd3ca',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: busy ? 0.5 : 1,
              }}
            >
              <Plus size={20} color={colors.faint} />
            </Pressable>
            {planPhotos.map((photo, index) => (
              <View key={photo.id} style={{ width: '23%' }}>
                <PhotoTile url={photo.url} onPress={() => setViewer(index)} />
              </View>
            ))}
          </View>
        </View>

        <View style={{ paddingHorizontal: 26, paddingTop: 26, paddingBottom: 8, alignItems: 'center', gap: 8 }}>
          <Pressable
            onPress={() => void markDone()}
            style={({ pressed }) => ({
              width: '100%',
              height: 52,
              borderRadius: 26,
              backgroundColor: plan.is_done ? 'transparent' : colors.pink,
              borderWidth: plan.is_done ? 1 : 0,
              borderColor: colors.line,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            {plan.is_done ? <RotateCcw size={17} color={colors.ink} /> : <Check size={18} color={colors.ink} />}
            <Text style={{ fontFamily: fonts.body, fontSize: 15, color: colors.ink }}>
              {plan.is_done ? 'Volver a pendientes' : '¡Lo hicimos!'}
            </Text>
          </Pressable>

          <Pressable onPress={() => setConfirmPlan(true)} style={{ paddingVertical: 8 }}>
            <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.rose }}>Eliminar plan</Text>
          </Pressable>
        </View>
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
        visible={confirmPlan}
        title="¿Eliminar este plan?"
        body={`“${plan.title}” y sus fotos desaparecerán también del teléfono de tu pareja.`}
        confirmLabel="Eliminar"
        danger
        onCancel={() => setConfirmPlan(false)}
        onConfirm={() => void removePlan()}
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

function Info({ label, value, dotColor }: { label: string; value: string; dotColor?: string }) {
  return (
    <View style={{ width: '50%', paddingRight: 8 }}>
      <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.faint }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
        {dotColor ? <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: dotColor }} /> : null}
        <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink }}>{value}</Text>
      </View>
    </View>
  );
}
