import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { loadDemoDb, saveDemoDb, type DemoDB } from '@/lib/demo';
import { errorMessage, isSupabaseConfigured, requireSupabase, supabase } from '@/lib/supabase';
import { publicAppUrl, storage } from '@/lib/storage';
import { base64ToBytes, randomId, toDataUrl } from '@/lib/image';
import type {
  InvitePreview,
  Member,
  PickedImage,
  Plan,
  PlanInput,
  PlanPhoto,
  Profile,
  Space,
} from '@/lib/types';

type Status = 'loading' | 'signedOut' | 'needsSpace' | 'ready';
type Mode = 'supabase' | 'demo';
type NoticeTone = 'info' | 'error' | 'success';

export type AppContextValue = {
  configured: boolean;
  mode: Mode;
  status: Status;
  session: Session | null;
  profile: Profile | null;
  myId: string | null;
  space: Space | null;
  members: Member[];
  partner: Member | null;
  plans: Plan[];
  photos: PlanPhoto[];
  invitationCode: string | null;
  pendingInvite: string | null;
  busy: boolean;
  notice: string | null;
  noticeTone: NoticeTone;
  showNotice: (message: string, tone?: NoticeTone) => void;
  dismissNotice: () => void;
  sendCode: (email: string) => Promise<void>;
  verifyCode: (email: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  enterDemo: () => Promise<void>;
  exitDemo: () => Promise<void>;
  rememberInvite: (code: string) => Promise<void>;
  clearPendingInvite: () => Promise<void>;
  previewInvite: (code: string) => Promise<InvitePreview>;
  createSpace: (title?: string) => Promise<void>;
  acceptInvite: (code: string) => Promise<void>;
  leaveSpace: () => Promise<void>;
  refreshInvite: () => Promise<string | null>;
  updatePrefs: (patch: Partial<Pick<Member, 'notify_new_plan' | 'remind_day_before'>>) => Promise<void>;
  savePlan: (input: PlanInput, images?: PickedImage[]) => Promise<string | null>;
  deletePlan: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  toggleDone: (id: string) => Promise<void>;
  addPhotos: (planId: string, images: PickedImage[]) => Promise<void>;
  deletePhoto: (photo: PlanPhoto) => Promise<void>;
  setCouplePhoto: (image: PickedImage) => Promise<void>;
  setMemberPhoto: (userId: string, image: PickedImage) => Promise<void>;
  updateSpace: (patch: Partial<Pick<Space, 'title' | 'anniversary'>>) => Promise<void>;
  updateMe: (name: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);
const PENDING_INVITE_KEY = 'loveplans-pending-invite';

export function AppProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>('supabase');
  const [session, setSession] = useState<Session | null>(null);
  const [demoMeId, setDemoMeId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>(isSupabaseConfigured ? 'loading' : 'signedOut');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [space, setSpace] = useState<Space | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [photos, setPhotos] = useState<PlanPhoto[]>([]);
  const [invitationCode, setInvitationCode] = useState<string | null>(null);
  const [pendingInvite, setPendingInvite] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeTone, setNoticeTone] = useState<NoticeTone>('info');

  const demoRef = useRef<DemoDB | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedAt = useRef(0);
  const myIdRef = useRef<string | null>(null);
  const membersRef = useRef<Member[]>([]);
  const bootedRef = useRef<string | null>(null);

  const myId = mode === 'demo' ? demoMeId : session?.user.id ?? null;
  const spaceId = space?.id ?? null;
  const profileId = profile?.id ?? null;
  const partner = useMemo(
    () => members.find((member) => member.user_id !== myId) ?? null,
    [members, myId],
  );

  useEffect(() => {
    myIdRef.current = myId ?? null;
    membersRef.current = members;
  }, [myId, members]);

  const showNotice = useCallback((message: string, tone: NoticeTone = 'info') => {
    setNotice(message);
    setNoticeTone(tone);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 3600);
  }, []);

  const dismissNotice = useCallback(() => setNotice(null), []);

  const rememberInvite = useCallback(async (code: string) => {
    const clean = code.trim().toUpperCase();
    setPendingInvite(clean);
    await storage.set(PENDING_INVITE_KEY, clean);
  }, []);

  const clearPendingInvite = useCallback(async () => {
    setPendingInvite(null);
    await storage.remove(PENDING_INVITE_KEY);
  }, []);

  useEffect(() => {
    storage.get<string>(PENDING_INVITE_KEY).then((code) => {
      if (code) setPendingInvite(code);
    });
  }, []);

  const signPlanPhotos = useCallback(async (rows: PlanPhoto[]): Promise<PlanPhoto[]> => {
    const client = supabase;
    if (!client || rows.length === 0) return rows;
    const paths = rows.map((row) => row.storage_path).filter(Boolean);
    const { data } = await client.storage.from('plan-photos').createSignedUrls(paths, 60 * 60 * 24);
    const byPath = new Map((data ?? []).map((item) => [item.path, item.signedUrl]));
    return rows.map((row) => ({ ...row, url: byPath.get(row.storage_path) ?? null }));
  }, []);

  const signSpaceMedia = useCallback(
    async (spaceRow: Space | null, memberRows: Member[]): Promise<{ space: Space | null; members: Member[] }> => {
      const client = supabase;
      if (!client || !spaceRow) return { space: spaceRow, members: memberRows };

      let nextSpace = spaceRow;
      if (spaceRow.couple_photo_path) {
        const { data } = await client.storage
          .from('space-media')
          .createSignedUrl(spaceRow.couple_photo_path, 60 * 60 * 24);
        nextSpace = { ...spaceRow, couple_photo_url: data?.signedUrl ?? null };
      }

      const avatarPaths = memberRows
        .map((member) => member.profile?.avatar_path)
        .filter((path): path is string => Boolean(path));

      if (avatarPaths.length === 0) return { space: nextSpace, members: memberRows };

      const { data } = await client.storage.from('space-media').createSignedUrls(avatarPaths, 60 * 60 * 24);
      const byPath = new Map((data ?? []).map((item) => [item.path, item.signedUrl]));

      return {
        space: nextSpace,
        members: memberRows.map((member) => ({
          ...member,
          profile: {
            ...member.profile,
            avatar_url: member.profile?.avatar_path
              ? byPath.get(member.profile.avatar_path) ?? null
              : null,
          },
        })),
      };
    },
    [],
  );

  const loadSpaceData = useCallback(
    async (spaceId: string) => {
      const client = requireSupabase();
      const [{ data: spaceRow }, { data: memberRows }, { data: planRows }, { data: photoRows }, { data: inviteRow }] =
        await Promise.all([
          client.from('spaces').select('*').eq('id', spaceId).single(),
          client
            .from('space_members')
            .select('user_id, space_id, notify_new_plan, remind_day_before, profile:profiles(*)')
            .eq('space_id', spaceId),
          client.from('plans').select('*').eq('space_id', spaceId).order('plan_date', { ascending: true }),
          client.from('plan_photos').select('*').eq('space_id', spaceId).order('created_at', { ascending: true }),
          client
            .from('invitations')
            .select('code')
            .eq('space_id', spaceId)
            .is('accepted_at', null)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

      const normalizedMembers = ((memberRows ?? []) as unknown as Member[]).map((member) => ({
        ...member,
        profile: Array.isArray(member.profile) ? member.profile[0] : member.profile,
      }));

      if (!spaceRow || normalizedMembers.length === 0) {
        setStatus('needsSpace');
        return;
      }

      const signed = await signSpaceMedia((spaceRow as Space) ?? null, normalizedMembers);      const signedPhotos = await signPlanPhotos((photoRows ?? []) as PlanPhoto[]);

      setSpace(signed.space);
      setMembers(signed.members);
      setPlans((planRows ?? []) as Plan[]);
      setPhotos(signedPhotos);
      setInvitationCode(inviteRow?.code ?? null);
      loadedAt.current = Date.now();
    },
    [signPlanPhotos, signSpaceMedia],
  );

  const bootstrap = useCallback(
    async (user: Session['user']) => {
      const client = requireSupabase();
      setStatus('loading');
      const fallbackName =
        (user.user_metadata?.display_name as string | undefined) ??
        user.email?.split('@')[0] ??
        'Sin nombre';

      const { data: existing } = await client
        .from('profiles')
        .select('id, display_name, avatar_path')
        .eq('id', user.id)
        .maybeSingle();

      let profileRow = existing as Profile | null;
      if (!profileRow) {
        const { data: created } = await client
          .from('profiles')
          .upsert(
            { id: user.id, display_name: fallbackName },
            { onConflict: 'id' },
          )
          .select('id, display_name, avatar_path')
          .single();
        profileRow = (created as Profile | null) ?? {
          id: user.id,
          display_name: fallbackName,
          avatar_path: null,
        };
      }
      setProfile(profileRow);

      const { data: membership } = await client
        .from('space_members')
        .select('space_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (!membership?.space_id) {
        setSpace(null);
        setMembers([]);
        setPlans([]);
        setPhotos([]);
        setInvitationCode(null);
        setStatus('needsSpace');
        return;
      }

      await loadSpaceData(membership.space_id);
      setStatus('ready');
    },
    [loadSpaceData],
  );

  // Sesión de Supabase
  useEffect(() => {
    if (mode === 'demo') return;
    if (!supabase) return;

    const bootUser = async (user: Session['user']) => {
      if (bootedRef.current === user.id) return;
      bootedRef.current = user.id;
      try {
        await bootstrap(user);
      } catch (error) {
        bootedRef.current = null;
        throw error;
      }
    };

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (!data.session) {
        setStatus('signedOut');
        return;
      }
      bootUser(data.session.user).catch((error) => {
        showNotice(errorMessage(error), 'error');
        setStatus('signedOut');
      });
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        bootedRef.current = null;
        setProfile(null);
        setSpace(null);
        setMembers([]);
        setPlans([]);
        setPhotos([]);
        setInvitationCode(null);
        setStatus('signedOut');
      } else if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        bootUser(nextSession.user).catch((error) => {
          showNotice(errorMessage(error), 'error');
          setStatus('signedOut');
        });
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [mode, bootstrap, showNotice]);

  const resetSupabaseState = useCallback(() => {
    setProfile(null);
    setSpace(null);
    setMembers([]);
    setPlans([]);
    setPhotos([]);
    setInvitationCode(null);
    setStatus('signedOut');
  }, []);

  const refreshPlans = useCallback(async () => {
    if (mode !== 'supabase' || !spaceId) return;
    const client = requireSupabase();
    const { data } = await client
      .from('plans')
      .select('*')
      .eq('space_id', spaceId)
      .order('plan_date', { ascending: true });
    setPlans((data ?? []) as Plan[]);
    loadedAt.current = Date.now();
  }, [mode, spaceId]);

  const refreshPhotos = useCallback(async () => {
    if (mode !== 'supabase' || !spaceId) return;
    const client = requireSupabase();
    const { data } = await client
      .from('plan_photos')
      .select('*')
      .eq('space_id', spaceId)
      .order('created_at', { ascending: true });
    setPhotos(await signPlanPhotos((data ?? []) as PlanPhoto[]));
  }, [mode, spaceId, signPlanPhotos]);

  const refreshMembersAndSpace = useCallback(async () => {
    if (mode !== 'supabase' || !spaceId) return;
    const client = requireSupabase();
    const [{ data: spaceRow }, { data: memberRows }] = await Promise.all([
      client.from('spaces').select('*').eq('id', spaceId).single(),
      client
        .from('space_members')
        .select('user_id, space_id, notify_new_plan, remind_day_before, profile:profiles(*)')
        .eq('space_id', spaceId),
    ]);
    const normalized = ((memberRows ?? []) as unknown as Member[]).map((member) => ({
      ...member,
      profile: Array.isArray(member.profile) ? member.profile[0] : member.profile,
    }));
    const signed = await signSpaceMedia((spaceRow as Space) ?? null, normalized);
    setSpace(signed.space);
    setMembers(signed.members);
  }, [mode, spaceId, signSpaceMedia]);

  // Realtime
  useEffect(() => {
    if (mode !== 'supabase' || !spaceId) return;
    const client = requireSupabase();

    const channel = client
      .channel(`loveplans:${spaceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'plans', filter: `space_id=eq.${spaceId}` },
        (payload) => {
          void refreshPlans();
          const actorId =
            (payload.new as Plan | undefined)?.updated_by ??
            (payload.new as Plan | undefined)?.created_by ??
            (payload.old as Plan | undefined)?.created_by;
          if (!actorId || actorId === myIdRef.current) return;
          const actor = membersRef.current.find((member) => member.user_id === actorId)?.profile
            ?.display_name;
          if (!actor) return;
          const me = membersRef.current.find((member) => member.user_id === myIdRef.current);
          if (me && !me.notify_new_plan) return;
          const next = payload.new as Plan | undefined;
          const old = payload.old as Plan | undefined;
          if (payload.eventType === 'INSERT' && next) {
            showNotice(`${actor} añadió “${next.title}”`);
          } else if (payload.eventType === 'UPDATE' && next) {
            if (next.is_done && !old?.is_done) {
              showNotice(`${actor} marcó “${next.title}” como cumplido`, 'success');
            } else {
              showNotice(`${actor} editó “${next.title}”`);
            }
          } else if (payload.eventType === 'DELETE') {
            showNotice(`${actor} eliminó un plan`);
          }
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'plan_photos', filter: `space_id=eq.${spaceId}` },
        (payload) => {
          void refreshPhotos();
          if (payload.eventType !== 'INSERT') return;
          const actorId = (payload.new as PlanPhoto | undefined)?.created_by;
          if (!actorId || actorId === myIdRef.current) return;
          const me = membersRef.current.find((member) => member.user_id === myIdRef.current);
          if (me && !me.notify_new_plan) return;
          const actor = membersRef.current.find((member) => member.user_id === actorId)?.profile
            ?.display_name;
          if (actor) showNotice(`${actor} añadió una foto a un plan`);
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'spaces', filter: `id=eq.${spaceId}` },
        () => {
          void refreshMembersAndSpace();
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'space_members', filter: `space_id=eq.${spaceId}` },
        () => {
          void refreshMembersAndSpace();
        },
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
        const updated = payload.new as Profile | undefined;
        if (updated && membersRef.current.some((member) => member.user_id === updated.id)) {
          void refreshMembersAndSpace();
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          void refreshPlans();
          void refreshPhotos();
        }
      });

    return () => {
      void client.removeChannel(channel);
    };
  }, [
    mode,
    spaceId,
    refreshPlans,
    refreshPhotos,
    refreshMembersAndSpace,
    showNotice,
  ]);

  // Al volver a la app: refrescar y renovar URLs firmadas
  useEffect(() => {
    if (mode !== 'supabase' || status !== 'ready') return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      if (Date.now() - loadedAt.current < 1000 * 60 * 30) return;
      void refreshPlans();
      void refreshPhotos();
      void refreshMembersAndSpace();
    });
    return () => sub.remove();
  }, [mode, status, refreshPlans, refreshPhotos, refreshMembersAndSpace]);

  const sendCode = useCallback(async (email: string) => {
    const client = requireSupabase();
    const { error } = await client.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true, emailRedirectTo: publicAppUrl() },
    });
    if (error) throw new Error(errorMessage(error));
  }, []);

  const verifyCode = useCallback(async (email: string, code: string) => {
    const client = requireSupabase();
    const { error } = await client.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code.trim(),
      type: 'email',
    });
    if (error) throw new Error(errorMessage(error));
  }, []);

  const signOut = useCallback(async () => {
    if (mode === 'demo') {
      setMode('supabase');
      setStatus('signedOut');
      demoRef.current = null;
      bootedRef.current = null;
      setDemoMeId(null);
      resetSupabaseState();
      return;
    }
    const client = requireSupabase();
    await client.auth.signOut();
    bootedRef.current = null;
    resetSupabaseState();
  }, [mode, resetSupabaseState]);

  const enterDemo = useCallback(async () => {
    const db = await loadDemoDb();
    demoRef.current = db;
    bootedRef.current = null;
    setDemoMeId(db.meId);
    setMode('demo');
    setProfile(db.members.find((member) => member.user_id === db.meId)?.profile ?? null);
    setSpace(db.space);
    setMembers(db.members);
    setPlans(db.plans);
    setPhotos(db.photos);
    setInvitationCode(db.invitationCode);
    setStatus('ready');
    setPendingInvite(null);
  }, []);

  const exitDemo = useCallback(async () => {
    setMode('supabase');
    demoRef.current = null;
    bootedRef.current = null;
    setDemoMeId(null);
    resetSupabaseState();
  }, [resetSupabaseState]);

  const persistDemo = useCallback(async (next: DemoDB) => {
    demoRef.current = next;
    await saveDemoDb(next);
    setSpace(next.space);
    setMembers(next.members);
    setPlans(next.plans);
    setPhotos(next.photos);
    setInvitationCode(next.invitationCode);
  }, []);

  const previewInvite = useCallback(async (code: string): Promise<InvitePreview> => {
    if (mode === 'demo') {
      return { valid: code.toUpperCase() === 'DEMO24', space_title: 'Nuestro espacio', inviter_name: 'Sebas' };
    }
    const client = requireSupabase();
    const { data, error } = await client.rpc('preview_invitation', { p_code: code.trim().toUpperCase() });
    if (error) throw new Error(errorMessage(error));
    return (data ?? { valid: false, space_title: null, inviter_name: null }) as InvitePreview;
  }, [mode]);

  const createSpace = useCallback(
    async (title?: string) => {
      if (!session?.user) throw new Error('Inicia sesión para crear el espacio.');
      const client = requireSupabase();
      setBusy(true);
      try {
        const { error } = await client.rpc('create_space', {
          p_title: title?.trim() || 'Nuestro espacio',
        });
        if (error) throw new Error(errorMessage(error));
        await clearPendingInvite();
        await bootstrap(session.user);
      } finally {
        setBusy(false);
      }
    },
    [bootstrap, clearPendingInvite, session],
  );

  const acceptInvite = useCallback(
    async (code: string) => {
      if (!session?.user) throw new Error('Inicia sesión para aceptar la invitación.');
      const client = requireSupabase();
      setBusy(true);
      try {
        const { error } = await client.rpc('accept_invitation', { p_code: code.trim().toUpperCase() });
        if (error) throw new Error(errorMessage(error));
        await clearPendingInvite();
        await bootstrap(session.user);
      } finally {
        setBusy(false);
      }
    },
    [bootstrap, clearPendingInvite, session],
  );

  const leaveSpace = useCallback(async () => {
    if (mode === 'demo') {
      showNotice('En el modo demo no puedes salir del espacio.', 'info');
      return;
    }
    if (!myId) return;
    const client = requireSupabase();
    setBusy(true);
    try {
      const { error } = await client
        .from('space_members')
        .delete()
        .eq('user_id', myId);
      if (error) throw new Error(errorMessage(error));
      setSpace(null);
      setMembers([]);
      setPlans([]);
      setPhotos([]);
      setInvitationCode(null);
      setStatus('needsSpace');
    } finally {
      setBusy(false);
    }
  }, [mode, myId, showNotice]);

  const refreshInvite = useCallback(async (): Promise<string | null> => {
    if (!spaceId) return null;
    if (mode === 'demo') {
      const code = demoRef.current?.invitationCode ?? 'DEMO24';
      setInvitationCode(code);
      return code;
    }
    const client = requireSupabase();
    setBusy(true);
    try {
      const { data, error } = await client.rpc('ensure_invitation', { p_space: spaceId });
      if (error) throw new Error(errorMessage(error));
      const code = (data as string) ?? null;
      setInvitationCode(code);
      return code;
    } finally {
      setBusy(false);
    }
  }, [mode, spaceId]);

  const updatePrefs = useCallback(
    async (patch: Partial<Pick<Member, 'notify_new_plan' | 'remind_day_before'>>) => {
      if (!myId) return;
      if (mode === 'demo') {
        const db = demoRef.current;
        if (!db) return;
        await persistDemo({
          ...db,
          members: db.members.map((member) =>
            member.user_id === myId ? { ...member, ...patch } : member,
          ),
        });
        return;
      }
      const client = requireSupabase();
      const { error } = await client
        .from('space_members')
        .update(patch)
        .eq('user_id', myId)
        .eq('space_id', spaceId ?? '');
      if (error) throw new Error(errorMessage(error));
      setMembers((current) =>
        current.map((member) => (member.user_id === myId ? { ...member, ...patch } : member)),
      );
    },
    [mode, myId, persistDemo, spaceId],
  );

  const uploadPlanImages = useCallback(
    async (planId: string, images: PickedImage[]) => {
      if (!spaceId || !myId) return;
      const client = requireSupabase();
      for (const image of images) {
        const path = `${spaceId}/${planId}/${randomId()}.jpg`;
        const { error: uploadError } = await client.storage
          .from('plan-photos')
          .upload(path, base64ToBytes(image.base64), {
            contentType: 'image/jpeg',
            upsert: false,
          });
        if (uploadError) throw new Error(uploadError.message);
        const { error } = await client.from('plan_photos').insert({
          plan_id: planId,
          space_id: spaceId,
          storage_path: path,
          width: image.width,
          height: image.height,
          created_by: myId,
        });
        if (error) throw new Error(errorMessage(error));
      }
    },
    [myId, spaceId],
  );

  const savePlan = useCallback(
    async (input: PlanInput, images?: PickedImage[]): Promise<string | null> => {
      if (!spaceId || !myId) throw new Error('Primero crea tu espacio.');
      const title = input.title.trim();
      if (!title) throw new Error('Ponle un nombre a este plan.');

      if (mode === 'demo') {
        const db = demoRef.current;
        if (!db) return null;
        const now = new Date().toISOString();
        let planId = input.id ?? null;
        let nextPlans: Plan[];
        if (planId) {
          nextPlans = db.plans.map((plan) =>
            plan.id === planId
              ? {
                  ...plan,
                  title,
                  plan_date: input.plan_date,
                  place: input.place.trim() || null,
                  category: input.category,
                  notes: input.notes.trim() || null,
                  is_favorite: input.is_favorite,
                  updated_by: myId,
                  updated_at: now,
                }
              : plan,
          );
        } else {
          planId = `demo-${randomId()}`;
          nextPlans = [
            ...db.plans,
            {
              id: planId,
              space_id: db.space.id,
              title,
              plan_date: input.plan_date,
              place: input.place.trim() || null,
              category: input.category,
              notes: input.notes.trim() || null,
              is_favorite: input.is_favorite,
              is_done: false,
              done_at: null,
              created_by: myId,
              updated_by: null,
              created_at: now,
              updated_at: now,
            },
          ];
        }

        const nextPhotos = [...db.photos];
        if (images?.length && planId) {
          images.forEach((image) => {
            nextPhotos.push({
              id: `demo-${randomId()}`,
              plan_id: planId as string,
              space_id: db.space.id,
              storage_path: `demo://${randomId()}`,
              width: image.width,
              height: image.height,
              created_by: myId,
              created_at: now,
              url: toDataUrl(image.base64),
            });
          });
        }

        await persistDemo({ ...db, plans: nextPlans, photos: nextPhotos });
        return planId;
      }

      const client = requireSupabase();
      setBusy(true);
      try {
        let planId = input.id ?? null;
        if (planId) {
          const { error } = await client
            .from('plans')
            .update({
              title,
              plan_date: input.plan_date,
              place: input.place.trim() || null,
              category: input.category,
              notes: input.notes.trim() || null,
              is_favorite: input.is_favorite,
              updated_by: myId,
              updated_at: new Date().toISOString(),
            })
            .eq('id', planId);
          if (error) throw new Error(errorMessage(error));
        } else {
          const { data, error } = await client
            .from('plans')
            .insert({
              space_id: spaceId,
              title,
              plan_date: input.plan_date,
              place: input.place.trim() || null,
              category: input.category,
              notes: input.notes.trim() || null,
              is_favorite: input.is_favorite,
              created_by: myId,
            })
            .select('id')
            .single();
          if (error) throw new Error(errorMessage(error));
          planId = (data as { id: string }).id;
        }

        if (images?.length && planId) {
          await uploadPlanImages(planId, images);
        }

        await refreshPlans();
        await refreshPhotos();
        return planId;
      } finally {
        setBusy(false);
      }
    },
    [mode, myId, persistDemo, refreshPhotos, refreshPlans, spaceId, uploadPlanImages],
  );

  const addPhotos = useCallback(
    async (planId: string, images: PickedImage[]) => {
      if (!images.length) return;
      if (mode === 'demo') {
        const db = demoRef.current;
        if (!db) return;
        const now = new Date().toISOString();
        await persistDemo({
          ...db,
          photos: [
            ...db.photos,
            ...images.map((image) => ({
              id: `demo-${randomId()}`,
              plan_id: planId,
              space_id: db.space.id,
              storage_path: `demo://${randomId()}`,
              width: image.width,
              height: image.height,
              created_by: db.meId,
              created_at: now,
              url: toDataUrl(image.base64),
            })),
          ],
        });
        return;
      }
      setBusy(true);
      try {
        await uploadPlanImages(planId, images);
        await refreshPhotos();
      } finally {
        setBusy(false);
      }
    },
    [mode, persistDemo, refreshPhotos, uploadPlanImages],
  );

  const deletePlan = useCallback(
    async (id: string) => {
      if (mode === 'demo') {
        const db = demoRef.current;
        if (!db) return;
        await persistDemo({
          ...db,
          plans: db.plans.filter((plan) => plan.id !== id),
          photos: db.photos.filter((photo) => photo.plan_id !== id),
        });
        return;
      }
      const client = requireSupabase();
      setBusy(true);
      try {
        const paths = photos.filter((photo) => photo.plan_id === id).map((photo) => photo.storage_path);
        if (paths.length) await client.storage.from('plan-photos').remove(paths);
        const { error } = await client.from('plans').delete().eq('id', id);
        if (error) throw new Error(errorMessage(error));
        await refreshPlans();
        await refreshPhotos();
      } finally {
        setBusy(false);
      }
    },
    [mode, persistDemo, photos, refreshPhotos, refreshPlans],
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      const plan = plans.find((item) => item.id === id);
      if (!plan) return;
      if (mode === 'demo') {
        const db = demoRef.current;
        if (!db) return;
        await persistDemo({
          ...db,
          plans: db.plans.map((item) =>
            item.id === id ? { ...item, is_favorite: !item.is_favorite } : item,
          ),
        });
        return;
      }
      const client = requireSupabase();
      const { error } = await client
        .from('plans')
        .update({ is_favorite: !plan.is_favorite, updated_by: myId })
        .eq('id', id);
      if (error) throw new Error(errorMessage(error));
      setPlans((current) =>
        current.map((item) => (item.id === id ? { ...item, is_favorite: !item.is_favorite } : item)),
      );
    },
    [mode, myId, persistDemo, plans],
  );

  const toggleDone = useCallback(
    async (id: string) => {
      const plan = plans.find((item) => item.id === id);
      if (!plan) return;
      const done = !plan.is_done;
      if (mode === 'demo') {
        const db = demoRef.current;
        if (!db) return;
        await persistDemo({
          ...db,
          plans: db.plans.map((item) =>
            item.id === id
              ? { ...item, is_done: done, done_at: done ? new Date().toISOString() : null }
              : item,
          ),
        });
        return;
      }
      const client = requireSupabase();
      const { error } = await client
        .from('plans')
        .update({ is_done: done, done_at: done ? new Date().toISOString() : null, updated_by: myId })
        .eq('id', id);
      if (error) throw new Error(errorMessage(error));
      setPlans((current) =>
        current.map((item) =>
          item.id === id
            ? { ...item, is_done: done, done_at: done ? new Date().toISOString() : null }
            : item,
        ),
      );
    },
    [mode, myId, persistDemo, plans],
  );

  const deletePhoto = useCallback(
    async (photo: PlanPhoto) => {
      if (mode === 'demo') {
        const db = demoRef.current;
        if (!db) return;
        await persistDemo({
          ...db,
          photos: db.photos.filter((item) => item.id !== photo.id),
        });
        return;
      }
      const client = requireSupabase();
      if (photo.storage_path) await client.storage.from('plan-photos').remove([photo.storage_path]);
      const { error } = await client.from('plan_photos').delete().eq('id', photo.id);
      if (error) throw new Error(errorMessage(error));
      setPhotos((current) => current.filter((item) => item.id !== photo.id));
    },
    [mode, persistDemo],
  );

  const setCouplePhoto = useCallback(
    async (image: PickedImage) => {
      if (!spaceId) return;
      if (mode === 'demo') {
        const db = demoRef.current;
        if (!db) return;
        await persistDemo({
          ...db,
          space: { ...db.space, couple_photo_url: toDataUrl(image.base64) },
        });
        return;
      }
      const client = requireSupabase();
      setBusy(true);
      try {
        const path = `${spaceId}/couple.jpg`;
        const { error: uploadError } = await client.storage
          .from('space-media')
          .upload(path, base64ToBytes(image.base64), { contentType: 'image/jpeg', upsert: true });
        if (uploadError) throw new Error(uploadError.message);
        const { error } = await client
          .from('spaces')
          .update({ couple_photo_path: path })
          .eq('id', spaceId);
        if (error) throw new Error(errorMessage(error));
        await refreshMembersAndSpace();
      } finally {
        setBusy(false);
      }
    },
    [mode, persistDemo, refreshMembersAndSpace, spaceId],
  );

  const setMemberPhoto = useCallback(
    async (userId: string, image: PickedImage) => {
      if (!spaceId) return;
      if (mode === 'demo') {
        const db = demoRef.current;
        if (!db) return;
        await persistDemo({
          ...db,
          members: db.members.map((member) =>
            member.user_id === userId
              ? { ...member, profile: { ...member.profile, avatar_url: toDataUrl(image.base64) } }
              : member,
          ),
        });
        return;
      }
      const client = requireSupabase();
      setBusy(true);
      try {
        const path = `${spaceId}/members/${userId}.jpg`;
        const { error: uploadError } = await client.storage
          .from('space-media')
          .upload(path, base64ToBytes(image.base64), { contentType: 'image/jpeg', upsert: true });
        if (uploadError) throw new Error(uploadError.message);
        const { error } = await client.rpc('set_member_avatar', { p_user: userId, p_path: path });
        if (error) throw new Error(errorMessage(error));
        await refreshMembersAndSpace();
      } finally {
        setBusy(false);
      }
    },
    [mode, persistDemo, refreshMembersAndSpace, spaceId],
  );

  const updateSpace = useCallback(
    async (patch: Partial<Pick<Space, 'title' | 'anniversary'>>) => {
      if (!spaceId) return;
      if (mode === 'demo') {
        const db = demoRef.current;
        if (!db) return;
        await persistDemo({ ...db, space: { ...db.space, ...patch } });
        return;
      }
      const client = requireSupabase();
      const { error } = await client.from('spaces').update(patch).eq('id', spaceId);
      if (error) throw new Error(errorMessage(error));
      setSpace((current) => (current ? { ...current, ...patch } : current));
    },
    [mode, persistDemo, spaceId],
  );

  const updateMe = useCallback(
    async (name: string) => {
      if (!profileId) return;
      const clean = name.trim();
      if (!clean) throw new Error('Escribe tu nombre.');
      if (mode === 'demo') {
        const db = demoRef.current;
        if (!db) return;
        await persistDemo({
          ...db,
          members: db.members.map((member) =>
            member.user_id === db.meId
              ? { ...member, profile: { ...member.profile, display_name: clean } }
              : member,
          ),
        });
        setProfile((current) => (current ? { ...current, display_name: clean } : current));
        return;
      }
      const client = requireSupabase();
      const { error } = await client.from('profiles').update({ display_name: clean }).eq('id', profileId);
      if (error) throw new Error(errorMessage(error));
      setProfile((current) => (current ? { ...current, display_name: clean } : current));
      setMembers((current) =>
        current.map((member) =>
          member.user_id === profileId
            ? { ...member, profile: { ...member.profile, display_name: clean } }
            : member,
        ),
      );
    },
    [mode, persistDemo, profileId],
  );

  const refresh = useCallback(async () => {
    if (mode === 'demo') return;
    if (session?.user) await bootstrap(session.user);
  }, [bootstrap, mode, session]);

  const value = useMemo<AppContextValue>(
    () => ({
      configured: isSupabaseConfigured,
      mode,
      status,
      session,
      profile,
      myId,
      space,
      members,
      partner,
      plans,
      photos,
      invitationCode,
      pendingInvite,
      busy,
      notice,
      noticeTone,
      showNotice,
      dismissNotice,
      sendCode,
      verifyCode,
      signOut,
      enterDemo,
      exitDemo,
      rememberInvite,
      clearPendingInvite,
      previewInvite,
      createSpace,
      acceptInvite,
      leaveSpace,
      refreshInvite,
      updatePrefs,
      savePlan,
      deletePlan,
      toggleFavorite,
      toggleDone,
      addPhotos,
      deletePhoto,
      setCouplePhoto,
      setMemberPhoto,
      updateSpace,
      updateMe,
      refresh,
    }),
    [
      mode,
      status,
      session,
      profile,
      myId,
      space,
      members,
      partner,
      plans,
      photos,
      invitationCode,
      pendingInvite,
      busy,
      notice,
      noticeTone,
      showNotice,
      dismissNotice,
      sendCode,
      verifyCode,
      signOut,
      enterDemo,
      exitDemo,
      rememberInvite,
      clearPendingInvite,
      previewInvite,
      createSpace,
      acceptInvite,
      leaveSpace,
      refreshInvite,
      updatePrefs,
      savePlan,
      deletePlan,
      toggleFavorite,
      toggleDone,
      addPhotos,
      deletePhoto,
      setCouplePhoto,
      setMemberPhoto,
      updateSpace,
      updateMe,
      refresh,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp debe usarse dentro de AppProvider');
  return context;
}

export function usePlanPhotos(planId: string | null): PlanPhoto[] {
  const { photos } = useApp();
  return useMemo(
    () => (planId ? photos.filter((photo) => photo.plan_id === planId) : []),
    [photos, planId],
  );
}
