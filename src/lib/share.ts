import { Platform, Share } from 'react-native';
import { copyText } from './storage';

type NavigatorWithShare = Navigator & {
  share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
};

export type ShareResult = 'shared' | 'copied' | 'whatsapp';

export async function shareInvite(url: string, message: string): Promise<ShareResult> {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
    const nav = navigator as NavigatorWithShare;
    if (nav.share) {
      try {
        await nav.share({ title: 'LovePlans', text: message, url });
        return 'shared';
      } catch {
        // el usuario canceló o el navegador falló: seguimos con copiar
      }
    }

    const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (mobile) {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${message} ${url}`)}`, '_blank');
      return 'whatsapp';
    }

    await copyText(`${message} ${url}`);
    return 'copied';
  }

  const result = await Share.share({ message: `${message} ${url}` });
  return result.action === Share.sharedAction ? 'shared' : 'copied';
}
