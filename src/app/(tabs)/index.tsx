import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Bell, Camera, ChevronRight, Heart, Plus, Ticket } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { InstallCard } from '@/components/install-card';
import { Body, Button, Card, CatMark, Logo, Screen, Title } from '@/components/ui';
import { daysTogether, formatWeekdayShort, inDaysLabel, MONTHS_SHORT, parseDateOnly, todayISO } from '@/lib/dates';
import { pickImages } from '@/lib/image';
import { errorMessage } from '@/lib/supabase';
import { colors, fonts } from '@/lib/theme';
import { useApp } from '@/providers/AppProvider';

export default function HomeScreen() {
  const router = useRouter();
  const { space, members, plans, setCouplePhoto, showNotice } = useApp();

  const pending = plans
    .filter((plan) => !plan.is_done)
    .sort((a, b) => (a.plan_date ?? '9999').localeCompare(b.plan_date ?? '9999'));
  const next = pending.find((plan) => plan.plan_date && plan.plan_date >= todayISO());
  const nextDate = next?.plan_date ? parseDateOnly(next.plan_date) : null;
  const together = daysTogether(space?.anniversary ?? null);
  const alone = members.length < 2;

  const changeCouplePhoto = async () => {
    try {
      const [image] = await pickImages({ multiple: false });
      if (image) await setCouplePhoto(image);
    } catch (error) {
      showNotice(errorMessage(error), 'error');
    }
  };

  return (
    <Screen>
      <View style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 96 }}
          showsVerticalScrollIndicator={false}
        >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 18,
            paddingTop: 6,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <Logo size={30} />
            <Title size={23}>LovePlans</Title>
          </View>
          <Pressable
            accessibilityLabel="Notificaciones y perfil"
            onPress={() => router.push('/nosotros')}
            style={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}
          >
            <Bell size={21} color={colors.ink} />
          </Pressable>
        </View>

        <View style={{ alignItems: 'flex-end', paddingHorizontal: 22, paddingTop: 6, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {members.map((member, index) => (
              <View key={member.user_id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {index > 0 ? <Heart size={12} color={colors.pinkDark} fill={colors.pinkDark} /> : null}
                <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ink }}>
                  {member.profile.display_name}
                </Text>
              </View>
            ))}
          </View>
          <Text style={{ fontFamily: fonts.body, fontSize: 16, color: colors.ink }}>
            Juntos por{' '}
            <Text style={{ fontFamily: fonts.display, fontSize: 38, color: colors.ink }}>{together}</Text>{' '}
            días
          </Text>
        </View>

        <View style={{ alignItems: 'center', paddingTop: 14 }}>
          <Pressable onPress={() => void changeCouplePhoto()} accessibilityLabel="Foto de pareja">
            <View
              style={{
                width: 210,
                height: 210,
                borderRadius: 105,
                overflow: 'hidden',
                backgroundColor: '#fdf9f5',
                borderWidth: 6,
                borderColor: '#fff',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: colors.ink,
                shadowOpacity: 0.12,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 8 },
                elevation: 3,
              }}
            >
              {space?.couple_photo_url ? (
                <Image
                  source={{ uri: space.couple_photo_url }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                  transition={200}
                  cachePolicy="memory-disk"
                />
              ) : (
                <View style={{ alignItems: 'center', gap: 4 }}>
                  <CatMark width={112} height={82} />
                  <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.muted }}>
                    Toca para poner su foto
                  </Text>
                </View>
              )}
            </View>
            <View
              style={{
                position: 'absolute',
                right: 12,
                bottom: 12,
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: '#fff',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: colors.ink,
                shadowOpacity: 0.16,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
              }}
            >
              <Camera size={19} color={colors.ink} />
            </View>
          </Pressable>
        </View>

        {next ? (
          <Pressable
            onPress={() => router.push({ pathname: '/plan/[id]', params: { id: next.id } })}
            style={({ pressed }) => ({
              marginHorizontal: 20,
              marginTop: 16,
              backgroundColor: colors.card,
              borderRadius: 20,
              paddingVertical: 14,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              opacity: pressed ? 0.85 : 1,
              shadowColor: colors.ink,
              shadowOpacity: 0.07,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 3 },
            })}
          >
            <View style={{ width: 52, alignItems: 'center' }}>
              <Text style={{ fontFamily: fonts.display, fontSize: 30, color: colors.peach }}>
                {nextDate?.getDate() ?? '—'}
              </Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.faint }}>
                {nextDate ? MONTHS_SHORT[nextDate.getMonth()] : ''}
              </Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.faint }}>
                Próximo plan · {inDaysLabel(next.plan_date)}
              </Text>
              <Text numberOfLines={1} style={{ fontFamily: fonts.body, fontSize: 16, color: colors.ink, marginTop: 2 }}>
                {next.title}
              </Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 }}>
                {formatWeekdayShort(next.plan_date)}
                {next.place ? ` · ${next.place}` : ''}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.faint} />
          </Pressable>
        ) : (
          <Card style={{ marginHorizontal: 20, marginTop: 16, gap: 8 }}>
            <Body size={14}>Todavía no hay un plan con fecha.</Body>
            <Button label="Planeen algo juntos" onPress={() => router.push('/nuevo')} style={{ minHeight: 44 }} />
          </Card>
        )}

        {alone ? (
          <Pressable
            onPress={() => router.push('/invite')}
            style={{
              marginHorizontal: 20,
              marginTop: 12,
              backgroundColor: colors.pinkSoft,
              borderRadius: 18,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: '#fff',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ticket size={18} color={colors.rose} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink }}>
                Falta invitar a tu persona favorita
              </Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 }}>
                Comparte el enlace para que vean los mismos planes.
              </Text>
            </View>
            <ChevronRight size={17} color={colors.rose} />
          </Pressable>
        ) : null}

        <InstallCard />

        <Text
          style={{
            textAlign: 'center',
            fontFamily: fonts.body,
            fontSize: 13,
            color: colors.muted,
            marginHorizontal: 30,
            marginBottom: 10,
            marginTop: 22,
          }}
        >
          {pending.length > 0
            ? `Hay ${pending.length} ${pending.length === 1 ? 'plan esperándolos' : 'planes esperándolos'}.`
            : '¿Qué les gustaría hacer juntos?'}
        </Text>
        </ScrollView>

        <Pressable
          onPress={() => router.push('/nuevo')}
          style={({ pressed }) => ({
            position: 'absolute',
            right: 18,
            bottom: 18,
            height: 54,
            borderRadius: 18,
            paddingHorizontal: 20,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: colors.pink,
            opacity: pressed ? 0.85 : 1,
            shadowColor: colors.pinkDark,
            shadowOpacity: 0.3,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 6 },
            elevation: 4,
          })}
        >
          <Plus size={18} color={colors.ink} />
          <Text style={{ fontFamily: fonts.body, fontSize: 15, color: colors.ink }}>Nuevo plan</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
