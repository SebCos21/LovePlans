import { ImageIcon } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { PhotoTile } from '@/components/plan-bits';
import { EmptyState, Header, Screen } from '@/components/ui';
import { formatShortNoYear } from '@/lib/dates';
import { colors, fonts } from '@/lib/theme';
import { useApp } from '@/providers/AppProvider';

export default function MemoriesScreen() {
  const router = useRouter();
  const { plans, photos } = useApp();

  const done = plans
    .filter((plan) => plan.is_done)
    .sort((a, b) => (b.plan_date ?? '').localeCompare(a.plan_date ?? ''));

  return (
    <Screen scroll>
      <Header title="Recuerdos" />
      <View style={{ paddingBottom: 20 }}>
        {done.length === 0 ? (
          <EmptyState icon={<ImageIcon size={28} color={colors.faint} />}>
            Cuando marquen un plan como hecho, su álbum aparecerá aquí.
          </EmptyState>
        ) : (
          <>
            <Text
              style={{
                textAlign: 'center',
                fontFamily: fonts.body,
                fontSize: 13,
                color: colors.muted,
                marginTop: 12,
                marginHorizontal: 30,
              }}
            >
              Las fotos de cada cita, guardadas en su plan.
            </Text>

            {done.map((plan) => {
              const planPhotos = photos.filter((photo) => photo.plan_id === plan.id);
              const visible = planPhotos.slice(0, 4);
              const extra = planPhotos.length - visible.length;
              return (
                <Pressable
                  key={plan.id}
                  onPress={() =>
                    router.push({ pathname: '/plan/[id]/album', params: { id: plan.id } })
                  }
                  style={({ pressed }) => ({
                    marginHorizontal: 18,
                    marginTop: 12,
                    backgroundColor: colors.card,
                    borderRadius: 22,
                    padding: 14,
                    opacity: pressed ? 0.9 : 1,
                    shadowColor: colors.ink,
                    shadowOpacity: 0.07,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 2 },
                  })}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, paddingHorizontal: 4, paddingBottom: 10 }}>
                    <Text style={{ fontFamily: fonts.display, fontSize: 24, color: colors.peach }}>
                      {formatShortNoYear(plan.plan_date)}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{ flex: 1, fontFamily: fonts.body, fontSize: 15, color: colors.ink }}
                    >
                      {plan.title}
                    </Text>
                    <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.faint }}>
                      {planPhotos.length} {planPhotos.length === 1 ? 'foto' : 'fotos'}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {visible.length === 0 ? (
                      <View
                        style={{
                          flex: 1,
                          height: 64,
                          borderRadius: 12,
                          backgroundColor: colors.cream,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.faint }}>
                          Sin fotos todavía
                        </Text>
                      </View>
                    ) : (
                      visible.map((photo, slot) => {
                        const isLast = slot === visible.length - 1 && extra > 0;
                        return (
                          <View key={photo.id} style={{ width: '23%' }}>
                            <View style={{ position: 'relative' }}>
                              <PhotoTile url={photo.url} />
                              {isLast ? (
                                <View
                                  style={{
                                    position: 'absolute',
                                    inset: 0,
                                    borderRadius: 12,
                                    backgroundColor: 'rgba(74,66,69,.48)',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Text style={{ fontFamily: fonts.body, fontSize: 16, color: '#fff' }}>+{extra}</Text>
                                </View>
                              ) : null}
                            </View>
                          </View>
                        );
                      })
                    )}
                  </View>
                </Pressable>
              );
            })}
          </>
        )}
      </View>
    </Screen>
  );
}
