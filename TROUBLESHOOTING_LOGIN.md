# Solución de Problemas: Login en Producción

## Problema
El login funciona en local pero no en producción (Vercel).

## Causas Comunes

### 1. Variables de Entorno No Configuradas en Vercel

**Verificación:**
1. Ve a tu proyecto en Vercel: https://vercel.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Settings** > **Environment Variables**
4. Verifica que existan estas variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Solución:**
1. Copia los valores de tu archivo `.env.local` (local)
2. En Vercel, agrega cada variable:
   - **Key**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: Tu URL de Supabase (ej: `https://xxxxx.supabase.co`)
   - **Environment**: Production, Preview, Development (selecciona todos)
3. Repite para `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Importante**: Después de agregar/editar variables, debes hacer un **redeploy**

### 2. Configuración de Redirect URLs en Supabase ⚠️ **MÁS COMÚN**

**Verificación:**
1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. Ve a **Authentication** > **URL Configuration**
3. Verifica que tu dominio de Vercel esté en **Redirect URLs**

**Solución - Pasos específicos:**

1. **Site URL** (debe ser tu dominio de producción):
   ```
   https://anthana.agency
   ```

2. **Redirect URLs** (agrega TODAS estas líneas, una por una):

   **Producción:**
   ```
   https://anthana.agency/**
   https://anthana.agency
   https://anthana.agency/
   https://anthana.agency/dashboard
   https://anthana.agency/dashboard/
   https://anthana.agency/login
   https://anthana.agency/login/
   ```

   **Desarrollo Local:**
   ```
   http://localhost:3000/**
   http://localhost:3000
   http://localhost:3000/
   http://localhost:3000/dashboard
   http://localhost:3000/dashboard/
   http://localhost:3000/login
   http://localhost:3000/login/
   ```

   **Preview/Staging (si tienes en Vercel):**
   ```
   https://*.vercel.app/**
   https://*.vercel.app/dashboard
   https://*.vercel.app/login
   ```

3. **Importante**: Después de guardar, espera unos segundos y vuelve a intentar el login en producción.

> 📝 Ver archivo `SUPABASE_URLS_CONFIG.md` para una lista completa de URLs.

### 3. Verificar Variables en la Consola del Navegador

Después de desplegar con los cambios, abre la consola del navegador (F12) en producción y verifica:

1. Ve a la página de login
2. Abre la consola (F12 > Console)
3. Intenta hacer login
4. Revisa los logs:
   - Debe mostrar `Login attempt:` con `hasSupabaseUrl: true` y `hasSupabaseKey: true`
   - Si muestra `false`, las variables no están configuradas en Vercel

### 4. Limpiar Cookies y Cache

Si las variables están configuradas pero sigue fallando:

1. En el navegador, abre DevTools (F12)
2. Ve a **Application** > **Cookies**
3. Elimina todas las cookies del dominio de Vercel
4. Recarga la página (Ctrl+Shift+R o Cmd+Shift+R)

### 5. Verificar el Error Real

Con los cambios recientes, ahora puedes ver el error real en la consola:

1. Abre la consola del navegador (F12)
2. Intenta hacer login
3. Revisa el error en la consola:
   - `Login error:` mostrará el mensaje, status y nombre del error
   - Esto te ayudará a identificar el problema específico

## Pasos para Configurar Correctamente en Vercel

### Paso 1: Obtener las Variables de Supabase

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Settings** > **API**
4. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Paso 2: Configurar en Vercel

1. Ve a https://vercel.com/dashboard
2. Selecciona tu proyecto
3. **Settings** > **Environment Variables**
4. Para cada variable:
   - Click en **Add New**
   - **Key**: `NEXT_PUBLIC_SUPABASE_URL` (o `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - **Value**: Pega el valor correspondiente
   - **Environment**: Marca todas las opciones (Production, Preview, Development)
   - Click en **Save**
5. Ve a **Deployments**
6. En el último deployment, click en los **3 puntos** > **Redeploy**
7. Marca **Use existing Build Cache** y click en **Redeploy**

### Paso 3: Verificar

1. Espera a que termine el deployment
2. Visita tu sitio en producción
3. Intenta hacer login
4. Si falla, abre la consola (F12) y revisa los logs de error

## Debugging Adicional

Si después de seguir estos pasos sigue fallando:

1. **Verifica que las variables sean públicas:**
   - Deben empezar con `NEXT_PUBLIC_` para estar disponibles en el cliente

2. **Verifica la URL de Supabase:**
   - Debe ser algo como: `https://xxxxx.supabase.co`
   - NO debe terminar con `/` al final

3. **Verifica que el usuario exista en Supabase:**
   - Ve a **Authentication** > **Users** en Supabase
   - Confirma que el usuario existe y está activo

4. **Revisa los logs de Supabase:**
   - En Supabase Dashboard > **Logs** > **Auth Logs**
   - Busca intentos de login fallidos para ver el error exacto

