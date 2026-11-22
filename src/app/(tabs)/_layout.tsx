import { Tabs } from 'expo-router/js-tabs';

import { LoveTabBar } from '@/components/tab-bar';
import { colors } from '@/lib/theme';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <LoveTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="planes" options={{ title: 'Planes' }} />
      <Tabs.Screen name="calendario" options={{ title: 'Calendario' }} />
      <Tabs.Screen name="recuerdos" options={{ title: 'Recuerdos' }} />
      <Tabs.Screen name="nosotros" options={{ title: 'Nosotros' }} />
    </Tabs>
  );
}
