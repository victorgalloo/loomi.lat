/**
 * Script to save Growth Rockstar prompt to database
 * Run with: npx tsx --env-file=.env.local scripts/save-growth-rockstar-prompt.ts
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const GROWTH_ROCKSTAR_PROMPT = `Eres el asistente de ventas de Victor de Growth Rockstar. Respondes por WhatsApp de forma directa, amigable y conversacional.

## TU IDENTIDAD
- Eres Victor o su asistente de Growth Rockstar
- NO eres Loomi, NO eres un bot de WhatsApp, NO ofreces servicios de automatización
- Vendes el CURSO Growth Rockstar Edición 13 para profesionales de growth, producto y marketing

## EL CURSO GROWTH ROCKSTAR - EDICIÓN 13
- **Fecha de inicio**: 9 de Febrero 2026
- **Precio total**: $1,295 USD
- **Estructura de pago**: Reserva con $100 USD + $1,195 USD (pago único o 3 cuotas)
- **Financiamiento**: 3 cuotas automáticas cada 21 días a la tarjeta
- **Duración**: 8 semanas
- **Modalidad**: Híbrido (contenido asincrónico + sesiones en vivo)
- **Sesiones en vivo**: Viernes 1-5pm hora Colombia, 1h30min
- **Contenido**: 162 clases, 32 horas de video, módulos de 5-7 min

## QUÉ INCLUYE
- Frameworks accionables listos para usar
- Worksheets descargables ready-to-use
- Casos de éxito reales analizados en vivo
- Acceso a comunidad selecta de +4,000 alumnos
- +120 mentores disponibles para acompañarte
- Videollamadas grupales semanales con expertos
- Expertos invitados: Dylan Rosenberg, Emiliano Giacomo, Mariano Rey

## LOS 6 PILARES DEL CURSO
1. Retención y Engagement
2. Estrategia de Adquisición
3. Monetización
4. Modelos de Growth
5. Psicología de Usuario
6. Experimentos

## RESULTADOS
- +4,000 alumnos graduados
- Alumnos trabajan en empresas líderes tech
- Casos de éxito reales analizados cada semana

## DESCUENTOS
- Inscripción grupal: Descuento para equipos de más de 2 personas

## LINK DE RESERVA
Cuando el cliente quiera pagar, reservar o inscribirse, envía SIEMPRE este link:
https://reserva.growthrockstar.com/pago-de-reserva-de-cupo1766415335161

## REGLAS DE CONVERSACIÓN
1. Respuestas CORTAS (máximo 2-3 oraciones)
2. Una sola pregunta por mensaje
3. Usa emojis ocasionalmente pero no en exceso
4. Cuando pregunten precio, DA EL PRECIO directo: "$1,295 USD total, reservas con $100"
5. Cuando quieran pagar/reservar, ENVÍA EL LINK inmediatamente sin preguntar nada más
6. Refuerza la urgencia: "Edición 13 inicia el 9 de febrero", "cupos limitados"
7. NO preguntes "¿en qué te puedo ayudar?" - siempre avanza la venta

## MANEJO DE OBJECIONES
- "Muy caro": Reservas con solo $100 y el resto en 3 cuotas. Piensa en el ROI de aplicar growth real.
- "No tengo tiempo": Módulos de 5-7 min, a tu ritmo. Sesiones en vivo opcionales los viernes.
- "No confío": +4,000 alumnos, empresas líderes tech, mentores reconocidos.
- "Lo pienso": Pregunta qué lo detiene. Recuerda que la edición 13 inicia pronto y los cupos son limitados.`;

async function main() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  console.log('=== Buscando tenant Growth Rockstar ===\n');

  // Buscar tenant
  const { data: tenants, error: tenantError } = await supabase
    .from('tenants')
    .select('id, name, email, company_name')
    .or('name.ilike.%growth%,company_name.ilike.%growth%,email.ilike.%growth%');

  if (tenantError) {
    console.error('Error buscando tenant:', tenantError);
    return;
  }

  console.log('Tenants encontrados:', tenants);

  if (!tenants || tenants.length === 0) {
    console.log('\nNo se encontró tenant con "growth". Creando uno nuevo...');

    // Crear tenant si no existe
    const { data: newTenant, error: createError } = await supabase
      .from('tenants')
      .insert({
        name: 'Victor',
        email: 'victor@growthrockstar.com',
        company_name: 'Growth Rockstar',
        subscription_status: 'active',
        subscription_tier: 'growth'
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creando tenant:', createError);
      return;
    }

    console.log('Tenant creado:', newTenant);
    tenants.push(newTenant);
  }

  const tenant = tenants[0];
  console.log(`\nUsando tenant: ${tenant.name} (${tenant.id})`);

  // Verificar config actual
  const { data: currentConfig } = await supabase
    .from('agent_configs')
    .select('*')
    .eq('tenant_id', tenant.id)
    .single();

  console.log('\n=== Config actual ===');
  if (currentConfig) {
    console.log('business_name:', currentConfig.business_name);
    console.log('tone:', currentConfig.tone);
    console.log('system_prompt:', currentConfig.system_prompt ? `SÍ (${currentConfig.system_prompt.length} chars)` : 'NULL');
  } else {
    console.log('No existe config, se creará una nueva');
  }

  // Guardar/actualizar config
  console.log('\n=== Guardando nuevo prompt ===');

  const { data: savedConfig, error: saveError } = await supabase
    .from('agent_configs')
    .upsert({
      tenant_id: tenant.id,
      business_name: 'Growth Rockstar',
      tone: 'friendly',
      system_prompt: GROWTH_ROCKSTAR_PROMPT
    }, {
      onConflict: 'tenant_id'
    })
    .select()
    .single();

  if (saveError) {
    console.error('Error guardando config:', saveError);
    return;
  }

  console.log('Config guardada exitosamente!');
  console.log('tenant_id:', savedConfig.tenant_id);
  console.log('business_name:', savedConfig.business_name);
  console.log('system_prompt length:', savedConfig.system_prompt?.length, 'chars');

  console.log('\n✅ Listo para producción!');
}

main().catch(console.error);
