# Solución: Error "Invalid API key (401)"

## Problema
El error `Invalid API key (401)` significa que la API key de Supabase configurada en Vercel es incorrecta, está mal copiada, o no es la key correcta.

## Solución Paso a Paso

### Paso 1: Obtener la API Key Correcta desde Supabase

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Settings** (⚙️ en el menú lateral)
4. Click en **API**
5. En la sección **Project API keys**, busca:
   - **`anon` `public`** ← **ESTA ES LA QUE NECESITAS**
   - **NO uses** `service_role` (esa es privada y no debe estar en el cliente)

6. Click en el icono de **copiar** (📋) al lado de la key `anon public`
7. **IMPORTANTE**: Copia la key completa sin espacios al inicio o final

### Paso 2: Verificar el Formato de la Key

La key debería verse así:
- Empieza con `eyJ` (base64)
- Es muy larga (alrededor de 100-200 caracteres)
- NO tiene espacios ni saltos de línea
- NO termina con `=` (a menos que sea parte de la key)

Ejemplo de formato correcto:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

### Paso 3: Actualizar en Vercel

1. Ve a https://vercel.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Settings** → **Environment Variables**
4. Busca `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click en los **3 puntos** (⋯) → **Edit**
6. **Borra todo el contenido actual** del campo Value
7. Pega la key nueva (que copiaste de Supabase)
8. **Verifica que NO tenga espacios al inicio o final**
9. **Verifica que esté en un solo renglón** (sin saltos de línea)
10. Click en **Save**
11. Marca todas las opciones: **Production**, **Preview**, **Development**
12. Click en **Save** de nuevo

### Paso 4: Verificar la URL de Supabase

También verifica que `NEXT_PUBLIC_SUPABASE_URL` esté correcta:

1. En Supabase Dashboard → **Settings** → **API**
2. Copia **Project URL** (debe ser algo como `https://xxxxx.supabase.co`)
3. **NO debe terminar con `/`** al final
4. En Vercel, verifica que `NEXT_PUBLIC_SUPABASE_URL` tenga exactamente ese valor (sin `/` al final)

### Paso 5: Redesplegar

Después de actualizar las variables:

1. En Vercel, ve a **Deployments**
2. En el último deployment, click en los **3 puntos** (⋯)
3. Click en **Redeploy**
4. Marca **Use existing Build Cache** (opcional, pero más rápido)
5. Click en **Redeploy**
6. Espera a que termine el deployment

### Paso 6: Verificar

1. Ve a https://anthana.agency/login
2. Abre la consola del navegador (F12)
3. Intenta hacer login
4. Revisa los logs:
   - Debe mostrar `Login attempt - Environment check:` con las variables configuradas
   - Si sigue fallando, el error debería ser diferente

## Errores Comunes

### Error 1: Key con espacios
**Síntoma**: La key tiene espacios al inicio o final
**Solución**: Copia la key nuevamente y pega sin espacios

### Error 2: Key con saltos de línea
**Síntoma**: La key está en múltiples líneas en Vercel
**Solución**: Pega la key en un editor de texto plano primero, luego cópiala sin saltos de línea

### Error 3: Key incorrecta (service_role en vez de anon)
**Síntoma**: Estás usando la service_role key en vez de la anon public key
**Solución**: Asegúrate de usar la key marcada como `anon public` en Supabase

### Error 4: Key de otro proyecto
**Síntoma**: Estás usando la key de un proyecto diferente de Supabase
**Solución**: Verifica que la URL y la key sean del mismo proyecto

## Verificación Rápida

Para verificar que todo está bien configurado:

1. Abre la consola del navegador en https://anthana.agency/login
2. Antes de intentar login, busca en los logs:
   ```
   Login attempt - Environment check:
   ```
3. Debe mostrar:
   - `hasSupabaseUrl: true`
   - `hasSupabaseKey: true`
   - `urlPreview: https://xxxxx.supabase.co...`
4. Si muestra `false` en alguno, esa variable no está configurada correctamente

## Si Aún No Funciona

Si después de seguir estos pasos sigue fallando:

1. Verifica en Supabase Dashboard → **Settings** → **API** que:
   - La URL del proyecto sea la correcta
   - La key `anon public` sea la que estás usando
   
2. En Vercel, elimina y vuelve a crear las variables:
   - Elimina `NEXT_PUBLIC_SUPABASE_URL`
   - Elimina `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Vuelve a crearlas desde cero con los valores correctos
   - Hace un redeploy

3. Revisa los logs de Supabase:
   - En Supabase Dashboard → **Logs** → **Auth Logs**
   - Busca intentos de login recientes
   - Verifica si hay errores específicos

