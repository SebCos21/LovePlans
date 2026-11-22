import { Download, MoreHorizontal, Share, Smartphone } from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { Platform, Text, View } from 'react-native';

import { isIOS, isInAppBrowser, isStandalone, storage } from '@/lib/storage';
import { colors, fonts } from '@/lib/theme';
import { Body, Button, Card, Sheet } from './ui';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISS_KEY = 'loveplans-install-dismissed-v1';
const INSTALLABLE_EVENT = 'loveplans-installable';

let capturedPrompt: InstallPromptEvent | null = null;

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    capturedPrompt = event as InstallPromptEvent;
    window.dispatchEvent(new Event(INSTALLABLE_EVENT));
  });
}

export function InstallCard() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(capturedPrompt);
  const [hidden, setHidden] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    if (isStandalone()) return;

    storage.get<boolean>(DISMISS_KEY).then((dismissed) => setHidden(Boolean(dismissed)));

    const onInstallable = () => setPromptEvent(capturedPrompt);
    const onInstalled = () => {
      setHidden(true);
      void storage.set(DISMISS_KEY, true);
    };
    window.addEventListener(INSTALLABLE_EVENT, onInstallable);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener(INSTALLABLE_EVENT, onInstallable);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (Platform.OS !== 'web' || hidden || isStandalone()) return null;

  const dismiss = () => {
    setHidden(true);
    void storage.set(DISMISS_KEY, true);
  };

  const inApp = isInAppBrowser();
  const ios = isIOS();

  const install = async () => {
    if (promptEvent) {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === 'accepted') setHidden(true);
      setPromptEvent(null);
      return;
    }
    setHelpOpen(true);
  };

  return (
    <>
      <Card style={{ marginHorizontal: 18, marginTop: 14, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: colors.pinkSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Smartphone size={19} color={colors.rose} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink }}>
              {inApp ? 'Ábrelo en tu navegador' : 'Ten LovePlans a mano'}
            </Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 12, lineHeight: 18, color: colors.muted }}>
              {inApp
                ? 'Los links de WhatsApp no permiten instalar la app. Toca “Abrir en Safari/Chrome”.'
                : ios
                  ? 'Añádelo a tu pantalla de inicio y se abre como una app.'
                  : 'Instálalo en tu pantalla de inicio, sin pasar por una tienda.'}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button
            label={ios ? 'Cómo instalarlo' : 'Instalar'}
            onPress={install}
            style={{ flex: 1, minHeight: 42 }}
            icon={<Download size={16} color={colors.ink} />}
          />
          <Button label="Ahora no" variant="secondary" onPress={dismiss} style={{ minHeight: 42, paddingHorizontal: 16 }} />
        </View>
      </Card>

      <Sheet visible={helpOpen} onClose={() => setHelpOpen(false)} title="Añadir a inicio">
        {ios ? (
          <View style={{ gap: 16, paddingHorizontal: 6, paddingBottom: 8 }}>
            <Step
              n="1"
              text="Abre LovePlans en Safari (no dentro de WhatsApp ni Instagram)."
              icon={<MoreHorizontal size={18} color={colors.rose} />}
            />
            <Step
              n="2"
              text="Toca el botón Compartir en la barra inferior de Safari."
              icon={<Share size={18} color={colors.rose} />}
            />
            <Step n="3" text="Elige “Añadir a pantalla de inicio” y confirma." />
            <Body size={12} color={colors.faint}>
              En iOS 26 el interruptor “Abrir como app web” viene activado. Déjalo así.
            </Body>
            <Button label="Entendido" onPress={() => setHelpOpen(false)} />
          </View>
        ) : (
          <View style={{ gap: 16, paddingHorizontal: 6, paddingBottom: 8 }}>
            <Step n="1" text="Abre el menú de Chrome (los tres puntos)." />
            <Step n="2" text="Toca “Instalar aplicación” o “Añadir a pantalla de inicio”." />
            <Step n="3" text="Confirma y ábrela desde tu inicio." />
            <Button label="Entendido" onPress={() => setHelpOpen(false)} />
          </View>
        )}
      </Sheet>
    </>
  );
}

function Step({ n, text, icon }: { n: string; text: string; icon?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: colors.pinkSoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.rose }}>{n}</Text>
      </View>
      <Text style={{ flex: 1, fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: colors.ink }}>{text}</Text>
      {icon}
    </View>
  );
}
