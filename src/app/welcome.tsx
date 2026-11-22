import { useRouter } from 'expo-router';
import { ArrowRight, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Body, Button, Card, Field, Logo, Screen, Title } from '@/components/ui';
import { errorMessage } from '@/lib/supabase';
import { colors, fonts } from '@/lib/theme';
import { useApp } from '@/providers/AppProvider';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export default function WelcomeScreen() {
  const { sendCode, enterDemo, configured, pendingInvite } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const clean = email.trim().toLowerCase();
    if (!EMAIL_RE.test(clean)) {
      setError('Revisa tu correo, parece incompleto.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await sendCode(clean);
      router.push({ pathname: '/verify', params: { email: clean } });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <View style={{ flex: 1, paddingHorizontal: 30, paddingTop: 16, paddingBottom: 26, gap: 18 }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <Pressable
            onLongPress={() => {
              void enterDemo();
            }}
            delayLongPress={1200}
            accessibilityLabel="LovePlans"
            style={{ width: 196, height: 196, alignItems: 'center', justifyContent: 'center' }}
          >
            <Logo size={196} />
          </Pressable>
          <Title size={54}>LovePlans</Title>
          <Body size={15} color={colors.muted} style={{ textAlign: 'center', maxWidth: 280 }}>
            Todos los planes que soñamos juntos, en un solo lugar.
          </Body>
        </View>

        <View style={{ gap: 12 }}>
          {pendingInvite ? (
            <Card style={{ paddingVertical: 12, paddingHorizontal: 14, backgroundColor: colors.pinkSoft }}>
              <Body size={13} color={colors.rose}>
                Después de entrar podrás aceptar la invitación de tu pareja.
              </Body>
            </Card>
          ) : null}

          <View>
            <Body size={26} style={{ fontFamily: fonts.display, lineHeight: 30, marginBottom: 2 }}>
              Qué bueno verte
            </Body>
            <Body size={13} color={colors.muted}>
              Escribe tu correo y te enviamos un código de 6 dígitos.
            </Body>
          </View>

          <Field
            label="Correo"
            placeholder="tu@correo.com"
            value={email}
            onChangeText={(next) => {
              setEmail(next);
              setError(null);
            }}
            keyboardType="email-address"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            returnKeyType="send"
            onSubmitEditing={submit}
            error={error}
            right={<Mail size={18} color={colors.faint} />}
          />

          <Button
            label="Enviar código"
            onPress={submit}
            loading={loading}
            disabled={!configured}
            icon={<ArrowRight size={18} color={colors.ink} />}
          />

          {!configured ? (
            <Card style={{ gap: 8, backgroundColor: '#fffdf8' }}>
              <Body size={13}>
                Falta conectar Supabase para enviar códigos. Mientras tanto puedes ver la app con datos de ejemplo.
              </Body>
              <Button label="Probar la demo" variant="secondary" onPress={() => void enterDemo()} />
            </Card>
          ) : null}

          <Pressable
            onPress={() => void enterDemo()}
            style={{ alignSelf: 'center', padding: 8, opacity: configured ? 0.28 : 0 }}
            accessibilityLabel="Modo demo"
          >
            <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.faint }}>·</Text>
          </Pressable>

          <Body size={11} color={colors.faint} style={{ textAlign: 'center', lineHeight: 17 }}>
            Solo tú y tu pareja pueden ver sus planes y fotos.
          </Body>
        </View>
      </View>
    </Screen>
  );
}
