import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  Bell,
  Camera,
  ChevronRight,
  Clock,
  Copy,
  Heart,
  LogOut,
  Pencil,
  Ticket,
  User,
} from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { DateField } from '@/components/calendar';
import {
  Avatar,
  Body,
  Button,
  Card,
  CatMark,
  ConfirmDialog,
  Header,
  IconButton,
  Screen,
  Sheet,
  Field,
  Title,
  Toggle,
} from '@/components/ui';
import { pickImages } from '@/lib/image';
import { copyText, inviteUrl } from '@/lib/storage';
import { errorMessage } from '@/lib/supabase';
import { colors, fonts, userTone } from '@/lib/theme';
import { useApp } from '@/providers/AppProvider';

export default function UsScreen() {
  const router = useRouter();
  const {
    mode,
    space,
    members,
    myId,
    profile,
    session,
    exitDemo,
    updateSpace,
    updatePrefs,
    updateMe,
    setCouplePhoto,
    setMemberPhoto,
    refreshInvite,
    leaveSpace,
    signOut,
    showNotice,
    busy,
  } = useApp();

  const [copied, setCopied] = useState(false);
  const [editName, setEditName] = useState(false);
  const [nameDraft, setNameDraft] = useState(profile?.display_name ?? '');
  const [confirmLeave, setConfirmLeave] = useState(false);

  const me = members.find((member) => member.user_id === myId);
  const alone = members.length < 2;
  const names = members.map((member) => member.profile.display_name).join(' & ');

  const changeCouple = async () => {
    try {
      const [image] = await pickImages({ multiple: false });
      if (image) await setCouplePhoto(image);
    } catch (error) {
      showNotice(errorMessage(error), 'error');
    }
  };

  const changeMember = async (userId: string) => {
    try {
      const [image] = await pickImages({ multiple: false });
      if (image) await setMemberPhoto(userId, image);
    } catch (error) {
      showNotice(errorMessage(error), 'error');
    }
  };

  const copyInvite = async () => {
    try {
      const code = await refreshInvite();
      if (!code) {
        showNotice('No pudimos crear el enlace. Intenta de nuevo.', 'error');
        return;
      }
      await copyText(inviteUrl(code));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      showNotice(errorMessage(error), 'error');
    }
  };

  const saveName = async () => {
    try {
      await updateMe(nameDraft);
      setEditName(false);
    } catch (error) {
      showNotice(errorMessage(error), 'error');
    }
  };

  const leave = async () => {
    setConfirmLeave(false);
    try {
      await leaveSpace();
      router.replace('/space');
    } catch (error) {
      showNotice(errorMessage(error), 'error');
    }
  };

  const logout = async () => {
    await signOut();
    router.replace('/welcome');
  };

  return (
    <Screen scroll>
      <Header title="Nosotros" />
      <View style={{ paddingHorizontal: 18, paddingTop: 14, gap: 14, paddingBottom: 28 }}>
        {mode === 'demo' ? (
          <Card style={{ backgroundColor: '#fff8e8', gap: 8 }}>
            <Body size={13} color="#8a6a2f">
              Estás en el modo demo con datos de ejemplo. Nada de esto se guarda en la nube.
            </Body>
            <Button label="Salir del demo" variant="secondary" onPress={() => void exitDemo()} style={{ minHeight: 42 }} />
          </Card>
        ) : null}

        <View style={{ alignItems: 'center', gap: 8 }}>
          <Pressable onPress={() => void changeCouple()} accessibilityLabel="Cambiar foto de pareja">
            <View
              style={{
                width: 148,
                height: 148,
                borderRadius: 74,
                overflow: 'hidden',
                backgroundColor: '#fdf9f5',
                borderWidth: 5,
                borderColor: '#fff',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: colors.ink,
                shadowOpacity: 0.12,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 6 },
              }}
            >
              {space?.couple_photo_url ? (
                <Image
                  source={{ uri: space.couple_photo_url }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                  transition={180}
                />
              ) : (
                <CatMark width={84} height={60} />
              )}
            </View>
            <View
              style={{
                position: 'absolute',
                right: 4,
                bottom: 4,
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: '#fff',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: colors.ink,
                shadowOpacity: 0.16,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
              }}
            >
              <Camera size={17} color={colors.ink} />
            </View>
          </Pressable>
          <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.faint }}>
            Foto de pareja · la ven los dos
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Title size={30}>{names || 'Nuestro espacio'}</Title>
            <IconButton
              label="Editar mi nombre"
              size={34}
              onPress={() => {
                setNameDraft(profile?.display_name ?? '');
                setEditName(true);
              }}
            >
              <Pencil size={16} color={colors.faint} />
            </IconButton>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          {members.map((member) => (
            <Pressable
              key={member.user_id}
              onPress={() => void changeMember(member.user_id)}
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: 18,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                opacity: pressed ? 0.85 : 1,
                shadowColor: colors.ink,
                shadowOpacity: 0.05,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 1 },
              })}
            >
              <Avatar
                uri={member.profile.avatar_url}
                name={member.profile.display_name}
                size={46}
                color={userTone(member.user_id, myId).solid}
                border={0}
              />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink }}>
                  {member.user_id === myId ? `${member.profile.display_name} (tú)` : member.profile.display_name}
                </Text>
                <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.faint }}>Cambiar foto</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 20,
            overflow: 'hidden',
            shadowColor: colors.ink,
            shadowOpacity: 0.05,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
          }}
        >
          <View
            style={{
              paddingHorizontal: 16,
              paddingTop: 14,
              paddingBottom: 14,
              borderBottomWidth: 1,
              borderBottomColor: '#f1ebe4',
              gap: 10,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Heart size={18} color={colors.pinkDark} />
              <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink }}>Juntos desde</Text>
            </View>
            <DateField
              value={space?.anniversary ?? null}
              onChange={(next) => {
                void updateSpace({ anniversary: next }).catch((error) =>
                  showNotice(errorMessage(error), 'error'),
                );
              }}
              label="Juntos desde"
            />
          </View>

          <Row
            icon={<Bell size={18} color={colors.ink} />}
            label="Avisarme cuando agregue un plan"
            right={
              <Toggle
                value={Boolean(me?.notify_new_plan)}
                onChange={(next) => {
                  void updatePrefs({ notify_new_plan: next }).catch((error) =>
                    showNotice(errorMessage(error), 'error'),
                  );
                }}
              />
            }
          />

          <Row
            icon={<Clock size={18} color={colors.faint} />}
            label="Recordatorio un día antes"
            right={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, opacity: 0.55 }}>
                <Text style={{ fontFamily: fonts.body, fontSize: 10, color: colors.faint }}>Pronto</Text>
                <Toggle value={false} />
              </View>
            }
          />

          {alone ? (
            <Row
              icon={<Ticket size={18} color={colors.rose} />}
              label="Invitar a mi pareja"
              right={<ChevronRight size={17} color={colors.faint} />}
              onPress={() => router.push('/invite')}
            />
          ) : null}

          <Row
            icon={<Copy size={18} color={colors.ink} />}
            label="Copiar enlace de invitación"
            right={
              <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.faint }}>
                {copied ? 'Copiado' : ''}
              </Text>
            }
            onPress={() => void copyInvite()}
            last
          />
        </View>

        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 20,
            overflow: 'hidden',
            shadowColor: colors.ink,
            shadowOpacity: 0.05,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
          }}
        >
          <Row
            icon={<User size={18} color={colors.ink} />}
            label="Mi cuenta"
            right={
              <Text numberOfLines={1} style={{ fontFamily: fonts.body, fontSize: 12, color: colors.faint, maxWidth: 190 }}>
                {session?.user.email ?? (mode === 'demo' ? 'sofi@demo.loveplans.app' : '')}
              </Text>
            }
          />
          <Row
            icon={<LogOut size={18} color={colors.ink} />}
            label="Cerrar sesión"
            right={<ChevronRight size={17} color={colors.faint} />}
            onPress={() => void logout()}
            last
          />
        </View>

        <Pressable
          onPress={() => setConfirmLeave(true)}
          disabled={mode === 'demo'}
          style={{ alignSelf: 'center', paddingVertical: 10, opacity: mode === 'demo' ? 0.35 : 1 }}
        >
          <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.rose }}>Salir del espacio compartido</Text>
        </Pressable>

        <Text style={{ textAlign: 'center', fontFamily: fonts.body, fontSize: 11, color: colors.faint }}>
          LovePlans · hecho para dos
        </Text>
      </View>

      <Sheet visible={editName} onClose={() => setEditName(false)} title="Tu nombre">
        <View style={{ gap: 14, paddingBottom: 8 }}>
          <Field label="¿Cómo te llamas?" value={nameDraft} onChangeText={setNameDraft} autoFocus />
          <Button label="Guardar" onPress={() => void saveName()} loading={busy} />
        </View>
      </Sheet>

      <ConfirmDialog
        visible={confirmLeave}
        title="¿Salir del espacio compartido?"
        body="Dejarán de ver los mismos planes. Podrán volver a conectarse con una nueva invitación."
        confirmLabel="Salir"
        danger
        onCancel={() => setConfirmLeave(false)}
        onConfirm={() => void leave()}
      />
    </Screen>
  );
}

function Row({
  icon,
  label,
  right,
  onPress,
  last,
}: {
  icon: ReactNode;
  label: string;
  right?: ReactNode;
  onPress?: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({
        minHeight: 56,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: '#f1ebe4',
        backgroundColor: pressed ? '#fdfaf6' : 'transparent',
      })}
    >
      {icon}
      <Text style={{ flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.ink }}>{label}</Text>
      {right}
    </Pressable>
  );
}
