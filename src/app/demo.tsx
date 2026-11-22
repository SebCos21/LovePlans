import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Body, Logo, Screen } from '@/components/ui';
import { colors } from '@/lib/theme';
import { useApp } from '@/providers/AppProvider';

export default function DemoScreen() {
  const router = useRouter();
  const { enterDemo } = useApp();

  useEffect(() => {
    void enterDemo().then(() => router.replace('/(tabs)'));
  }, [enterDemo, router]);

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        <Logo size={120} />
        <Body size={14} color={colors.muted}>
          Cargando la demo…
        </Body>
        <ActivityIndicator color={colors.pinkDark} />
      </View>
    </Screen>
  );
}
