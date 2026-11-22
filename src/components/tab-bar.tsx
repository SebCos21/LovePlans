import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { CalendarDays, Heart, Images, List, User } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { colors, fonts } from '@/lib/theme';

const META: Record<string, { label: string; Icon: typeof Heart }> = {
  index: { label: 'Inicio', Icon: Heart },
  planes: { label: 'Planes', Icon: List },
  calendario: { label: 'Calendario', Icon: CalendarDays },
  recuerdos: { label: 'Recuerdos', Icon: Images },
  nosotros: { label: 'Nosotros', Icon: User },
};

export function LoveTabBar({ state, emitter, navigateToTab, insets }: BottomTabBarProps) {

  return (
    <View
      style={{
        borderTopWidth: 1,
        borderTopColor: colors.line,
        backgroundColor: colors.bg,
        paddingTop: 8,
        paddingBottom: Math.max(insets.bottom, 10),
        paddingHorizontal: 4,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          width: '100%',
          maxWidth: 560,
          alignSelf: 'center',
        }}
      >
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const meta = META[route.name] ?? { label: route.name, Icon: Heart };
          const Icon = meta.Icon;

          const onPress = () => {
            const event = emitter.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigateToTab(route.key);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={meta.label}
              onPress={onPress}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 3 }}
            >
              <Icon
                size={22}
                color={focused ? colors.ink : colors.faint}
                fill={focused && route.name === 'index' ? colors.pinkDark : 'none'}
                strokeWidth={focused ? 2 : 1.7}
              />
              <View
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  marginTop: 5,
                  backgroundColor: focused ? colors.pinkDark : 'transparent',
                }}
              />
              <Text
                style={{
                  fontFamily: fonts.body,
                  fontSize: 10,
                  marginTop: 2,
                  color: focused ? colors.ink : colors.faint,
                }}
              >
                {meta.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
