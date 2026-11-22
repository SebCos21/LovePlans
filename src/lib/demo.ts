import { addDaysISO, todayISO } from './dates';
import { storage } from './storage';
import type { Member, Plan, PlanPhoto, Profile, Space } from './types';

const KEY = 'loveplans-demo-v1';

export type DemoDB = {
  space: Space;
  members: Member[];
  plans: Plan[];
  photos: PlanPhoto[];
  meId: string;
  invitationCode: string;
};

function profile(id: string, name: string, _color: 'him' | 'her'): Profile {
  return {
    id,
    display_name: name,
    avatar_path: null,
    avatar_url: null,
  };
}

/** Imagen de ejemplo generada localmente (sin internet). */
function demoPhoto(label: string, from: string, to: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/><circle cx="322" cy="78" r="62" fill="rgba(255,255,255,.30)"/><circle cx="72" cy="334" r="92" fill="rgba(255,255,255,.18)"/><path d="M200 250c-35-30-70-58-70-95 0-28 22-48 48-48 16 0 28 8 36 20 8-12 20-20 36-20 26 0 48 20 48 48 0 37-35 65-70 95l-14 12z" fill="rgba(255,255,255,.78)"/><text x="200" y="362" text-anchor="middle" font-family="sans-serif" font-size="20" fill="rgba(74,66,69,.45)">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function createDemoDb(): DemoDB {
  const today = todayISO();
  const spaceId = 'demo-space';
  const her = profile('demo-her', 'Sofi', 'her');
  const him = profile('demo-him', 'Sebas', 'him');

  const base = {
    space_id: spaceId,
    updated_by: null,
    done_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const plans: Plan[] = [
    {
      ...base,
      id: 'demo-p1',
      title: 'Picnic al atardecer',
      plan_date: addDaysISO(today, 7),
      place: 'Parque de la 93',
      category: 'comida',
      notes: 'Llevar la manta de cuadros, fresas y el parlante. Llegar antes de las 5 para ver el sol.',
      is_favorite: true,
      is_done: false,
      created_by: her.id,
    },
    {
      ...base,
      id: 'demo-p2',
      title: 'Noche de pelis con mantita',
      plan_date: addDaysISO(today, 3),
      place: 'En casa',
      category: 'cine',
      notes: 'Cada uno elige una película sin decirle al otro.',
      is_favorite: false,
      is_done: false,
      created_by: him.id,
    },
    {
      ...base,
      id: 'demo-p3',
      title: 'Clase de cerámica juntos',
      plan_date: addDaysISO(today, 14),
      place: 'Taller Barro Lento',
      category: 'especial',
      notes: 'Hacer una taza para cada uno y regalársela.',
      is_favorite: true,
      is_done: false,
      created_by: her.id,
    },
    {
      ...base,
      id: 'demo-p4',
      title: 'Escapada a la playa',
      plan_date: addDaysISO(today, 28),
      place: 'Cartagena',
      category: 'viaje',
      notes: 'Buscar hotel cerca de la ciudad amurallada.',
      is_favorite: true,
      is_done: false,
      created_by: him.id,
    },
    {
      ...base,
      id: 'demo-p5',
      title: 'Aprender a bailar salsa',
      plan_date: null,
      place: null,
      category: 'aventura',
      notes: 'Algún día de enero.',
      is_favorite: false,
      is_done: false,
      created_by: her.id,
    },
    {
      ...base,
      id: 'demo-p6',
      title: 'Ramen en el sitio nuevo',
      plan_date: addDaysISO(today, -7),
      place: 'Chapinero',
      category: 'comida',
      notes: 'Pedir el de miso picante.',
      is_favorite: false,
      is_done: true,
      done_at: new Date().toISOString(),
      created_by: him.id,
    },
    {
      ...base,
      id: 'demo-p7',
      title: 'Cocinar pasta desde cero',
      plan_date: addDaysISO(today, -14),
      place: 'En casa',
      category: 'casa',
      notes: '',
      is_favorite: false,
      is_done: true,
      done_at: new Date().toISOString(),
      created_by: him.id,
    },
    {
      ...base,
      id: 'demo-p8',
      title: 'Ver el amanecer en la montaña',
      plan_date: addDaysISO(today, -30),
      place: 'Monserrate',
      category: 'aventura',
      notes: 'Subimos a las 4 a.m. y valió la pena.',
      is_favorite: true,
      is_done: true,
      done_at: new Date().toISOString(),
      created_by: her.id,
    },
  ];

  const photos: PlanPhoto[] = [
    ...[1, 2, 3, 4, 5].map((n) => ({
      id: `demo-photo-ramen-${n}`,
      plan_id: 'demo-p6',
      space_id: spaceId,
      storage_path: `demo://ramen-${n}`,
      width: 800,
      height: 800,
      created_by: him.id,
      created_at: new Date().toISOString(),
      url: demoPhoto('ramen', '#fbe9ec', '#f7dde2'),
    })),
    ...[1, 2].map((n) => ({
      id: `demo-photo-pasta-${n}`,
      plan_id: 'demo-p7',
      space_id: spaceId,
      storage_path: `demo://pasta-${n}`,
      width: 800,
      height: 800,
      created_by: him.id,
      created_at: new Date().toISOString(),
      url: demoPhoto('pasta', '#faf1e2', '#f4e6cd'),
    })),
    ...[1, 2, 3, 4, 5, 6, 7].map((n) => ({
      id: `demo-photo-montana-${n}`,
      plan_id: 'demo-p8',
      space_id: spaceId,
      storage_path: `demo://montana-${n}`,
      width: 800,
      height: 800,
      created_by: her.id,
      created_at: new Date().toISOString(),
      url: demoPhoto('montaña', '#e7f3ec', '#d9ecdf'),
    })),
  ];

  return {
    space: {
      id: spaceId,
      title: 'Nuestro espacio',
      anniversary: addDaysISO(today, -280),
      couple_photo_path: null,
      couple_photo_url: null,
      created_at: new Date().toISOString(),
    },
    members: [
      {
        user_id: her.id,
        space_id: spaceId,
        notify_new_plan: true,
        remind_day_before: true,
        profile: her,
      },
      {
        user_id: him.id,
        space_id: spaceId,
        notify_new_plan: true,
        remind_day_before: true,
        profile: him,
      },
    ],
    plans,
    photos,
    meId: her.id,
    invitationCode: 'DEMO24',
  };
}

export async function loadDemoDb(): Promise<DemoDB> {
  const saved = await storage.get<DemoDB>(KEY);
  if (saved && saved.space && saved.members?.length && saved.plans) return saved;
  const fresh = createDemoDb();
  await storage.set(KEY, fresh);
  return fresh;
}

export async function saveDemoDb(db: DemoDB): Promise<void> {
  await storage.set(KEY, db);
}

export async function resetDemoDb(): Promise<DemoDB> {
  const fresh = createDemoDb();
  await storage.set(KEY, fresh);
  return fresh;
}
