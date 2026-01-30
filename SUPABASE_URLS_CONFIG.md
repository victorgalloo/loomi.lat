# Configuración de URLs para Supabase - anthana.agency

## URLs para Configurar en Supabase Dashboard

### 1. Site URL
En **Authentication** > **URL Configuration** > **Site URL**:
```
https://anthana.agency
```

### 2. Redirect URLs
En **Authentication** > **URL Configuration** > **Redirect URLs**, agrega TODAS estas líneas (una por una):

#### Producción (dominio principal)
```
https://anthana.agency/**
https://anthana.agency
https://anthana.agency/
https://anthana.agency/dashboard
https://anthana.agency/login
https://anthana.agency/dashboard/
https://anthana.agency/login/
```

#### Desarrollo Local (para testing)
```
http://localhost:3000/**
http://localhost:3000
http://localhost:3000/
http://localhost:3000/dashboard
http://localhost:3000/login
http://localhost:3000/dashboard/
http://localhost:3000/login/
```

#### Preview/Staging (si tienes en Vercel)
Si tienes deployments de preview en Vercel, también agrega:
```
https://*.vercel.app/**
https://*.vercel.app/dashboard
https://*.vercel.app/login
```

## Pasos para Configurar

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Authentication** (menú lateral izquierdo)
4. Click en **URL Configuration**
5. En **Site URL**, pega: `https://anthana.agency`
6. En **Redirect URLs**, agrega cada URL de la lista anterior (una por línea)
7. Click en **Save**
8. Espera unos segundos para que los cambios se apliquen

## Verificación

Después de configurar:
1. Intenta hacer login en https://anthana.agency/login
2. Si sigue fallando, abre la consola del navegador (F12)
3. Revisa los logs de error para identificar el problema específico

## Nota Importante

- El `**` al final significa "cualquier ruta debajo de este dominio"
- Es importante incluir tanto las URLs con `/` al final como sin `/`
- Incluye tanto `http://` (para local) como `https://` (para producción)

