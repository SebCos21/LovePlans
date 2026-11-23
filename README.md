# LovePlans

App de planes para una pareja. Hoy es una **PWA instalable** (se abre en el navegador y se añade a la pantalla de inicio en iPhone y Android, sin tiendas) construida con **Expo + React Native Web** y **Supabase**.

- **Frontend:** Expo SDK 58, Expo Router, TypeScript, React Native Web.
- **Backend:** Supabase (Postgres, Auth con correo + contraseña, Storage privado, Realtime).
- **Hosting:** Vercel (plan gratis) + Supabase (plan gratis).
- **Instalación:** manual en iPhone (Compartir → Añadir a pantalla de inicio) y con botón en Android/Chrome.
- **Sin pagos, sin tiendas, sin dominio propio.**

El prototipo original está en `docs/prototipo/` como referencia.

---

## 1. Arrancar en local

```powershell
npm install
npm run web
```

Abre `http://localhost:8081`.

Si todavía no conectaste Supabase, la app abre la bienvenida y te ofrece **Probar la demo** con datos de ejemplo (Sofi y Sebas). También puedes entrar al demo tocando el puntito discreto abajo en la pantalla de bienvenida, o manteniendo pulsado el logo 1,2 s.

> El modo demo guarda todo en el navegador (localStorage). No usa la nube y no sincroniza entre teléfonos.

Comandos útiles:

```powershell
npm run web         # desarrollo web
npm run typecheck   # TypeScript
npm run lint        # ESLint
npm run build:web   # build de producción + service worker en dist/
npm run smoke       # prueba de humo en Chrome (con npm run web corriendo)
npm run icons       # regenera iconos desde LogoLovePlans.jpg
```

---

## 2. Crear el proyecto de Supabase

1. Entra a <https://supabase.com> y crea un proyecto nuevo.
   - Región recomendada para Colombia: **us-east-1**.
   - Guarda la contraseña de la base de datos.
2. Abre **SQL Editor → New query**, pega todo el contenido de
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) y ejecuta.
3. Ve a **Project Settings → API** y copia:
   - `Project URL`
   - `anon public key`
4. Crea un archivo `.env` en la raíz (puedes partir de `.env.example`), o ejecuta el asistente:

```powershell
powershell -ExecutionPolicy Bypass -File tools/setup-env.ps1
```

También puedes escribirlo a mano:

```env
EXPO_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=TU-ANON-KEY
EXPO_PUBLIC_APP_URL=http://localhost:8081
```

5. Reinicia `npm run web`. La pantalla de bienvenida ya debe mostrar **Entrar / Crear cuenta**.

> La `anon key` es pública; la seguridad real está en las políticas RLS del SQL. **Nunca** pongas la `service_role` en el frontend.

---

## 3. Login con correo y contraseña

La app usa **correo + contraseña**. No depende de códigos de 6 dígitos ni de editar plantillas de correo, y funciona dentro de la app instalada en iPhone y Android.

> Se cambió el OTP por contraseña porque el plan gratis no permite editar las plantillas: el correo por defecto solo trae un enlace, y en iPhone instalado ese enlace abre Safari y no comparte la sesión con la app.

### 3.1 Confirmación de correo

En Supabase: **Authentication → Providers → Email**.

- Si puedes, desactiva **Confirm email**. Así el registro entra directo y no se envía ningún correo.
- Si no te deja desactivarlo, déjalo activo. Supabase enviará su correo por defecto (con un enlace) **una sola vez**. El usuario abre el enlace, confirma la cuenta y después entra con su contraseña.

No hay que editar ninguna plantilla.

### 3.2 SMTP propio (para confirmación y recuperación)

El SMTP integrado de Supabase solo envía a correos del equipo del proyecto y tiene límites muy bajos. Para que la confirmación y la recuperación de contraseña lleguen a correos externos, configura un SMTP gratis:

**Brevo (recomendado, 300 correos/día gratis)**

1. Crea cuenta en <https://www.brevo.com>.
2. Verifica tu correo remitente (o tu dominio si algún día tienes uno).
3. En Brevo: **SMTP & API → SMTP** y copia host, puerto, usuario y clave.
4. En Supabase: **Authentication → Settings → SMTP Settings → Enable custom SMTP**:
   - Host: `smtp-relay.brevo.com`
   - Port: `587`
   - Username / Password: los de Brevo
   - Sender email: el correo verificado
   - Sender name: `LovePlans`
5. En **Authentication → Rate Limits**, sube el límite de emails si hace falta.

> Si no configuras SMTP y no puedes desactivar la confirmación, los correos de confirmación no llegarán a correos externos.

### 3.3 URLs de autenticación

En **Authentication → URL Configuration**:

- **Site URL:**
  - Para probar en local: `http://localhost:8081`
  - En producción: `https://TU-APP.vercel.app`
- **Redirect URLs:**
  - `http://localhost:8081/**`
  - `https://TU-APP.vercel.app/**`

