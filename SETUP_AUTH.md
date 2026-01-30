# Configuración de Autenticación con Supabase

Este proyecto utiliza Supabase Auth para la autenticación de usuarios.

## Variables de Entorno Requeridas

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Cómo obtener las credenciales:

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **Settings** > **API**
3. Copia los valores:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Configuración en Supabase

### Deshabilitar Registro Público

Como esta es una herramienta interna, debes deshabilitar el registro público:

1. Ve a **Authentication** > **Providers** > **Email**
2. Desactiva **"Enable email confirmations"** si deseas acceso inmediato
3. (Opcional) En **Settings** > **Authentication**, desactiva **"Enable Sign Up"** para usuarios externos

### Crear Usuarios Manualmente

Los usuarios se crean desde el dashboard de Supabase:

1. Ve a **Authentication** > **Users**
2. Click en **"Add user"** > **"Create new user"**
3. Ingresa email y contraseña
4. El usuario podrá iniciar sesión inmediatamente

## Estructura de Archivos

- `lib/supabase/client.ts` - Cliente de Supabase para Client Components
- `lib/supabase/server.ts` - Cliente de Supabase para Server Components
- `lib/supabase/middleware.ts` - Lógica de actualización de sesión para middleware
- `middleware.ts` - Middleware de Next.js que protege rutas
- `app/login/page.tsx` - Página de login
- `app/dashboard/page.tsx` - Página protegida (requiere autenticación)
- `components/LogoutButton.tsx` - Componente para cerrar sesión

## Rutas Protegidas

- `/dashboard` - Requiere autenticación (redirige a `/login` si no está autenticado)
- `/login` - Si ya estás autenticado, redirige a `/dashboard`

## Seguridad

- Los errores de autenticación no revelan información específica
- Las credenciales se validan de forma segura con Supabase
- Las sesiones se gestionan automáticamente mediante cookies HTTP-only
- El middleware protege las rutas antes de que se cargue el componente

