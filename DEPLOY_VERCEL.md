# Guía: Cambiar Proyecto en Vercel al Nuevo Repositorio

Esta guía te ayudará a cambiar tu proyecto en Vercel del repositorio anterior a este nuevo repositorio.

## Paso 1: Acceder al Dashboard de Vercel

1. Ve a [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Inicia sesión con tu cuenta
3. Encuentra el proyecto que quieres actualizar (el proyecto anterior)

## Paso 2: Cambiar el Repositorio Conectado

### Opción A: Cambiar el repositorio en el proyecto existente

1. En el dashboard de Vercel, haz clic en tu proyecto
2. Ve a **Settings** (Configuración) en el menú superior
3. En el menú lateral izquierdo, busca **Git**
4. Haz clic en **Git**
5. Verás la sección **Connected Git Repository**
6. Haz clic en **Disconnect** (Desconectar) para desconectar el repositorio anterior
7. Haz clic en **Connect Git Repository**
8. Selecciona **GitHub** (o la plataforma que uses)
9. Busca y selecciona el repositorio: `CarlosCardonaM/anthanaperfect`
10. Haz clic en **Connect**

### Opción B: Crear un nuevo proyecto (Recomendado si quieres mantener el anterior)

1. En el dashboard de Vercel, haz clic en **Add New...** → **Project**
2. Selecciona **Import Git Repository**
3. Busca y selecciona: `CarlosCardonaM/anthanaperfect`
4. Haz clic en **Import**

## Paso 3: Configurar el Proyecto

### 3.1 Configuración Básica

1. **Project Name**: Déjalo como está o cámbialo si quieres
2. **Framework Preset**: Debería detectar automáticamente **Next.js**
3. **Root Directory**: Déjalo como `./` (raíz del proyecto)
4. **Build Command**: Debería ser `next build` (automático)
5. **Output Directory**: Debería ser `.next` (automático)
6. **Install Command**: Debería ser `npm install` (automático)

### 3.2 Variables de Entorno

**IMPORTANTE**: Necesitas agregar todas las variables de entorno. Haz clic en **Environment Variables** y agrega:

#### Variables de Supabase:
```
NEXT_PUBLIC_SUPABASE_URL
Valor: https://xsnpjpdrznbmyikcflvm.supabase.co
Marcar: Production, Preview, Development
```

```
NEXT_PUBLIC_SUPABASE_ANON_KEY
Valor: sb_publishable_pmHXinzemWKUEDO0aoJ9ag_TWZjjTIZ
Marcar: Production, Preview, Development
```

#### Variables de Resend (Email):
```
RESEND_API_KEY
Valor: re_bhvnKVaB_EigzH1wzegWSsEHML75tpzJj
Marcar: Production, Preview, Development
```

```
CONTACT_NOTIFICATION_EMAIL
Valor: hello@anthanagroup.com
(Usa el email con el que te registraste en Resend si es diferente)
Marcar: Production, Preview, Development
```

#### Variable opcional de Resend:
```
RESEND_FROM_EMAIL
Valor: onboarding@resend.dev
(O usa noreply@anthana.agency si ya verificaste el dominio)
Marcar: Production, Preview, Development
```

### 3.3 Cómo Agregar Variables de Entorno:

1. En la página de configuración del proyecto, ve a **Environment Variables**
2. Haz clic en **Add New**
3. Ingresa el **Name** (nombre de la variable)
4. Ingresa el **Value** (valor de la variable)
5. Marca las casillas: **Production**, **Preview**, **Development**
6. Haz clic en **Save**
7. Repite para cada variable

## Paso 4: Desplegar

1. Si estás usando la **Opción A** (cambiar repositorio):
   - **IMPORTANTE**: Después de cambiar el repositorio, Vercel NO hace deploy automático
   - Ve a la pestaña **Deployments** (en la parte superior del proyecto)
   - Haz clic en el botón **"..."** (tres puntos) en la esquina superior derecha
   - Selecciona **"Redeploy"** o **"Redeploy All"**
   - O haz clic en el último deployment y luego en **"Redeploy"**
   - Esto forzará un nuevo deployment con el código del nuevo repositorio
   - Espera a que se complete el build (puede tomar 2-5 minutos)

2. Si estás usando la **Opción B** (nuevo proyecto):
   - Haz clic en **Deploy**
   - Espera a que se complete el build

### Alternativa: Hacer un commit para trigger automático

Si prefieres que Vercel detecte automáticamente los cambios:

1. Haz un pequeño cambio en el repositorio (por ejemplo, un comentario en un archivo)
2. Haz commit y push:
   ```bash
   git commit --allow-empty -m "Trigger Vercel deployment"
   git push origin master
   ```
3. Vercel debería detectar el nuevo commit y hacer deploy automáticamente

## Paso 5: Verificar el Deployment

1. Una vez completado el deployment, verás un enlace tipo: `tu-proyecto.vercel.app`
2. Haz clic en el enlace para ver tu sitio
3. Verifica que todo funcione correctamente:
   - Landing page carga
   - Formulario de contacto funciona
   - Portal de login funciona
   - Dashboard funciona

## Paso 6: Configurar Dominio Personalizado (Opcional)

Si tenías un dominio personalizado en el proyecto anterior:

1. Ve a **Settings** → **Domains**
2. Agrega tu dominio personalizado
3. Sigue las instrucciones de Vercel para configurar los DNS

## Paso 7: Configurar Dominio en Resend (Para Emails)

Para que los emails funcionen correctamente en producción:

1. Ve a [https://resend.com/domains](https://resend.com/domains)
2. Agrega y verifica el dominio `anthana.agency`
3. Agrega los registros DNS que Resend te proporcione
4. Una vez verificado, actualiza la variable `RESEND_FROM_EMAIL` en Vercel a `noreply@anthana.agency`
5. Haz un nuevo deployment

## Troubleshooting

### Error: "Build failed"
- Verifica que todas las variables de entorno estén configuradas
- Revisa los logs del build en Vercel para ver el error específico
- Asegúrate de que `package.json` tenga todas las dependencias

### Error: "Environment variables not found"
- Verifica que todas las variables estén marcadas para **Production**
- Asegúrate de que los nombres de las variables sean exactos (case-sensitive)

### Emails no funcionan
- Verifica que `RESEND_API_KEY` esté correctamente configurada
- Verifica que `CONTACT_NOTIFICATION_EMAIL` sea el email de tu cuenta de Resend
- Revisa los logs de la API route en Vercel

### El sitio no carga
- Verifica que el framework esté configurado como **Next.js**
- Revisa los logs del deployment
- Asegúrate de que el repositorio esté correctamente conectado

## Notas Importantes

- **No elimines el proyecto anterior** hasta verificar que el nuevo funciona correctamente
- **Guarda una copia de las variables de entorno** del proyecto anterior por si acaso
- **El dominio personalizado** puede tardar en propagarse (hasta 48 horas)
- **Los emails** solo funcionarán a direcciones verificadas hasta que verifiques el dominio en Resend

## Checklist Final

- [ ] Repositorio conectado correctamente
- [ ] Todas las variables de entorno configuradas
- [ ] Deployment completado exitosamente
- [ ] Sitio carga correctamente
- [ ] Formulario de contacto funciona
- [ ] Portal de login funciona
- [ ] Dashboard funciona
- [ ] Emails se envían correctamente (opcional: verificar dominio en Resend)

