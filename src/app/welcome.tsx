import { ArrowRight, Eye, EyeOff, Mail, User } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Body, Button, Card, Field, Logo, Screen, Title } from '@/components/ui';
import { errorMessage } from '@/lib/supabase';
import { colors, fonts } from '@/lib/theme';
import { useApp } from '@/providers/AppProvider';

const EMAIL_RE = /^\S+@\S+\.\S+$/;
type AuthMode = 'login' | 'signup';

export default function WelcomeScreen() {
  const {
    configured,
    enterDemo,
    pendingInvite,
    signIn,
    signUp,
    resetPassword,
  } = useApp();

  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setLoading(false), 12000);
    return () => clearTimeout(timer);
  }, [loading]);

  const switchMode = (next: AuthMode) => {
    setAuthMode(next);
    setError(null);
    setInfo(null);
    setPassword('');
  };

  const submit = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (authMode === 'signup' && !name.trim()) {
      setError('Cuéntanos tu nombre.');
      return;
    }
    if (!EMAIL_RE.test(cleanEmail)) {
      setError('Revisa tu correo, parece incompleto.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      if (authMode === 'login') {
        await signIn(cleanEmail, password);
      } else {
        const result = await signUp(cleanEmail, password, name);
        if (result.needsConfirmation) {
          setInfo(
            'Te enviamos un correo para confirmar tu cuenta. Abre el enlace, vuelve aquí y entra con tu contraseña.',
          );
          setAuthMode('login');
          setPassword('');
          setLoading(false);
        }
      }
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  };

  const forgot = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_RE.test(cleanEmail)) {
      setError('Escribe tu correo primero y te enviamos el enlace.');
      return;
    }
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      await resetPassword(cleanEmail);
      setInfo(`Te enviamos un enlace a ${cleanEmail} para crear una nueva contraseña.`);
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
            <Body size={28} style={{ fontFamily: fonts.display, lineHeight: 32 }}>
              {authMode === 'signup' ? 'Crea tu cuenta' : 'Qué bueno verte'}
            </Body>
            <Body size={13} color={colors.muted}>
              {authMode === 'signup'
                ? 'Solo toma un minuto. Después conectas con tu pareja.'
                : 'Entra con tu correo y contraseña para ver sus planes.'}
            </Body>
          </View>

          <View
            style={{
              flexDirection: 'row',
              backgroundColor: colors.cream,
              borderRadius: 22,
              padding: 4,
            }}
          >
            {(['login', 'signup'] as AuthMode[]).map((mode) => {
              const active = authMode === mode;
              return (
                <Pressable
                  key={mode}
                  accessibilityRole="button"
                  accessibilityLabel={
                    mode === 'login' ? 'Cambiar a iniciar sesión' : 'Cambiar a crear cuenta'
                  }
                  onPress={() => switchMode(mode)}
                  style={{
                    flex: 1,
                    height: 38,
                    borderRadius: 19,
                    backgroundColor: active ? colors.card : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: colors.ink,
                    shadowOpacity: active ? 0.1 : 0,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 1 },
                  }}
                >
                  <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink }}>
                    {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {authMode === 'signup' ? (
            <Field
              label="Tu nombre"
              placeholder="¿Cómo te llama tu pareja?"
              value={name}
              onChangeText={(next) => {
                setName(next);
                setError(null);
              }}
              autoCapitalize="words"
              autoComplete="name"
              right={<User size={18} color={colors.faint} />}
            />
          ) : null}

          <Field
            label="Correo"
            placeholder="tu@correo.com"
            value={email}
            onChangeText={(next) => {
              setEmail(next);
              setError(null);
              setInfo(null);
            }}
            keyboardType="email-address"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            right={<Mail size={18} color={colors.faint} />}
          />

          <Field
            label="Contraseña"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChangeText={(next) => {
              setPassword(next);
              setError(null);
            }}
            secureTextEntry={!showPass}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
            returnKeyType="go"
            onSubmitEditing={submit}
            right={
              <Pressable
                onPress={() => setShowPass((value) => !value)}
                style={{ padding: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                accessibilityLabel={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPass ? (
                  <EyeOff size={16} color={colors.muted} />
                ) : (
                  <Eye size={16} color={colors.muted} />
                )}
                <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.muted }}>
                  {showPass ? 'Ocultar' : 'Mostrar'}
                </Text>
              </Pressable>
            }
          />

          {error ? (
            <Card style={{ backgroundColor: '#fbe9ec', paddingVertical: 10 }}>
              <Body size={12} color={colors.rose}>
                {error}
              </Body>
            </Card>
          ) : null}

          {info ? (
            <Card style={{ backgroundColor: colors.greenBg, paddingVertical: 10 }}>
              <Body size={12} color={colors.green}>
                {info}
              </Body>
            </Card>
          ) : null}

          {authMode === 'login' ? (
            <Pressable onPress={() => void forgot()} style={{ alignSelf: 'flex-start' }}>
              <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted, textDecorationLine: 'underline' }}>
                ¿Olvidaste tu contraseña?
              </Text>
            </Pressable>
          ) : null}

          <Button
            label={authMode === 'login' ? 'Entrar' : 'Crear cuenta'}
            onPress={submit}
            loading={loading}
            disabled={!configured}
            icon={<ArrowRight size={18} color={colors.ink} />}
          />

          {!configured ? (
            <Card style={{ gap: 8, backgroundColor: '#fffdf8' }}>
              <Body size={13}>
                Falta conectar Supabase. Mientras tanto puedes ver la app con datos de ejemplo.
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
