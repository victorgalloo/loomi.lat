'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2, AlertCircle, Sparkles, Phone } from 'lucide-react';

// Types for Facebook SDK
declare global {
  interface Window {
    FB: {
      init: (params: {
        appId: string;
        autoLogAppEvents?: boolean;
        xfbml?: boolean;
        version: string;
      }) => void;
      login: (
        callback: (response: FacebookLoginResponse) => void,
        options: {
          config_id: string;
          response_type: string;
          override_default_response_type: boolean;
          extras: {
            setup: Record<string, unknown>;
            featureType: string;
            sessionInfoVersion: string;
          };
        }
      ) => void;
    };
    fbAsyncInit: () => void;
  }
}

interface FacebookLoginResponse {
  authResponse?: {
    code?: string;
    accessToken?: string;
    userID?: string;
    expiresIn?: number;
  };
  status?: string;
}

interface EmbeddedSignupEvent {
  event: string;
  type: string;
  data: {
    phone_number_id?: string;
    waba_id?: string;
    current_step?: string;
    error_message?: string;
  };
}

interface WhatsAppConnectFlowProps {
  onSuccess?: (data: { wabaId: string; phoneNumberId: string; displayPhoneNumber?: string; businessName?: string }) => void;
  onError?: (error: string) => void;
  /** When set, shows a banner indicating this Twilio number is being registered */
  twilioPhoneNumber?: string;
}

// Meta App configuration
const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID || '816459297543576';
const META_CONFIG_ID = process.env.NEXT_PUBLIC_META_CONFIG_ID || '1931749487714940';

