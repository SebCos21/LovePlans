/* Mantiene despierto el proyecto gratuito de Supabase.
   Vercel lo ejecuta una vez al día (plan Hobby) y no depende de tu PC. */
export const config = { runtime: 'edge' };

export default async function handler() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return new Response('Faltan EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY', {
      status: 500,
    });
  }

  const response = await fetch(`${url.replace(/\/$/, '')}/rest/v1/rpc/ping`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  });

  const text = await response.text();
  return new Response(`Supabase: ${response.status} ${text}`, { status: response.status });
}
