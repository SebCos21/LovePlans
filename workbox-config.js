// Genera el service worker de la PWA después de `expo export -p web`.
// Solo precachea el shell de la app. Los datos y las fotos NO se cachean:
// la fuente de verdad siempre es Supabase.
module.exports = {
  globDirectory: 'dist',
  globPatterns: ['**/*.{html,js,css,ico,png,svg,woff,woff2,ttf,json}'],
  globIgnores: ['**/sw.js'],
  swDest: 'dist/sw.js',
  navigateFallback: '/index.html',
  navigateFallbackDenylist: [/^\/_expo\//, /\/sw\.js$/],
  cleanupOutdatedCaches: true,
  clientsClaim: true,
  skipWaiting: true,
  maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
};
