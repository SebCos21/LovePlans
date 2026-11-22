import { useRouter } from 'expo-router';
import { Check, Copy, Send } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Body, Button, Card, CatMark, Header, Screen, Title } from '@/components/ui';
import { copyText, inviteUrl } from '@/lib/storage';
import { shareInvite } from '@/lib/share';
import { errorMessage } from '@/lib/supabase';
import { colors, fonts } from '@/lib/theme';
import { useApp } from '@/providers/AppProvider';

export default function InviteScreen() {
  const router = useRouter();
  const { invitationCode, refreshInvite, members, busy, showNotice } = useApp();
  const [copied, setCopied] = useState(false);
  const requested = useRef(false);

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;
    void refreshInvite().catch((error) => showNotice(errorMessage(error), 'error'));
  }, [refreshInvite, showNotice]);

  const url = invitationCode ? inviteUrl(invitationCode) : '';
  const connected = members.length >= 2;

  const copy = async () => {
    if (!url) return;
    await copyText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const share = async () => {
    if (!url) return;
    const result = await shareInvite(
      url,
      '¿Hacemos nuestra lista de planes juntos? Únete en LovePlans:',
    );
    showNotice(
      result === 'copied'
        ? 'Enlace copiado. Pégalo en WhatsApp.'
        : result === 'whatsapp'
          ? 'Abriendo WhatsApp…'
          : 'Invitación lista para enviar.',
      'success',
    );
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <Header onBack={() => router.replace('/(tabs)')} title="Invitación" />
      <View style={{ flex: 1, paddingHorizontal: 28, paddingTop: 14, paddingBottom: 24, alignItems: 'center' }}>
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.faint }}>
          {connected ? 'Ya están los dos' : 'Paso 1 de 2'}
        </Text>
        <CatMark width={104} height={76} />
        <Title size={30} style={{ textAlign: 'center', marginTop: 4 }}>
          {connected ? 'Ya comparten sus planes' : 'Invita a tu persona favorita'}
        </Title>
        <Body size={14} color={colors.muted} style={{ textAlign: 'center', marginTop: 6, maxWidth: 300 }}>
          {connected
            ? 'Todo lo que uno cree, edite o elimine, el otro lo verá al instante.'
            : 'Envíale este enlace por WhatsApp. Cuando lo abra, los dos verán y editarán los mismos planes.'}
        </Body>

        {!connected ? (
          <View
            style={{
              width: '100%',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: 16,
              paddingLeft: 16,
              paddingRight: 6,
              paddingVertical: 6,
              marginTop: 18,
            }}
          >
            <Text numberOfLines={1} style={{ flex: 1, fontFamily: fonts.body, fontSize: 13, color: colors.muted }}>
              {url || 'Generando enlace…'}
            </Text>
            <Pressable
              onPress={() => void copy()}
              disabled={!url}
              style={{
                height: 38,
                paddingHorizontal: 14,
                borderRadius: 12,
                backgroundColor: colors.cream,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                opacity: url ? 1 : 0.4,
              }}
            >
              {copied ? <Check size={15} color={colors.green} /> : <Copy size={15} color={colors.ink} />}
              <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ink }}>
                {copied ? 'Copiado' : 'Copiar'}
              </Text>
            </Pressable>
          </View>
        ) : (
          <Card style={{ width: '100%', marginTop: 18, backgroundColor: colors.greenBg }}>
            <Body size={13} color={colors.green} style={{ textAlign: 'center' }}>
              La invitación fue aceptada. Ya pueden empezar a planear.
            </Body>
          </Card>
        )}

        <View style={{ flex: 1, minHeight: 16 }} />

        {!connected ? (
          <View style={{ width: '100%', gap: 10 }}>
            <Button
              label="Compartir por WhatsApp"
              onPress={() => void share()}
              disabled={!url || busy}
              icon={<Send size={17} color={colors.ink} />}
            />
            <Button
              label="Continuar a la app"
              variant="secondary"
              onPress={() => router.replace('/(tabs)')}
            />
            <Body size={11} color={colors.faint} style={{ textAlign: 'center' }}>
              Puedes ir agregando planes mientras tu pareja acepta.
            </Body>
          </View>
        ) : (
          <View style={{ width: '100%', gap: 10 }}>
            <Button label="Ir a la app" onPress={() => router.replace('/(tabs)')} />
          </View>
        )}
      </View>
    </Screen>
  );
}
