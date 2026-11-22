import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import type { PickedImage } from './types';

const MAX_SIDE = 1600;

export async function prepareImage(asset: ImagePicker.ImagePickerAsset): Promise<PickedImage> {
  const context = ImageManipulator.manipulate(asset.uri, {
    maxWidth: MAX_SIDE,
    maxHeight: MAX_SIDE,
  });
  const image = await context.renderAsync();
  const saved = await image.saveAsync({
    compress: 0.82,
    format: SaveFormat.JPEG,
    base64: true,
  });
  context.release();
  image.release();

  return {
    uri: saved.uri,
    base64: saved.base64 ?? '',
    width: saved.width,
    height: saved.height,
  };
}

export async function pickImages(options?: {
  multiple?: boolean;
  camera?: boolean;
}): Promise<PickedImage[]> {
  const multiple = options?.multiple ?? true;
  const camera = options?.camera ?? false;

  if (camera) {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) throw new Error('Necesitamos permiso para usar la cámara.');
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (result.canceled) return [];
    return Promise.all(result.assets.map(prepareImage));
  }

  if (ImagePicker.requestMediaLibraryPermissionsAsync) {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Necesitamos permiso para acceder a tus fotos.');
    }
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: multiple,
    selectionLimit: multiple ? 12 : 1,
    quality: 1,
  });
  if (result.canceled) return [];
  return Promise.all(result.assets.map(prepareImage));
}

export function base64ToBytes(base64: string): Uint8Array {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function toDataUrl(base64: string): string {
  return `data:image/jpeg;base64,${base64}`;
}

export function randomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
