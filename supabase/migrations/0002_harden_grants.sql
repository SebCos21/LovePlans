-- LovePlans · endurecer permisos de funciones
-- Ejecuta este script DESPUÉS de 0001_init.sql.
-- Supabase concede EXECUTE a `anon` por defecto en funciones nuevas;
-- este script lo quita y deja las RPC solo para usuarios autenticados.

revoke all on function public.create_space(text) from public, anon;
revoke all on function public.ensure_invitation(uuid) from public, anon;
revoke all on function public.preview_invitation(text) from public, anon;
revoke all on function public.accept_invitation(text) from public, anon;
revoke all on function public.set_member_avatar(uuid, text) from public, anon;

revoke all on function public.is_space_member(uuid) from public, anon;
revoke all on function public.shares_space_with(uuid) from public, anon;
revoke all on function public.storage_space_id(text) from public, anon;

grant execute on function public.create_space(text) to authenticated;
grant execute on function public.ensure_invitation(uuid) to authenticated;
grant execute on function public.preview_invitation(text) to authenticated;
grant execute on function public.accept_invitation(text) to authenticated;
grant execute on function public.set_member_avatar(uuid, text) to authenticated;

grant execute on function public.is_space_member(uuid) to authenticated;
grant execute on function public.shares_space_with(uuid) to authenticated;
grant execute on function public.storage_space_id(text) to authenticated;

-- El keepalive de Vercel usa la publishable key sin sesión.
grant execute on function public.ping() to anon, authenticated;
