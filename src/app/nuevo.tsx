import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, Heart, Plus, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { DateField } from '@/components/calendar';
import { Avatar, Body, Chip, Field, Header, Screen, Toggle } from '@/components/ui';
import { pickImages } from '@/lib/image';
import { errorMessage } from '@/lib/supabase';
import { categoryKeys, categoryMeta, colors, fonts, userTone, type CategoryKey } from '@/lib/theme';
import type { PickedImage } from '@/lib/types';
import { useApp } from '@/providers/AppProvider';

export default function PlanEditorScreen() {
  const params = useLocalSearchParams<{ id?: string; date?: string }>();
  const router = useRouter();
  const { plans, members, myId, savePlan, showNotice, busy } = useApp();

  const editing = typeof params.id === 'string';
  const existing = editing ? plans.find((plan) => plan.id === params.id) : undefined;

  const [title, setTitle] = useState(existing?.title ?? '');
  const [planDate, setPlanDate] = useState<string | null>(
    existing?.plan_date ?? (typeof params.date === 'string' ? params.date : null),
  );
  const [place, setPlace] = useState(existing?.place ?? '');
  const [category, setCategory] = useState<CategoryKey>(existing?.category ?? 'comida');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [favorite, setFavorite] = useState(existing?.is_favorite ?? false);
  const [images, setImages] = useState<PickedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    if (!existing || hydrated.current) return;
    hydrated.current = true;
    setTitle(existing.title);
    setPlanDate(existing.plan_date);
    setPlace(existing.place ?? '');
    setCategory(existing.category);
    setNotes(existing.notes ?? '');
    setFavorite(existing.is_favorite);
  }, [existing]);

  const me = members.find((member) => member.user_id === myId);

  const cancel = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/planes');
  };

  const addImages = async () => {
    try {
      const picked = await pickImages({ multiple: true });
      if (picked.length) setImages((current) => [...current, ...picked]);
    } catch (errorObject) {
      showNotice(errorMessage(errorObject), 'error');
    }
  };

  const save = async () => {
    if (!title.trim()) {
      setError('Ponle un nombre a este plan.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await savePlan(
        {
          id: editing ? (params.id as string) : undefined,
          title,
          plan_date: planDate,
          place,
          category,
          notes,
          is_favorite: favorite,
        },
        images,
      );
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)/planes');
    } catch (errorObject) {
      setError(errorMessage(errorObject));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <Header
        onBack={cancel}
        title={editing ? 'Editar plan' : 'Nuevo plan'}
        right={
          <Pressable
            onPress={() => void save()}
            disabled={saving || busy}
            style={{ height: 44, justifyContent: 'center', paddingHorizontal: 8, opacity: saving ? 0.5 : 1 }}
          >
            <Text style={{ fontFamily: fonts.body, fontSize: 15, color: colors.rose, fontWeight: '700' }}>Guardar</Text>
          </Pressable>
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 18, paddingBottom: 40, gap: 18 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Field
          label="¿Qué quieren hacer?"
          placeholder="Ej. Picnic en el parque"
          value={title}
          onChangeText={(next) => {
            setTitle(next);
            setError(null);
          }}
          autoFocus={!editing}
          error={error}
        />

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.faint }}>Fecha</Text>
            <DateField value={planDate} onChange={setPlanDate} label="Fecha del plan" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Lugar" placeholder="¿Dónde?" value={place} onChangeText={setPlace} />
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.faint }}>Categoría</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {categoryKeys.map((key) => {
              const meta = categoryMeta[key];
              const Icon = meta.Icon;
              return (
                <Chip
                  key={key}
                  label={meta.label}
                  selected={category === key}
                  onPress={() => setCategory(key)}
                  icon={<Icon size={15} color={colors.ink} strokeWidth={1.8} />}
                />
              );
            })}
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.faint }}>Fotos</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Pressable
              onPress={() => void addImages()}
              style={{
                width: 64,
                height: 64,
                borderRadius: 12,
                borderWidth: 1.5,
                borderStyle: 'dashed',
                borderColor: '#dcd3ca',
                backgroundColor: colors.card,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Camera size={20} color={colors.faint} />
            </Pressable>
            {images.map((image, index) => (
              <View key={`${image.uri}-${index}`} style={{ position: 'relative' }}>
                <Image
                  source={{ uri: image.uri }}
                  style={{ width: 64, height: 64, borderRadius: 12 }}
                  contentFit="cover"
                />
                <Pressable
                  onPress={() => setImages((current) => current.filter((_, item) => item !== index))}
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: colors.ink,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={12} color="#fff" />
                </Pressable>
              </View>
            ))}
            {images.length === 0 ? (
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <Body size={11} color={colors.faint}>
                  Puedes añadirlas ahora o después, en el detalle del plan.
                </Body>
              </View>
            ) : null}
          </View>
        </View>

        <Field
          label="Notas"
          placeholder="Detalles, ideas, qué llevar…"
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <Pressable
          onPress={() => setFavorite((current) => !current)}
          style={{
            minHeight: 54,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.line,
            backgroundColor: colors.card,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Heart
            size={20}
            color={colors.pinkDark}
            fill={favorite ? colors.pinkDark : 'none'}
          />
          <Text style={{ flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.ink }}>
            Es uno de nuestros favoritos
          </Text>
          <Toggle value={favorite} onChange={setFavorite} />
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Avatar
            uri={me?.profile.avatar_url}
            name={me?.profile.display_name ?? 'Tú'}
            size={24}
            border={0}
            color={userTone(myId, myId).solid}
          />
          <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted }}>
            Lo propone {me?.profile.display_name ?? 'ti'}
          </Text>
        </View>

        <Pressable
          onPress={() => void save()}
          disabled={saving || busy}
          style={({ pressed }) => ({
            height: 54,
            borderRadius: 27,
            backgroundColor: colors.pink,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 4,
            opacity: saving || busy ? 0.6 : pressed ? 0.85 : 1,
            flexDirection: 'row',
            gap: 8,
          })}
        >
          <Plus size={18} color={colors.ink} />
          <Text style={{ fontFamily: fonts.body, fontSize: 16, color: colors.ink }}>
            {editing ? 'Guardar cambios' : 'Crear plan'}
          </Text>
        </Pressable>

        <Body size={11} color={colors.faint} style={{ textAlign: 'center' }}>
          Los cambios se ven al instante en el teléfono de tu pareja.
        </Body>
      </ScrollView>
    </Screen>
  );
}
