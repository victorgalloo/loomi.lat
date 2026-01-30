# Configuración de Email con Resend

Este proyecto utiliza [Resend](https://resend.com) para enviar emails desde el formulario de contacto.

## Plan Gratuito de Resend

Resend ofrece un plan gratuito generoso:
- **3,000 emails/mes** gratis
- **100 emails/día** de límite
- Perfecto para proyectos pequeños y medianos

## Pasos de Configuración

### 1. Crear cuenta en Resend

1. Ve a [https://resend.com](https://resend.com)
2. Crea una cuenta gratuita
3. Verifica tu email

### 2. Obtener API Key

1. Una vez dentro del dashboard de Resend
2. Ve a **API Keys** en el menú lateral
3. Click en **Create API Key**
4. Dale un nombre (ej: "Anthana Contact Form")
5. Selecciona los permisos necesarios (sending access)
6. Copia la API key (solo se muestra una vez, guárdala bien)

### 3. Configurar Dominio (Opcional pero Recomendado)

Para usar `noreply@anthana.agency` como remitente, necesitas verificar tu dominio:

1. Ve a **Domains** en el dashboard de Resend
2. Click en **Add Domain**
3. Ingresa `anthana.agency`
4. Agrega los registros DNS que Resend te proporciona a tu proveedor de dominio
5. Espera a que se verifique (puede tomar unos minutos)

**Nota:** Si no verificas el dominio, puedes usar el dominio por defecto de Resend (`onboarding@resend.dev`) temporalmente, pero los emails pueden ir a spam.

### 4. Agregar Variable de Entorno

Agrega la API key de Resend a tu archivo `.env.local`:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Para producción (Vercel, etc.):**
1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega `RESEND_API_KEY` con tu API key
4. Marca todas las opciones (Production, Preview, Development)
5. Guarda y redeploy

## Instalación del Paquete

Si no se instaló automáticamente, ejecuta:

```bash
npm install resend
```

## Funcionalidad

Cuando un cliente envía el formulario de contacto:

1. **Email a hello@anthanagroup.com**: Recibe un email con los datos del contacto
2. **Email de confirmación al cliente**: Recibe un email automático de confirmación desde `noreply@anthana.agency`

## Personalización

Los templates de email están en:
- `app/api/contact/route.ts` - Líneas donde se definen los HTML de los emails

Puedes personalizar:
- Colores y estilos
- Contenido del mensaje
- Información mostrada
- Diseño responsive

## Troubleshooting

### Error: "Invalid API key"
- Verifica que `RESEND_API_KEY` esté correctamente configurada
- Asegúrate de que no tenga espacios al inicio o final
- Verifica que la key esté activa en el dashboard de Resend

### Emails no llegan
- Revisa la carpeta de spam
- Verifica que el dominio esté verificado en Resend
- Revisa los logs en el dashboard de Resend para ver errores

### Emails van a spam
- Verifica tu dominio en Resend
- Agrega registros SPF y DKIM correctamente
- Usa un dominio verificado como remitente

## Recursos

- [Documentación de Resend](https://resend.com/docs)
- [Guía de verificación de dominio](https://resend.com/docs/dashboard/domains/introduction)