export default function WhatsAppConnectFlow({ onSuccess, onError, twilioPhoneNumber }: WhatsAppConnectFlowProps) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ phoneNumber?: string; businessName?: string } | null>(null);

  // Handle messages from the Embedded Signup popup
  const handleMessage = useCallback((event: MessageEvent) => {
    if (event.origin !== 'https://www.facebook.com' && event.origin !== 'https://web.facebook.com') {
      return;
    }

    try {
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

      if (data.type === 'WA_EMBEDDED_SIGNUP') {
        const signupEvent = data as EmbeddedSignupEvent;

        console.log('[WhatsAppConnect] Event:', signupEvent.event, signupEvent.data);

        if (signupEvent.data.phone_number_id && signupEvent.data.waba_id) {
          const signupData = {
            waba_id: signupEvent.data.waba_id,
            phone_number_id: signupEvent.data.phone_number_id,
          };
          console.log('[WhatsAppConnect] Signup data received:', signupData);
        }

        if (signupEvent.data.error_message) {
          console.error('[WhatsAppConnect] Signup Error:', signupEvent.data.error_message);
          setError(signupEvent.data.error_message);
          onError?.(signupEvent.data.error_message);
        }
      }
    } catch {
      // Not a valid JSON message, ignore
    }
  }, [onError]);

  // Load Facebook SDK
  useEffect(() => {
    window.addEventListener('message', handleMessage);

    if (window.FB) {
      setIsSDKLoaded(true);
      return;
    }

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: META_APP_ID,
        autoLogAppEvents: true,
        xfbml: true,
        version: 'v22.0',
      });
      setIsSDKLoaded(true);
      console.log('[WhatsAppConnect] Facebook SDK initialized');
    };

    const loadSDK = () => {
      if (document.getElementById('facebook-jssdk')) {
        return;
      }

      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';

      script.onerror = () => {
        console.error('[WhatsAppConnect] Error loading Facebook SDK');
        setError('Error al cargar Facebook SDK');
      };

      document.body.appendChild(script);
    };

    loadSDK();

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [handleMessage]);

  // Send signup data to backend
  const completeConnection = async (code: string, wabaId: string, phoneNumberId: string) => {
    setIsConnecting(true);
    setError(null);

    try {
      const response = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          waba_id: wabaId,
          phone_number_id: phoneNumberId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to connect WhatsApp');
      }

      setSuccess({
        phoneNumber: result.data.displayPhoneNumber,
        businessName: result.data.businessName,
      });

      onSuccess?.({
        wabaId: result.data.wabaId,
        phoneNumberId: result.data.phoneNumberId,
        displayPhoneNumber: result.data.displayPhoneNumber,
        businessName: result.data.businessName,
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  // Start Embedded Signup
  const handleConnect = () => {
    if (!window.FB) {
      setError('Facebook SDK no esta cargado');
      return;
    }

    setIsLoading(true);
    setError(null);

    let pendingSignup: { waba_id?: string; phone_number_id?: string } = {};

    const messageHandler = (event: MessageEvent) => {
      if (event.origin !== 'https://www.facebook.com' && event.origin !== 'https://web.facebook.com') {
        return;
      }

      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data.type === 'WA_EMBEDDED_SIGNUP' && data.data.phone_number_id) {
          pendingSignup = {
            waba_id: data.data.waba_id,
            phone_number_id: data.data.phone_number_id,
          };
        }
      } catch {
        // Ignore
      }
    };

    window.addEventListener('message', messageHandler);

    window.FB.login(
      (response: FacebookLoginResponse) => {
        setIsLoading(false);
        window.removeEventListener('message', messageHandler);

        console.log('[WhatsAppConnect] FB.login response:', response.status);

        if (response.authResponse?.code && pendingSignup.waba_id && pendingSignup.phone_number_id) {
          completeConnection(
            response.authResponse.code,
            pendingSignup.waba_id,
            pendingSignup.phone_number_id
          );
        } else if (response.status !== 'connected') {
          setError('Proceso cancelado o fallido. Por favor intenta de nuevo.');
        } else {
          setError('No se recibieron los datos de WhatsApp. Por favor intenta de nuevo.');
        }
      },
      {
        config_id: META_CONFIG_ID,
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: '',
          sessionInfoVersion: '3',
        },
      }
    );
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-info/10 border border-info/20 rounded-2xl p-8 text-center relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-info/10 to-transparent pointer-events-none" />

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
          className="w-16 h-16 bg-info/10 border border-info/20 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10 shadow-lg shadow-info/20"
        >
          <Check className="w-8 h-8 text-info" />
        </motion.div>
        <h3 className="text-xl font-semibold text-info mb-2 relative z-10">
          WhatsApp Conectado
        </h3>
        {success.businessName && (
          <p className="text-foreground font-medium relative z-10">{success.businessName}</p>
        )}
        {success.phoneNumber && (
          <p className="text-muted font-mono relative z-10">{success.phoneNumber}</p>
        )}
        <p className="text-muted mt-4 relative z-10 flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-info" />
          Tu agente AI esta listo para responder mensajes.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 p-8 relative">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-info/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="text-center relative z-10">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Conectar WhatsApp Business
        </h2>
        <p className="text-muted max-w-md">
          Conecta tu cuenta de WhatsApp Business para que tu agente AI pueda responder mensajes automaticamente.
        </p>
      </div>

      {/* Twilio Number Banner */}
      {twilioPhoneNumber && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-info/10 border border-info/20 relative z-10">
          <Phone className="w-4 h-4 text-info" />
          <span className="text-sm text-info">
            Registrando <span className="font-mono font-medium">{twilioPhoneNumber}</span> con WhatsApp Business
          </span>
        </div>
      )}

      {/* SDK Status */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-2 text-sm relative z-10"
      >
        <motion.div
          className={`w-2 h-2 rounded-full ${isSDKLoaded ? 'bg-info' : 'bg-amber-500'}`}
          animate={isSDKLoaded ? {} : { scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
        <span className="text-muted">
          {isSDKLoaded ? 'Listo para conectar' : 'Cargando...'}
        </span>
      </motion.div>

      {/* Connect Button */}
      <motion.button
        onClick={handleConnect}
        disabled={!isSDKLoaded || isLoading || isConnecting}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`
          relative flex items-center gap-3 px-8 py-4 rounded-2xl font-medium text-lg
          transition-all duration-300 z-10
          ${
            isSDKLoaded && !isLoading && !isConnecting
              ? 'bg-info text-white cursor-pointer shadow-lg shadow-info/30 hover:bg-info/90'
              : 'bg-surface-2 text-muted cursor-not-allowed border border-border'
          }
        `}
      >
        {isConnecting || isLoading ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        )}
        {isConnecting ? 'Conectando...' : isLoading ? 'Procesando...' : 'Conectar WhatsApp Business'}
      </motion.button>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 z-10"
        >
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-600 text-sm">{error}</p>
        </motion.div>
      )}

      {/* Instructions */}
      <div className="max-w-md text-center text-sm text-muted space-y-3 relative z-10">
        <p>Al hacer clic, se abrira una ventana de Meta donde podras:</p>
        <ul className="text-left space-y-2">
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-info mt-2 flex-shrink-0" />
            Crear una cuenta de WhatsApp Business API
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-info mt-2 flex-shrink-0" />
            Verificar tu numero de telefono
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-info mt-2 flex-shrink-0" />
            Autorizar a Loomi para enviar mensajes
          </li>
        </ul>
      </div>
    </div>
  );
}
