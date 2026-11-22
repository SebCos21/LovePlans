import type { CategoryKey } from './theme';

export type Profile = {
  id: string;
  display_name: string;
  avatar_path: string | null;
  avatar_url?: string | null;
};

export type Space = {
  id: string;
  title: string;
  anniversary: string | null;
  couple_photo_path: string | null;
  couple_photo_url?: string | null;
  created_at?: string;
};

export type Member = {
  user_id: string;
  space_id: string;
  notify_new_plan: boolean;
  remind_day_before: boolean;
  profile: Profile;
};

export type Plan = {
  id: string;
  space_id: string;
  title: string;
  plan_date: string | null;
  place: string | null;
  category: CategoryKey;
  notes: string | null;
  is_favorite: boolean;
  is_done: boolean;
  done_at: string | null;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type PlanPhoto = {
  id: string;
  plan_id: string;
  space_id: string;
  storage_path: string;
  width: number | null;
  height: number | null;
  created_by: string;
  created_at: string;
  url?: string | null;
};

export type PlanInput = {
  id?: string;
  title: string;
  plan_date: string | null;
  place: string;
  category: CategoryKey;
  notes: string;
  is_favorite: boolean;
};

export type PickedImage = {
  uri: string;
  base64: string;
  width: number;
  height: number;
};

export type InvitePreview = {
  valid: boolean;
  space_title: string | null;
  inviter_name: string | null;
};
