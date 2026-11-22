import { useRouter } from 'expo-router';
import { ChevronRight, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { MonthGrid, MonthNavigator, type CalendarMarks } from '@/components/calendar';
import { CategoryIcon } from '@/components/plan-bits';
import { Body, Header, IconButton, Screen } from '@/components/ui';
import { formatLong, monthOf, todayISO } from '@/lib/dates';
import { categoryMeta, colors, fonts, userTone } from '@/lib/theme';
import { useApp } from '@/providers/AppProvider';

export default function CalendarScreen() {
  const router = useRouter();
  const { plans, members, myId } = useApp();
  const [view, setView] = useState(() => monthOf(todayISO()));
  const [selected, setSelected] = useState(todayISO());

  const marks: CalendarMarks = {};
  for (const plan of plans) {
    if (!plan.plan_date) continue;
    const color = plan.is_done ? '#d8cfc6' : userTone(plan.created_by, myId).solid;
    marks[plan.plan_date] = [...(marks[plan.plan_date] ?? []), color];
  }

  const dayPlans = plans.filter((plan) => plan.plan_date === selected);

  return (
    <Screen scroll>
      <Header
        title="Calendario"
        right={
          <IconButton label="Nuevo plan" onPress={() => router.push({ pathname: '/nuevo', params: { date: selected } })}>
            <Plus size={24} color={colors.ink} />
          </IconButton>
        }
      />

      <MonthNavigator year={view.year} month={view.month} onChange={setView} />
      <MonthGrid
        year={view.year}
        month={view.month}
        selected={selected}
        onSelect={setSelected}
        marks={marks}
      />

      <View style={{ marginHorizontal: 18, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.line }}>
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted }}>{formatLong(selected)}</Text>
      </View>

      <View style={{ paddingTop: 4, paddingBottom: 20 }}>
        {dayPlans.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 16, gap: 12 }}>
            <Body size={13} color={colors.faint}>
              Nada planeado este día.
            </Body>
            <Pressable
              onPress={() => router.push({ pathname: '/nuevo', params: { date: selected } })}
              style={{
                height: 42,
                borderRadius: 21,
                paddingHorizontal: 18,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.line,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Plus size={16} color={colors.ink} />
              <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink }}>Planear algo este día</Text>
            </Pressable>
          </View>
        ) : (
          dayPlans.map((plan) => {
            const author = members.find((member) => member.user_id === plan.created_by);
            const tone = userTone(plan.created_by, myId);
            return (
              <Pressable
                key={plan.id}
                onPress={() => router.push({ pathname: '/plan/[id]', params: { id: plan.id } })}
                style={({ pressed }) => ({
                  marginHorizontal: 18,
                  marginTop: 8,
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  opacity: pressed ? 0.85 : 1,
                  shadowColor: colors.ink,
                  shadowOpacity: 0.05,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 1 },
                })}
              >
                <View
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: 5,
                    backgroundColor: tone.solid,
                  }}
                />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontFamily: fonts.body, fontSize: 15, color: colors.ink }}>{plan.title}</Text>
                  <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.faint, marginTop: 2 }}>
                    {categoryMeta[plan.category]?.label ?? plan.category} ·{' '}
                    {plan.place ?? author?.profile.display_name ?? 'Por decidir'}
                  </Text>
                </View>
                <CategoryIcon category={plan.category} size={15} color={colors.faint} />
                <ChevronRight size={16} color={colors.faint} />
              </Pressable>
            );
          })
        )}
      </View>
    </Screen>
  );
}
