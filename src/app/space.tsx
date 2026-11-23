import { useRouter } from 'expo-router';
import { HeartHandshake, LogOut, Mail, Ticket } from 'lucide-react-native';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

import { Avatar, Body, Button, Screen, Title } from '@/components/ui';
import { errorMessage } from '@/lib/supabase';
import { colors, fonts } from '@/lib/theme';
import { useApp } from '@/providers/AppProvider';

export default function SpaceScreen() {
  const router = useRouter();
  const { profile, session, space, signOut, createSpace, busy, configured, enterDemo, showNotice } = useApp();

  useEffect(() => {
    if (space) router.replace('/invite');
  }, [space, router]);

  const create = async () => {
    try {
      await createSpace();
      router.replace('/invite');
    } catch (error) {
      showNotice(errorMessage(error), 'error');
    }
  };

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <View style={{ flex: 1, paddingHorizontal: 30, paddingTop: 18, paddingBottom: 28, alignItems: 'center' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, width: '100%' }}>
          <Avatar uri={profile?.avatar_url} name={profile?.display_name ?? '?'} size={92} color={colors.pink} border={4} />
          <Title size={44}>Hola, {profile?.display_name ?? 'tú'}</Title>
          <Body size={12} color={colors.faint}>
            {session?.user.email ? `Sesión con ${session.user.email}` : 'Sesión iniciada'}
          </Body>
          <Body size={15} color={colors.muted} style={{ textAlign: 'center', maxWidth: 280, marginTop: 8 }}>
            Ahora conecten sus teléfonos para ver y editar los mismos planes.
          </Body>
        </View>

        <View style={{ width: '100%', gap: 10 }}>
          <Button
            label="Crear nuestro espacio"
            onPress={() => void create()}
            loading={busy}
            icon={<HeartHandshake size={18} color={colors.ink} />}
          />
          <Button
            label="Tengo una invitación"
            variant="secondary"
            onPress={() => router.push('/accept')}
            icon={<Ticket size={17} color={colors.muted} />}
          />
          {!configured ? (
            <Button label="Probar la demo" variant="ghost" onPress={() => void enterDemo()} />
          ) : null}
          <Button
            label="Cerrar sesión"
            variant="ghost"
            onPress={() => void signOut()}
            icon={<LogOut size={16} color={colors.faint} />}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
            <Mail size={13} color={colors.faint} />
            <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.faint }}>
              Usa tu correo y contraseña para entrar.
            </Text>
          </View>
        </View>
      </View>
    </Screen>
  );
}
