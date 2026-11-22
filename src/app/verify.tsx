import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, RotateCw } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, TextInput, View } from 'react-native';

import { Body, Button, Card, Header, Logo, Screen, Title } from '@/components/ui';
import { errorMessage } from '@/lib/supabase';
import { colors, fonts } from '@/lib/theme';
import { useApp } from '@/providers/AppProvider';

export default function VerifyScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  const router = useRouter();
  const { sendCode, verifyCode, status } = useApp();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(30);
  const [entering, setEntering] = useState(false);
  const submitted = useRef(false);

  useEffect(() => {
    if (!email) router.replace('/welcome');
  }, [email, router]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  useEffect(() => {
    if (!entering) return;
    const timer = setTimeout(() => {
      if (status === 'signedOut') {
        setEntering(false);
        setLoading(false);
        setError('No pudimos completar la entrada. Pide un código nuevo e intenta otra vez.');
      }
    }, 9000);
    return () => clearTimeout(timer);
  }, [entering, status]);

  const submit = async (value?: string) => {
    const token = (value ?? code).replace(/\D/g, '');
    if (token.length !== 6 || !email || loading) return;
    setLoading(true);
    setError(null);
    try {
      await verifyCode(email, token);
      setEntering(true);
    } catch (err) {
      setError(errorMessage(err));
      submitted.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    const clean = code.replace(/\D/g, '');
    if (clean.length === 6 && !submitted.current) {
      submitted.current = true;
      void submit(clean);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const resend = async () => {
    if (!email || resendIn > 0) return;
    try {
      await sendCode(email);
      setResendIn(30);
      setError(null);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <Header onBack={() => router.replace('/welcome')} title="Tu código" />
      <View style={{ flex: 1, paddingHorizontal: 28, paddingTop: 26, alignItems: 'center' }}>
        <Logo size={104} />
        <Title size={36} style={{ marginTop: 6 }}>
          Revisa tu correo
        </Title>
        <Body size={14} color={colors.muted} style={{ textAlign: 'center', marginTop: 6, maxWidth: 300 }}>
          Enviamos un código de 6 dígitos a{' '}
          <Text style={{ color: colors.ink }}>{email ?? 'tu correo'}</Text>. Escríbelo aquí.
        </Body>

        <View style={{ marginTop: 26, width: '100%', maxWidth: 340, alignItems: 'center', gap: 12 }}>
          <TextInput
            value={code}
            onChangeText={(next) => {
              setCode(next.replace(/\D/g, '').slice(0, 6));
              setError(null);
            }}
            onSubmitEditing={() => void submit()}
            keyboardType="number-pad"
            inputMode="numeric"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={6}
            autoFocus
            placeholder="······"
            placeholderTextColor={colors.faint}
            style={{
              width: '100%',
              height: 66,
              borderRadius: 18,
              borderWidth: 1.5,
              borderColor: error ? colors.pinkDark : colors.line,
              backgroundColor: colors.card,
              textAlign: 'center',
              fontFamily: fonts.body,
              fontSize: 28,
              letterSpacing: 12,
              color: colors.ink,
            }}
          />

          {error ? (
            <Card style={{ backgroundColor: '#fbe9ec', paddingVertical: 10, width: '100%' }}>
              <Body size={12} color={colors.rose}>
                {error}
              </Body>
            </Card>
          ) : null}

          {entering || loading || status === 'loading' ? (
            <View style={{ alignItems: 'center', gap: 8, paddingVertical: 10 }}>
              <ActivityIndicator color={colors.pinkDark} />
              <Body size={13} color={colors.muted}>
                Entrando a LovePlans…
              </Body>
            </View>
          ) : (
            <Button label="Entrar" onPress={() => void submit()} style={{ width: '100%' }} />
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <RotateCw size={14} color={colors.faint} />
            <Text
              onPress={() => void resend()}
              style={{
                fontFamily: fonts.body,
                fontSize: 13,
                color: resendIn > 0 ? colors.faint : colors.rose,
                textDecorationLine: resendIn > 0 ? 'none' : 'underline',
              }}
            >
              {resendIn > 0 ? `Reenviar en ${resendIn}s` : 'Reenviar código'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <ArrowLeft size={14} color={colors.faint} />
            <Text
              onPress={() => router.replace('/welcome')}
              style={{ fontFamily: fonts.body, fontSize: 12, color: colors.faint }}
            >
              Cambiar correo
            </Text>
          </View>
        </View>
      </View>
    </Screen>
  );
}
