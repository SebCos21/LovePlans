import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Body, Button, EmptyState, Header, Logo, Screen } from '@/components/ui';
import { colors } from '@/lib/theme';
import { useApp } from '@/providers/AppProvider';

export default function InviteLinkScreen() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const router = useRouter();
  const { rememberInvite, status } = useApp();

  useEffect(() => {
    if (!code) return;
    void rememberInvite(String(code));
  }, [code, rememberInvite]);

  useEffect(() => {
    if (!code || status === 'loading') return;
    if (status === 'signedOut') {
      router.replace('/welcome');
      return;
    }
    router.replace({ pathname: '/accept', params: { code: String(code) } });
  }, [code, status, router]);

  if (!code) {
    return (
      <Screen edges={['top', 'bottom']}>
        <Header onBack={() => router.replace('/welcome')} title="Invitación" />
        <EmptyState>Este enlace no tiene un código de invitación.</EmptyState>
        <Button label="Ir a entrar" onPress={() => router.replace('/welcome')} />
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        <Logo size={120} />
        <Body size={14} color={colors.muted}>
          Abriendo invitación…
        </Body>
        <ActivityIndicator color={colors.pinkDark} />
      </View>
    </Screen>
  );
}
