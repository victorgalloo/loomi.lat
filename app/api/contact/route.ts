import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Lazy initialize Resend to avoid build-time errors
function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  return new Resend(apiKey);
}

// Email configuration - can be overridden with environment variables
const NOTIFICATION_EMAIL = process.env.CONTACT_NOTIFICATION_EMAIL || 'hello@anthanagroup.com';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

/**
 * POST /api/contact
 * Handles contact form submissions and sends emails
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { company, phone, email } = body;

    // Validate required fields
    if (!company || !phone || !email) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'El formato del email no es válido' },
        { status: 400 }
      );
    }

    // Send email to notification address
    // Note: With free Resend plan, you can only send to your own verified email
    // To send to other addresses, verify a domain at resend.com/domains
    const resend = getResend();
    const notificationEmail = await resend.emails.send({
      from: `Anthana Contact <${FROM_EMAIL}>`,
      to: NOTIFICATION_EMAIL,
      subject: `Nuevo contacto: ${company}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Nuevo Contacto</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #FF3621 0%, #FF6B35 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Nuevo Contacto Recibido</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
              <p style="margin: 0 0 20px 0; font-size: 16px;">Has recibido un nuevo contacto a través del formulario de la landing page:</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #FF3621;">
                <p style="margin: 0 0 10px 0;"><strong style="color: #374151;">Empresa:</strong> ${company}</p>
                <p style="margin: 0 0 10px 0;"><strong style="color: #374151;">Teléfono:</strong> ${phone}</p>
                <p style="margin: 0;"><strong style="color: #374151;">Email:</strong> <a href="mailto:${email}" style="color: #FF3621; text-decoration: none;">${email}</a></p>
              </div>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; font-size: 14px; color: #6b7280;">
                  Este email fue enviado automáticamente desde el formulario de contacto de anthana.agency
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    // Send confirmation email to the client (optional - may fail with free plan if domain not verified)
    // With free Resend plan, you can only send to your own verified email
    // For production, verify a domain at resend.com/domains
    let confirmationEmail = null;
    let confirmationSent = false;
    
    try {
      confirmationEmail = await resend.emails.send({
        from: `Anthana <${FROM_EMAIL}>`,
        to: email,
        subject: 'Gracias por contactarnos - Anthana',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Gracias por contactarnos</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #FF3621 0%, #FF6B35 100%); padding: 40px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">¡Gracias por contactarnos!</h1>
              </div>
              <div style="background: #f9fafb; padding: 40px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
                <p style="margin: 0 0 20px 0; font-size: 16px; color: #374151;">
                  Hola <strong>${company}</strong>,
                </p>
                
                <p style="margin: 0 0 20px 0; font-size: 16px; color: #374151;">
                  Gracias por ponerte en contacto con nosotros. Hemos recibido tu información y nuestro equipo se pondrá en contacto contigo a la brevedad.
                </p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #FF3621;">
                  <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;"><strong>Resumen de tu solicitud:</strong></p>
                  <p style="margin: 5px 0; font-size: 14px; color: #374151;">Empresa: ${company}</p>
                  <p style="margin: 5px 0; font-size: 14px; color: #374151;">Teléfono: ${phone}</p>
                  <p style="margin: 5px 0; font-size: 14px; color: #374151;">Email: ${email}</p>
                </div>
                
                <p style="margin: 20px 0 0 0; font-size: 16px; color: #374151;">
                  Mientras tanto, puedes visitar nuestro sitio web para conocer más sobre nuestros servicios.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://anthana.agency" style="display: inline-block; background: #FF3621; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; transition: background 0.3s;">
                    Visitar nuestro sitio
                  </a>
                </div>
                
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; font-size: 14px; color: #6b7280; text-align: center;">
                    Este es un email automático, por favor no respondas a este mensaje.<br>
                    Si tienes alguna pregunta, puedes contactarnos en <a href="mailto:hello@anthanagroup.com" style="color: #FF3621; text-decoration: none;">hello@anthanagroup.com</a>
                  </p>
                </div>
              </div>
              <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                  © ${new Date().getFullYear()} Anthana. Todos los derechos reservados.
                </p>
              </div>
            </body>
          </html>
        `,
      });
      
      if (!confirmationEmail.error) {
        confirmationSent = true;
      }
    } catch (confirmationError) {
      console.warn('Could not send confirmation email (domain may not be verified):', confirmationError);
      // Don't fail the whole request if confirmation email fails
    }

    // Check if notification email was sent successfully (this is required)
    if (notificationEmail.error) {
      console.error('Error sending notification email:', notificationEmail.error);
      
      return NextResponse.json(
        { error: 'Error al enviar el email de notificación. Por favor, verifica tu configuración de Resend.' },
        { status: 500 }
      );
    }
    
    // Log if confirmation email failed (but don't fail the request)
    if (confirmationEmail?.error) {
      console.warn('Confirmation email could not be sent:', confirmationEmail.error);
      console.warn('Note: With free Resend plan, you can only send to your own verified email. Verify a domain at resend.com/domains to send to any email address.');
    }

    return NextResponse.json(
      { 
        success: true,
        message: confirmationSent 
          ? 'Formulario enviado correctamente. Revisa tu email para la confirmación.'
          : 'Formulario enviado correctamente. Hemos recibido tu información y te contactaremos pronto.'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing contact form:', error);
    return NextResponse.json(
      { error: 'Error al procesar el formulario. Por favor, intenta nuevamente.' },
      { status: 500 }
    );
  }
}

