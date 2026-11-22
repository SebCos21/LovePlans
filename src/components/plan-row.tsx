import { Heart } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { formatWeekdayShort } from '@/lib/dates';
import { colors, fonts } from '@/lib/theme';
import type { Plan } from '@/lib/types';
import { CategoryIcon } from './plan-bits';

export function PlanRow({
  plan,
  index,
  authorName,
  authorColor,
  onPress,
  onToggleFavorite,
}: {
  plan: Plan;
  index: number;
  authorName: string;
  authorColor: string;
  onPress: () => void;
  onToggleFavorite: () => void;
}) {
  const meta = [formatWeekdayShort(plan.plan_date), plan.place].filter(Boolean).join(' · ');

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        paddingLeft: 18,
        paddingRight: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.line,
        backgroundColor: pressed ? 'rgba(255,255,255,.65)' : 'transparent',
      })}
    >
      <Text
        style={{
          width: 30,
          fontFamily: fonts.display,
          fontSize: 24,
          color: colors.peach,
          fontStyle: 'italic',
        }}
      >
        {String(index + 1).padStart(2, '0')}
      </Text>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text numberOfLines={1} style={{ flexShrink: 1, fontFamily: fonts.body, fontSize: 15, color: colors.ink }}>
            {plan.title}
          </Text>
          {plan.is_done ? <CategoryIcon category={plan.category} size={13} color={colors.faint} /> : null}
        </View>
        <Text numberOfLines={1} style={{ fontFamily: fonts.body, fontSize: 12, color: colors.faint, marginTop: 3 }}>
          {meta || authorName}
        </Text>
      </View>
      <Pressable
        accessibilityLabel={plan.is_favorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
        onPress={(event) => {
          event.stopPropagation();
          onToggleFavorite();
        }}
        hitSlop={8}
        style={{ width: 34, height: 34, alignItems: 'center', justifyContent: 'center' }}
      >
        <Heart
          size={19}
          color={plan.is_favorite ? colors.pinkDark : '#cfc6c9'}
          fill={plan.is_favorite ? colors.pinkDark : 'none'}
        />
      </Pressable>
      <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: authorColor }} />
    </Pressable>
  );
}
