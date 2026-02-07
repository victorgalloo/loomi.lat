/**
 * Auto-responder Detection
 *
 * Detects corporate/business auto-reply messages to avoid
 * the bot engaging with automated systems.
 */

// Patterns that indicate an auto-responder message
const AUTORESPONDER_PATTERNS: RegExp[] = [
  // "Gracias por comunicarte con [COMPANY]"
  /gracias por (comunicarte|contactarnos|escribirnos|tu mensaje)/i,
  // "Hemos recibido tu mensaje"
  /hemos recibido (tu|su) (mensaje|solicitud|consulta)/i,
  // "Te responderemos a la brevedad"
  /te (responderemos|contestaremos|atenderemos) (a la brevedad|pronto|en breve)/i,
  // "Nuestro horario de atención es..."
  /nuestro horario de atenci[oó]n/i,
  // "En este momento no podemos atenderte"
  /en este momento no (podemos|estamos disponibles)/i,
  // "Tu mensaje ha sido recibido"
  /(tu|su) mensaje (ha sido|fue) recibido/i,
  // "Respuesta automática"
  /respuesta autom[aá]tica/i,
  // "Fuera de horario"
  /fuera de (horario|oficina|servicio)/i,
  // "Este número es solo para..."
  /este n[uú]mero es (solo|únicamente) para/i,
  // "Auto-reply" / "Out of office"
  /auto[- ]?reply|out of office|automatic response/i,
  // "Mensaje automático"
  /mensaje autom[aá]tico/i,
  // "Estimado cliente" followed by corporate patterns
  /estimado (cliente|usuario).*atenci[oó]n/i,
  // "Horario de operación/atención: ..."
  /horario de (operaci[oó]n|atenci[oó]n):\s/i,
  // "Bienvenido a [COMPANY], un asesor te atenderá"
  /bienvenid[oa] a .{3,50}, un (asesor|ejecutivo|agente) te (atender[aá]|contactar[aá])/i,
];

// Minimum message length for auto-responder (most are verbose)
const MIN_AUTORESPONDER_LENGTH = 40;

/**
 * Check if a message looks like a corporate auto-responder
 */
export function isAutoResponder(message: string): boolean {
  // Auto-responders are typically long-ish messages
  if (message.length < MIN_AUTORESPONDER_LENGTH) return false;

  for (const pattern of AUTORESPONDER_PATTERNS) {
    if (pattern.test(message)) {
      return true;
    }
  }

  return false;
}