Estas URLs se usan para la confirmación de la cuenta y para el enlace de “¿Olvidaste tu contraseña?”.

> La recuperación de contraseña redirige a `/reset-password`. En iPhone instalado, el enlace abre Safari: ahí se cambia la contraseña y luego se entra a la app instalada con la nueva contraseña.

No necesitas Google ni Apple para este flujo.

---

## 4. Desplegar en Vercel (sin depender de tu PC)

1. Sube el repo a GitHub (ya está `SebCos21/LovePlans`).
2. En <https://vercel.com> → **Add New Project** → importa el repo.
3. Configura:
   - **Framework preset:** Other
   - **Install command:** `npm ci --include=dev`
   - **Build command:** `npm run build:web`
   - **Output directory:** `dist`
4. Variables de entorno (Production y Preview):
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` (la publishable key)
   - `EXPO_PUBLIC_APP_URL=https://TU-APP.vercel.app` (opcional en el primer deploy; si falta, la app usa el dominio actual)
5. Deploy.
6. Prueba `https://TU-APP.vercel.app/api/keepalive`: debe responder `Supabase: 200 ok`.
7. Vuelve a Supabase → **URL Configuration** y actualiza **Site URL** y **Redirect URLs** con la URL real de Vercel.
8. Abre la app en el teléfono, inicia sesión con tu correo y contraseña, y añádela a la pantalla de inicio.

Cada `git push` a `main` despliega automáticamente.

> No compres dominio por ahora. Cuando lo compres, hazlo **antes de compartir la app**, porque cambiar de dominio obliga a reinstalar la PWA.

### Mantener Supabase despierto

El plan gratuito **pausa el proyecto tras 7 días sin actividad**.

La solución principal ya está incluida: un **cron de Vercel** (`api/keepalive.ts`) que llama a `ping()` todos los días a las 9:00 UTC. No depende de tu computador.

Si además quieres la tarea local que pediste (por si Vercel falla o para desarrollo):

```powershell
# Prueba manual
powershell -ExecutionPolicy Bypass -File tools/keepalive.ps1

# Registrar tarea cada 3 días a las 9:00
powershell -ExecutionPolicy Bypass -File tools/register-keepalive-task.ps1
```

El script lee `.env`, hace `POST /rest/v1/rpc/ping` y escribe `tools/keepalive.log`.

> Si el portátil está apagado más de 7 días y el cron de Vercel no está activo, Supabase se pausa. Se puede reanudar desde el dashboard sin perder datos (hasta 1 año).

### Copias de seguridad

El plan gratis **no incluye backups automáticos**. El workflow
[`.github/workflows/backup.yml`](.github/workflows/backup.yml) hace un `pg_dump` semanal.

1. En Supabase: **Connect → Session pooler** y copia la cadena de conexión.
2. En GitHub: **Settings → Secrets and variables → Actions → New repository secret**
   - `SUPABASE_DB_URL` = la cadena anterior.
3. Ejecuta el workflow manualmente la primera vez para comprobar que funciona.

Los backups quedan como artifacts del repo por 90 días.

---

## 5. Instalar la PWA

### Android (Chrome)
1. Abre la URL de Vercel.
2. Aparece el aviso “Instalar” o usa el menú ⋮ → **Instalar aplicación**.
3. Se abre como app, con su propio icono.

### iPhone (Safari)
1. Abre la URL **en Safari** (no dentro de WhatsApp/Instagram).
2. Toca **Compartir** (cuadrado con flecha).
3. **Añadir a pantalla de inicio** → Añadir.
4. En iOS 26 el interruptor “Abrir como app web” viene activado.

> En iPhone, la app instalada tiene su propio almacenamiento. Inicia sesión **dentro de la app instalada** con tu correo y contraseña. No depende de Safari.

La app incluye una tarjeta de instalación en Inicio y detecta si el link se abrió dentro del navegador de WhatsApp para pedirte que lo abras en Safari/Chrome.

> Cuando tengas la URL final de Vercel, cambia `og:image` en `public/index.html` a esa URL absoluta (`https://.../icons/og-1200x630.png`) para que WhatsApp muestre la vista previa del enlace de invitación.

---

## 6. Qué incluye

- Login con correo + contraseña.
- Crear espacio de pareja (máximo 2 personas).
- Invitación por link `https://tu-app.vercel.app/i/CODIGO` y compartir por WhatsApp.
- Planes: crear, editar, eliminar, favoritos, categorías, fecha, lugar, notas.
- Calendario mensual con puntos por plan.
- Fotos por plan en Supabase Storage privado (URLs firmadas).
- Recuerdos: álbum de planes cumplidos.
- Foto de pareja y fotos individuales.
- “Juntos desde” y días juntos.
- Sincronización en tiempo real + avisos cuando tu pareja cambia algo.
- Modo demo local con datos de ejemplo.
- PWA: manifest, iconos, service worker, pantalla de instalación y aviso de nueva versión.

---

## 7. Condiciones y límites (importante)

