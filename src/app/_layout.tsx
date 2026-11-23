import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { NoticeBar } from '@/components/ui';
import { colors, fonts } from '@/lib/theme';
import { AppProvider, useApp } from '@/providers/AppProvider';

void SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Caveat_700Bold: require('../../assets/fonts/Caveat-Bold.ttf'),
    GowunDodum_400Regular: require('../../assets/fonts/GowunDodum-Regular.ttf'),
  });

  useEffect(() => {
    if (Platform.OS === 'web') {
      document.getElementById('boot')?.remove();
      document.documentElement.style.backgroundColor = colors.bg;
    }
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <StatusBar style="dark" />
          <RootNavigator />
          <FloatingNotice />
          <UpdateBanner />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const { status, pendingInvite, recoveryMode } = useApp();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const top = (segments[0] as string | undefined) ?? '';

    if (recoveryMode) {
      if (top !== 'reset-password') router.replace('/reset-password');
      return;
    }

    if (status === 'loading') return;

    if (status === 'signedOut') {
      if (!['welcome', 'accept', 'reset-password'].includes(top)) router.replace('/welcome');
      return;
    }

    if (status === 'needsSpace') {
      if (pendingInvite && top !== 'accept') {
        router.replace({ pathname: '/accept', params: { code: pendingInvite } });
        return;
      }
      if (!['space', 'invite', 'accept', 'i'].includes(top)) router.replace('/space');
      return;
    }

    if (pendingInvite && top !== 'accept') {
      router.replace({ pathname: '/accept', params: { code: pendingInvite } });
      return;
    }

    if (['welcome', 'i', 'demo', 'reset-password'].includes(top) || top === '') {
      router.replace('/(tabs)');
    }
  }, [status, segments, pendingInvite, recoveryMode, router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="nuevo"
        options={{
          presentation: Platform.OS === 'web' ? 'card' : 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen name="plan/[id]" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="plan/[id]/album" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="i/[code]" options={{ animation: 'fade' }} />
      <Stack.Screen name="reset-password" options={{ animation: 'fade' }} />
      <Stack.Screen name="demo" options={{ animation: 'fade' }} />
    </Stack>
  );
}

function FloatingNotice() {
  const { notice, noticeTone, dismissNotice } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + 6, left: 0, right: 0 }}>
      <NoticeBar message={notice} tone={noticeTone} onClose={dismissNotice} />
    </View>
  );
}

function UpdateBanner() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }
    const hadController = Boolean(navigator.serviceWorker.controller);
    const onControllerChange = () => {
      if (hadController) setReady(true);
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    return () => navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
  }, []);

  if (!ready) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: 96, alignItems: 'center', zIndex: 900 }}
    >
      <Pressable
        onPress={() => window.location.reload()}
        style={{
          backgroundColor: colors.ink,
          borderRadius: 999,
          paddingVertical: 10,
          paddingHorizontal: 18,
          flexDirection: 'row',
          gap: 8,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
        }}
      >
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: '#fff' }}>Nueva versión · Recargar</Text>
      </Pressable>
    </View>
  );
}
