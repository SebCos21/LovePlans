import { Image } from 'expo-image';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import type { ReactNode } from 'react';

import { colors, fonts, radius } from '@/lib/theme';
import { CAT_MARK } from './mark';

/* ------------------------------------------------------------------ */
/* Texto                                                               */
/* ------------------------------------------------------------------ */

export function Title({ children, size = 40, style }: { children: ReactNode; size?: number; style?: StyleProp<TextStyle> }) {
  return (
    <Text style={[{ fontFamily: fonts.display, fontSize: size, lineHeight: size * 1.02, color: colors.ink }, style]}>
      {children}
    </Text>
  );
}

export function Body({
  children,
  size = 15,
  color = colors.ink,
  weight = '400',
  style,
  numberOfLines,
}: {
  children: ReactNode;
  size?: number;
  color?: string;
  weight?: '400' | '500' | '600' | '700';
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        { fontFamily: fonts.body, fontSize: size, lineHeight: size * 1.55, color, fontWeight: weight },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

/* ------------------------------------------------------------------ */
/* Logo                                                                */
/* ------------------------------------------------------------------ */

export function Logo({ size = 96 }: { size?: number }) {
  return (
    <Image
      source={require('../../assets/images/logo-mark.png')}
      style={{ width: size, height: size }}
      contentFit="contain"
      accessibilityLabel="LovePlans"
    />
  );
}

export function CatMark({ width = 96, height = 70 }: { width?: number; height?: number }) {
  return <SvgXml xml={CAT_MARK} width={width} height={height} />;
}

/* ------------------------------------------------------------------ */
/* Botones                                                             */
/* ------------------------------------------------------------------ */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'dark' | 'danger';

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = {
    primary: { bg: colors.pink, fg: colors.ink, border: 'transparent', h: 54 },
    secondary: { bg: 'transparent', fg: colors.muted, border: colors.line, h: 50 },
    ghost: { bg: 'transparent', fg: colors.muted, border: 'transparent', h: 44 },
    dark: { bg: colors.ink, fg: '#ffffff', border: 'transparent', h: 52 },
    danger: { bg: colors.pink, fg: colors.rose, border: 'transparent', h: 50 },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          minHeight: palette.h,
          borderRadius: radius.pill,
          backgroundColor: palette.bg,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: palette.border,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
          paddingHorizontal: 20,
          opacity: disabled ? 0.45 : pressed ? 0.82 : 1,
          shadowColor: variant === 'primary' ? colors.pinkDark : 'transparent',
          shadowOpacity: variant === 'primary' ? 0.25 : 0,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: variant === 'primary' ? 2 : 0,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.fg} />
      ) : (
        <>
          {icon}
          <Text style={{ fontFamily: fonts.body, fontSize: 16, color: palette.fg }}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function IconButton({
  children,
  onPress,
  label,
  size = 44,
  color = colors.ink,
  disabled,
}: {
  children: ReactNode;
  onPress?: () => void;
  label: string;
  size?: number;
  color?: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.4 : pressed ? 0.6 : 1,
      })}
      hitSlop={6}
    >
      {children}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Contenedores                                                        */
/* ------------------------------------------------------------------ */

export function Screen({
  children,
  scroll = false,
  edges = ['top'],
  contentStyle,
  refreshControl,
}: {
  children: ReactNode;
  scroll?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  contentStyle?: StyleProp<ViewStyle>;
  refreshControl?: ReactNode;
}) {
  const inner = (
    <View style={[{ flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center' }, contentStyle]}>
      {children}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={edges} style={{ flex: 1 }}>
        {scroll ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 28 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshControl={refreshControl as never}
          >
            {inner}
          </ScrollView>
        ) : (
          inner
        )}
      </SafeAreaView>
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: radius.card,
          padding: 16,
          shadowColor: colors.ink,
          shadowOpacity: 0.06,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 2 },
          elevation: 1,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Header({
  title,
  onBack,
  right,
  left,
}: {
  title?: ReactNode;
  onBack?: () => void;
  right?: ReactNode;
  left?: ReactNode;
}) {
  return (
    <View
      style={{
        height: 54,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.line,
        paddingHorizontal: 6,
      }}
    >
      <View style={{ width: 76, alignItems: 'flex-start' }}>
        {onBack ? (
          <IconButton label="Volver" onPress={onBack}>
            <BackIcon />
          </IconButton>
        ) : (
          left
        )}
      </View>
      <View style={{ flex: 1, alignItems: 'center' }}>
        {typeof title === 'string' ? <Title size={27}>{title}</Title> : title}
      </View>
      <View style={{ width: 76, alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'flex-end' }}>
        {right}
      </View>
    </View>
  );
}

function BackIcon() {
  return (
    <SvgXml
      xml={`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${colors.ink}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>`}
      width={24}
      height={24}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Formularios                                                         */
/* ------------------------------------------------------------------ */

export function Field({
  label,
  error,
  right,
  style,
  ...props
}: TextInputProps & { label?: string; error?: string | null; right?: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={{ position: 'relative', justifyContent: 'center' }}>
        <TextInput
          placeholderTextColor={colors.faint}
          {...props}
          style={[
            styles.input,
            props.multiline ? { minHeight: 88, paddingTop: 12, textAlignVertical: 'top' } : null,
            error ? { borderColor: colors.pinkDark } : null,
            right ? { paddingRight: 76 } : null,
            style as never,
          ]}
        />
        {right ? <View style={{ position: 'absolute', right: 8 }}>{right}</View> : null}
      </View>
      {error ? <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.rose }}>{error}</Text> : null}
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  icon,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        height: 38,
        paddingHorizontal: 14,
        borderRadius: radius.pill,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: selected ? colors.pinkSoft : colors.card,
        borderWidth: 1,
        borderColor: selected ? colors.pinkDark : colors.line,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      {icon}
      <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ink }}>{label}</Text>
    </Pressable>
  );
}

export function Toggle({ value, onChange }: { value: boolean; onChange?: (next: boolean) => void }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onChange?.(!value)}
      style={{
        width: 46,
        height: 27,
        borderRadius: 14,
        padding: 3,
        backgroundColor: value ? colors.trackOn : colors.track,
        alignItems: value ? 'flex-end' : 'flex-start',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: 21,
          height: 21,
          borderRadius: 11,
          backgroundColor: '#fff',
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 2,
          shadowOffset: { width: 0, height: 1 },
          elevation: 1,
        }}
      />
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Avatar                                                              */
/* ------------------------------------------------------------------ */

export function Avatar({
  uri,
  name,
  size = 48,
  color = colors.pink,
  border = 3,
}: {
  uri?: string | null;
  name: string;
  size?: number;
  color?: string;
  border?: number;
}) {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
        backgroundColor: color,
        borderWidth: border,
        borderColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={150} />
      ) : (
        <Text style={{ fontFamily: fonts.body, fontSize: size * 0.38, color: colors.ink }}>{initial}</Text>
      )}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Estados                                                             */
/* ------------------------------------------------------------------ */

export function EmptyState({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <View style={{ paddingVertical: 56, paddingHorizontal: 32, alignItems: 'center', gap: 12 }}>
      {icon}
      <Text
        style={{
          fontFamily: fonts.body,
          fontSize: 14,
          lineHeight: 23,
          color: colors.muted,
          textAlign: 'center',
        }}
      >
        {children}
      </Text>
    </View>
  );
}

export function LoadingOverlay({ visible, label }: { visible: boolean; label?: string }) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: 'rgba(74,66,69,.32)', alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            backgroundColor: colors.bg,
            borderRadius: 24,
            paddingVertical: 26,
            paddingHorizontal: 32,
            alignItems: 'center',
            gap: 10,
          }}
        >
          <ActivityIndicator color={colors.pinkDark} />
          <Body size={14}>{label ?? 'Un momento…'}</Body>
        </View>
      </View>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Hoja inferior                                                       */