| Tema | Condición |
|---|---|
| HTTPS | Obligatorio para instalar y para cámara/portapapeles. Vercel lo da. |
| iOS instalar | Manual desde Compartir. No hay botón de instalación. |
| iOS notificaciones push | Solo app instalada, iOS 16.4+, permiso con toque. **No está en v1** (se muestra como “Pronto”). |
| iOS almacenamiento | El sistema puede borrar datos locales si no se usa. La fuente de verdad es Supabase. |
| iOS login | Inicia sesión dentro de la app instalada con correo y contraseña; no depende de Safari. |
| Navegador interno | WhatsApp/Instagram no permiten instalar. Abrir en Safari/Chrome. |
| Supabase gratis | 500 MB DB, 1 GB storage (~2.500 fotos comprimidas), 5 GB egress, 50.000 MAU, 200 conexiones realtime, 2 proyectos. |
| Pausa | 7 días sin actividad. Mitigado con cron de Vercel + tarea local opcional. |
| Backups | No incluidos en gratis. Workflow semanal incluido. |
| Emails | Solo para confirmación y recuperación de contraseña. Si no desactivas la confirmación, usa SMTP propio (Brevo/Resend). |
| Plantillas de correo | El plan gratis no permite editarlas; la app no las necesita. |
| Vercel Hobby | Uso no comercial, 100 GB de banda/mes. Suficiente para dos personas. |
| Dominio | `*.vercel.app` gratis. Cambiarlo después obliga a reinstalar la PWA. |
| Logo | Hello Kitty es propiedad de Sanrio. Este proyecto es de uso personal. Para algo público, usar el gatito vectorial del prototipo o un logo propio. |
| App Store / Play Store | No se usan. Si algún día quieres publicar, necesitarás Apple Developer (US$99/año) y Play Console (US$25 único). |
| Cámara en web | El navegador pide permiso y solo funciona en HTTPS/localhost. |

---

## 8. Estructura del proyecto

```
src/
  app/                  rutas (Expo Router)
    (tabs)/             Inicio, Planes, Calendario, Recuerdos, Nosotros
    plan/[id]/          detalle y álbum
    nuevo.tsx           editor de plan
    welcome / reset      login y recuperación
    i/[code].tsx        link de invitación
  components/           UI, calendario, tab bar, visor de fotos
  lib/                  Supabase, fechas, tema, imágenes, demo, storage
  providers/            sesión, espacio, planes, realtime, acciones
public/                 manifest, iconos, HTML de la PWA
supabase/migrations/    SQL del backend
tools/                  iconos y keepalive
api/keepalive.ts        cron diario de Vercel
```

---

## 9. Problemas comunes

**No llega el correo de confirmación**
- Si puedes, desactiva **Confirm email** en Authentication → Providers → Email; el registro entra directo.
- Si lo dejas activo, configura SMTP propio (Brevo/Resend). El SMTP por defecto de Supabase no sirve para usuarios externos.
- Revisa spam y **Authentication → Logs**.

**“Correo o contraseña incorrectos”**
- Revisa mayúsculas y espacios.
- Si la cuenta es nueva, puede faltar confirmar el correo: revisa el enlace de confirmación.
- Usa “¿Olvidaste tu contraseña?” para crear una nueva.

**“Confirma tu correo”**
- Abre el enlace del correo de confirmación una vez.
- Después vuelve a la app y entra con tu correo y contraseña.

**No llega el enlace de recuperación**
- Confirma que **Site URL** y **Redirect URLs** en Supabase incluyan `http://localhost:8081/**` y la URL de Vercel.
- En iPhone, el enlace abre Safari; cambia la contraseña ahí y luego entra a la app instalada.

**El enlace de recuperación expiró**
- Pide otro desde “¿Olvidaste tu contraseña?”. Los enlaces vencen y son de un solo uso.

**El link de invitación no abre**
- Confirma que `EXPO_PUBLIC_APP_URL` y **Site URL** en Supabase coinciden con la URL de Vercel.
- Prueba abrirlo en Safari/Chrome, no dentro de WhatsApp.

**Supabase pausado**
- Dashboard → proyecto → **Resume project**. No se pierden datos (hasta 1 año).
- Revisa que el cron de Vercel esté en **Deployments → Cron Jobs**.

**Fotos que no cargan**
- Las URLs firmadas vencen a las 24 h. Cierra y abre la app, o baja y sube; se renuevan.
- Revisa las políticas del bucket en **Storage → Policies**.

**Cambios que no aparecen en el otro teléfono**
- Realtime debe estar activo en **Database → Replication** para `plans`, `plan_photos`, `spaces`, `space_members` y `profiles`.

---

## 10. Más adelante (opcional)

- Notificaciones push web (VAPID + Edge Function + `push_subscriptions`).
- Recordatorio “un día antes” con `pg_cron`.
- Exportar todos los datos (JSON + fotos).
- App nativa con EAS Build (mismo código) si algún día quieres tiendas.
