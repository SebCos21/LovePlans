import { useRouter } from 'expo-router';
import { Heart, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { PlanRow } from '@/components/plan-row';
import { EmptyState, Header, IconButton, Screen } from '@/components/ui';
import { errorMessage } from '@/lib/supabase';
import { colors, fonts, userTone } from '@/lib/theme';
import { useApp } from '@/providers/AppProvider';

type Filter = 'all' | 'fav' | string;

export default function PlansScreen() {
  const router = useRouter();
  const { plans, members, myId, toggleFavorite, showNotice } = useApp();
  const [filter, setFilter] = useState<Filter>('all');

  const pending = plans
    .filter((plan) => !plan.is_done)
    .sort((a, b) => (a.plan_date ?? '9999').localeCompare(b.plan_date ?? '9999'));

  const filtered = pending.filter((plan) => {
    if (filter === 'all') return true;
    if (filter === 'fav') return plan.is_favorite;
    return plan.created_by === filter;
  });

  const chips: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'fav', label: 'Favoritos' },
    ...members.map((member) => ({
      key: member.user_id,
      label: member.user_id === myId ? 'Míos' : member.profile.display_name,
    })),
  ];

  return (
    <Screen>
      <Header
        title="Planes"
        right={
          <IconButton label="Nuevo plan" onPress={() => router.push('/nuevo')}>
            <Plus size={24} color={colors.ink} />
          </IconButton>
        }
      />

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 18, rowGap: 2, flexWrap: 'wrap', paddingHorizontal: 16, paddingTop: 12 }}>
        {chips.map((chip) => {
          const active = filter === chip.key;
          return (
            <Pressable
              key={chip.key}
              onPress={() => setFilter(chip.key)}
              style={{ paddingVertical: 6, borderBottomWidth: 2, borderBottomColor: active ? colors.pinkDark : 'transparent' }}
            >
              <Text
                style={{
                  fontFamily: fonts.body,
                  fontSize: 13,
                  color: active ? colors.ink : colors.faint,
                }}
              >
                {chip.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ flex: 1, marginTop: 4 }}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Heart size={28} color={colors.faint} />}
          >
            {filter === 'fav'
              ? 'Todavía no han marcado favoritos.\nToca el corazón de un plan que les ilusione.'
              : 'Nada por aquí todavía.\nAgreguen el primer plan que les haga ilusión.'}
          </EmptyState>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 96 }}
            showsVerticalScrollIndicator={false}
          >
            {filtered.map((plan, index) => {
              const author = members.find((member) => member.user_id === plan.created_by);
              const color = userTone(plan.created_by, myId).solid;
              return (
                <PlanRow
                  key={plan.id}
                  plan={plan}
                  index={index}
                  authorName={author?.profile.display_name ?? '—'}
                  authorColor={color}
                  onPress={() => router.push({ pathname: '/plan/[id]', params: { id: plan.id } })}
                  onToggleFavorite={() => {
                    void toggleFavorite(plan.id).catch((error) => showNotice(errorMessage(error), 'error'));
                  }}
                />
              );
            })}

            <Text
              style={{
                textAlign: 'center',
                fontFamily: fonts.body,
                fontSize: 12,
                color: colors.faint,
                paddingVertical: 18,
              }}
            >
              {pending.length} {pending.length === 1 ? 'plan por hacer' : 'planes por hacer'}
            </Text>
          </ScrollView>
        )}
      </View>

      <Pressable
        onPress={() => router.push('/nuevo')}
        style={({ pressed }) => ({
          position: 'absolute',
          right: 18,
          bottom: 18,
          height: 54,
          borderRadius: 18,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          backgroundColor: colors.pink,
          opacity: pressed ? 0.85 : 1,
          shadowColor: colors.pinkDark,
          shadowOpacity: 0.3,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: 4,
        })}
      >
        <Plus size={18} color={colors.ink} />
        <Text style={{ fontFamily: fonts.body, fontSize: 15, color: colors.ink }}>Nuevo plan</Text>
      </Pressable>
    </Screen>
  );
}
