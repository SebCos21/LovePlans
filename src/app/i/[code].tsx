import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Body, Logo, Screen } from '@/components/ui';
import { colors } from '@/lib/theme';
import { useApp } from '@/providers/AppProvider';

export default function InviteLinkScreen() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const { rememberInvite } = useApp();

  useEffect(() => {
    if (code) void rememberInvite(String(code));
  }, [code, rememberInvite]);

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
