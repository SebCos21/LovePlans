import { useLocalSearchParams, useRouter } from 'expo-router';
import { Heart, Ticket } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { Avatar, Body, Button, Card, CatMark, Field, Header, Screen, Title } from '@/components/ui';
import { errorMessage } from '@/lib/supabase';
import { colors, fonts } from '@/lib/theme';
import type { InvitePreview } from '@/lib/types';
import { useApp } from '@/providers/AppProvider';

export default function AcceptScreen() {
  const params = useLocalSearchParams<{ code?: string }>();
  const router = useRouter();
  const {
    status,
    pendingInvite,
    profile,
    partner,
    previewInvite,
    acceptInvite,
    rememberInvite,
    clearPendingInvite,
    showNotice,
    busy,
  } = useApp();

  const initial = (params.code ?? pendingInvite ?? '').toUpperCase();
  const [code, setCode] = useState(initial.replace(/[^A-Z0-9]/g, '').slice(0, 6));
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoLookup = useRef(initial.length >= 4);

  useEffect(() => {
    if (status === 'signedOut' && code.length >= 4) {
      void rememberInvite(code);
      router.replace('/welcome');
    }
  }, [status, code, rememberInvite, router]);

  const lookup = async (value?: string) => {
    const clean = (value ?? code).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    if (clean.length < 4) {
      setError('Escribe el código de 6 caracteres que te compartieron.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await previewInvite(clean);
      setPreview(result);
      if (!result.valid) setError('Ese código no existe o ya expiró. Pide uno nuevo.');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!autoLookup.current) return;
    if (status === 'signedOut' || status === 'loading') return;
    if (!code || code.length < 4) return;
    autoLookup.current = false;
    // La búsqueda es asíncrona y actualiza estado cuando llega la respuesta.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void lookup(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, code]);

  const accept = async () => {
    try {
      setError(null);
      await acceptInvite(code);
      router.replace('/(tabs)');
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const skip = async () => {
    await clearPendingInvite();
    router.replace(status === 'ready' ? '/(tabs)' : '/space');
  };

  if (status === 'loading') {
    return (
      <Screen edges={['top', 'bottom']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator color={colors.pinkDark} />
          <Body size={13} color={colors.muted}>
            Un momento…
          </Body>
        </View>
      </Screen>
    );
  }

  const valid = Boolean(preview?.valid);
  const inviterName = preview?.inviter_name ?? partner?.profile.display_name ?? 'Tu pareja';
  const myName = profile?.display_name ?? 'Tú';

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <Header onBack={() => void skip()} title="Invitación" />
      <View style={{ flex: 1, paddingHorizontal: 28, paddingTop: 12, paddingBottom: 24, alignItems: 'center' }}>
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.faint }}>Paso 2 de 2</Text>

        {valid ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18 }}>
              <Avatar name={inviterName} size={78} color={colors.blue} border={3} />
              <Heart size={22} color={colors.pinkDark} fill={colors.pinkDark} />
              <Avatar uri={profile?.avatar_url} name={myName} size={78} color={colors.pink} border={3} />
            </View>
            <Title size={30} style={{ textAlign: 'center', marginTop: 16 }}>
              {inviterName} te invitó a compartir sus planes
            </Title>
            <Body size={14} color={colors.muted} style={{ textAlign: 'center', marginTop: 6, maxWidth: 300 }}>
              Lo que uno cree, edite o elimine, el otro lo verá al instante. También compartirán las fotos de cada
              cita.
            </Body>
          </>
        ) : (
          <>
            <CatMark width={104} height={76} />
            <Title size={30} style={{ textAlign: 'center', marginTop: 6 }}>
              {error ? 'No encontramos esa invitación' : 'Tengo una invitación'}
            </Title>
            <Body size={14} color={colors.muted} style={{ textAlign: 'center', marginTop: 4, maxWidth: 300 }}>
              Escribe el código que te compartió tu pareja o abre el enlace que te envió.
            </Body>
          </>
        )}

        <View style={{ width: '100%', marginTop: 20, gap: 12 }}>
          {!valid ? (
            <>
              <Field
                label="Código de invitación"
                placeholder="SB4K9Q"
                value={code}
                onChangeText={(next) => {
                  setCode(next.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
                  setError(null);
                  setPreview(null);
                }}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={6}
                onSubmitEditing={() => void lookup()}
                right={<Ticket size={18} color={colors.faint} />}
              />
              {error ? (
                <Card style={{ backgroundColor: '#fbe9ec', paddingVertical: 10 }}>
                  <Body size={12} color={colors.rose}>
                    {error}
                  </Body>
                </Card>
              ) : null}
              <Button label="Buscar invitación" onPress={() => void lookup()} loading={loading} />
            </>
          ) : (
            <>
              {error ? (
                <Card style={{ backgroundColor: '#fbe9ec', paddingVertical: 10 }}>
                  <Body size={12} color={colors.rose}>
                    {error}
                  </Body>
                </Card>
              ) : null}
              <Button label="Aceptar y unirme" onPress={() => void accept()} loading={busy} />
              <Button label="Ahora no" variant="ghost" onPress={() => void skip()} />
              <Body size={11} color={colors.faint} style={{ textAlign: 'center' }}>
                Invitación {code} · válida por 7 días.
              </Body>
            </>
          )}

          {!valid && code.length === 0 ? (
            <Button
              label="Ya tengo un espacio, volver"
              variant="ghost"
              onPress={() => {
                showNotice('Puedes volver cuando quieras.', 'info');
                void skip();
              }}
            />
          ) : null}
        </View>
      </View>
    </Screen>
  );
}
