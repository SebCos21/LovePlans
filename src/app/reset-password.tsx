import { useRouter } from 'expo-router';
import { Check, Eye, EyeOff, Lock } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Body, Button, Card, Field, Header, Screen, Title } from '@/components/ui';
import { errorMessage } from '@/lib/supabase';
import { colors, fonts } from '@/lib/theme';
import { useApp } from '@/providers/AppProvider';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { recoveryMode, session, updatePassword, showNotice } = useApp();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canReset = recoveryMode || Boolean(session);

  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/welcome');
  };

  const submit = async () => {
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las dos contraseñas no coinciden.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await updatePassword(password);
      showNotice('Contraseña actualizada. Bienvenida de nuevo.', 'success');
      router.replace('/(tabs)');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!canReset) {
    return (
      <Screen edges={['top', 'bottom']}>
        <Header onBack={back} title="Nueva contraseña" />
        <View style={{ flex: 1, paddingHorizontal: 28, paddingTop: 24, alignItems: 'center', gap: 14 }}>
          <Lock size={34} color={colors.faint} />
          <Title size={30} style={{ textAlign: 'center' }}>
            El enlace expiró o no es válido
          </Title>
          <Body size={14} color={colors.muted} style={{ textAlign: 'center', maxWidth: 300 }}>
            Pide otro enlace desde la pantalla de entrada con “¿Olvidaste tu contraseña?”.
          </Body>
          <Button label="Volver a entrar" onPress={() => router.replace('/welcome')} style={{ width: '100%' }} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <Header onBack={back} title="Nueva contraseña" />
      <View style={{ flex: 1, paddingHorizontal: 28, paddingTop: 24, paddingBottom: 28, gap: 14 }}>
        <Title size={34}>Crea una contraseña nueva</Title>
        <Body size={14} color={colors.muted}>
          Después podrás entrar a LovePlans con tu correo y esta contraseña.
        </Body>

        <Field
          label="Contraseña nueva"
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChangeText={(next) => {
            setPassword(next);
            setError(null);
          }}
          secureTextEntry={!showPass}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          right={
            <Pressable
              onPress={() => setShowPass((value) => !value)}
              style={{ padding: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}
              accessibilityLabel={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPass ? <EyeOff size={16} color={colors.muted} /> : <Eye size={16} color={colors.muted} />}
              <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.muted }}>
                {showPass ? 'Ocultar' : 'Mostrar'}
              </Text>
            </Pressable>
          }
        />

        <Field
          label="Repite la contraseña"
          placeholder="Otra vez"
          value={confirm}
          onChangeText={(next) => {
            setConfirm(next);
            setError(null);
          }}
          secureTextEntry={!showPass}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          returnKeyType="go"
          onSubmitEditing={submit}
        />

        {error ? (
          <Card style={{ backgroundColor: '#fbe9ec', paddingVertical: 10 }}>
            <Body size={12} color={colors.rose}>
              {error}
            </Body>
          </Card>
        ) : null}

        <Button
          label="Guardar contraseña"
          onPress={submit}
          loading={loading}
          icon={<Check size={18} color={colors.ink} />}
        />
      </View>
    </Screen>
  );
}