/* ------------------------------------------------------------------ */

export function Sheet({
  visible,
  onClose,
  children,
  title,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={{ flex: 1, backgroundColor: colors.overlay }} onPress={onClose} />
      <View
        style={{
          backgroundColor: colors.bg,
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          paddingHorizontal: 20,
          paddingTop: 10,
          paddingBottom: Math.max(28, insets.bottom + 18),
          maxHeight: '88%',
          width: '100%',
          maxWidth: 560,
          alignSelf: 'center',
        }}
      >
        <View style={{ alignItems: 'center', paddingBottom: 6 }}>
          <View style={{ width: 38, height: 5, borderRadius: 3, backgroundColor: '#ddd5cd' }} />
        </View>
        {title ? (
          <View style={{ alignItems: 'center', paddingVertical: 6 }}>
            <Title size={26}>{title}</Title>
          </View>
        ) : null}
        <ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView>
      </View>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Confirmación                                                        */
/* ------------------------------------------------------------------ */

export function ConfirmDialog({
  visible,
  title,
  body,
  confirmLabel = 'Aceptar',
  cancelLabel = 'Cancelar',
  onCancel,
  onConfirm,
  danger,
}: {
  visible: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  danger?: boolean;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(74,66,69,.38)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 28,
        }}
      >
        <View style={{ width: '100%', maxWidth: 380, backgroundColor: colors.bg, borderRadius: 24, padding: 22, gap: 8 }}>
          <Text style={{ fontFamily: fonts.body, fontSize: 17, color: colors.ink, textAlign: 'center' }}>{title}</Text>
          {body ? (
            <Text style={{ fontFamily: fonts.body, fontSize: 13, lineHeight: 21, color: colors.muted, textAlign: 'center' }}>
              {body}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => ({
                flex: 1,
                height: 46,
                borderRadius: 23,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.line,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink }}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => ({
                flex: 1,
                height: 46,
                borderRadius: 23,
                backgroundColor: danger ? colors.rose : colors.pink,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text style={{ fontFamily: fonts.body, fontSize: 14, color: danger ? '#fff' : colors.ink }}>
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Aviso flotante                                                      */
/* ------------------------------------------------------------------ */

export function NoticeBar({
  message,
  tone,
  onClose,
}: {
  message: string | null;
  tone: 'info' | 'error' | 'success';
  onClose: () => void;
}) {
  if (!message) return null;
  const palette = {
    info: { bg: '#fff', border: colors.line, fg: colors.ink },
    error: { bg: '#fbe9ec', border: colors.pinkDark, fg: colors.rose },
    success: { bg: colors.greenBg, border: '#cbe4d5', fg: colors.green },
  }[tone];

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: 10,
        left: 0,
        right: 0,
        zIndex: 1000,
        paddingHorizontal: 14,
        alignItems: 'center',
      }}
    >
      <Pressable
        onPress={onClose}
        style={{
          width: '100%',
          maxWidth: 520,
          backgroundColor: palette.bg,
          borderWidth: 1,
          borderColor: palette.border,
          borderRadius: 18,
          paddingVertical: 12,
          paddingHorizontal: 16,
          shadowColor: colors.ink,
          shadowOpacity: 0.18,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 6,
        }}
      >
        <Text style={{ fontFamily: fonts.body, fontSize: 13, lineHeight: 20, color: palette.fg }}>{message}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.faint,
  },
  input: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
  },
});
