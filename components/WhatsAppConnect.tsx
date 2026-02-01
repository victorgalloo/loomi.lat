'use client';

import { useEffect, useState, useCallback } from 'react';

// Tipos para Facebook SDK
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

// Configuración de Meta
const META_APP_ID = '816459297543576';
const META_CONFIG_ID = '1931749487714940';

export default function WhatsAppConnect() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [signupData, setSignupData] = useState<{
    waba_id?: string;
    phone_number_id?: string;
    code?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Manejar mensajes del popup de Embedded Signup
  const handleMessage = useCallback((event: MessageEvent) => {
    // Verificar origen de Meta
    if (event.origin !== 'https://www.facebook.com' && event.origin !== 'https://web.facebook.com') {
      return;
    }

    try {
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

      if (data.type === 'WA_EMBEDDED_SIGNUP') {
        const signupEvent = data as EmbeddedSignupEvent;

        console.log('=== WA_EMBEDDED_SIGNUP Event ===');
        console.log('Event:', signupEvent.event);
        console.log('Type:', signupEvent.type);
        console.log('Data:', JSON.stringify(signupEvent.data, null, 2));

        if (signupEvent.data.phone_number_id && signupEvent.data.waba_id) {
          const result = {
            waba_id: signupEvent.data.waba_id,
            phone_number_id: signupEvent.data.phone_number_id,
          };

          console.log('=== Signup Successful ===');
          console.log('WABA ID:', result.waba_id);
          console.log('Phone Number ID:', result.phone_number_id);

          setSignupData(result);
          setError(null);

          alert(
            `WhatsApp Business conectado exitosamente!\n\n` +
            `WABA ID: ${result.waba_id}\n` +
            `Phone Number ID: ${result.phone_number_id}`
          );
        }

        if (signupEvent.data.error_message) {
          console.error('Signup Error:', signupEvent.data.error_message);
          setError(signupEvent.data.error_message);
        }

        if (signupEvent.data.current_step) {
          console.log('Current Step:', signupEvent.data.current_step);
        }
      }
    } catch (e) {
      // No es un mensaje JSON válido, ignorar
    }
  }, []);

  // Cargar Facebook SDK
  useEffect(() => {
    // Agregar listener para mensajes del popup
    window.addEventListener('message', handleMessage);

    // Verificar si el SDK ya está cargado
    if (window.FB) {
      setIsSDKLoaded(true);
      return;
    }

    // Callback cuando el SDK esté listo
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: META_APP_ID,
        autoLogAppEvents: true,
        xfbml: true,
        version: 'v22.0',
      });
      setIsSDKLoaded(true);
      console.log('Facebook SDK initialized');
    };

    // Cargar el SDK de forma asíncrona
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
        console.error('Error loading Facebook SDK');
        setError('Error al cargar Facebook SDK');
      };

      document.body.appendChild(script);
    };

    loadSDK();

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [handleMessage]);

  // Iniciar Embedded Signup
  const handleConnect = () => {
    if (!window.FB) {
      setError('Facebook SDK no está cargado');
      return;
    }

    setIsLoading(true);
    setError(null);

    console.log('=== Iniciando Embedded Signup ===');
    console.log('App ID:', META_APP_ID);
    console.log('Config ID:', META_CONFIG_ID);

    window.FB.login(
      (response: FacebookLoginResponse) => {
        setIsLoading(false);

        console.log('=== FB.login Response ===');
        console.log('Status:', response.status);
        console.log('Auth Response:', JSON.stringify(response.authResponse, null, 2));

        if (response.authResponse?.code) {
          console.log('Authorization Code:', response.authResponse.code);
          setSignupData(prev => ({
            ...prev,
            code: response.authResponse?.code,
          }));

          alert(
            `Autorización exitosa!\n\n` +
            `Code: ${response.authResponse.code.substring(0, 50)}...`
          );
        } else {
          console.log('Login cancelled or failed');
          if (response.status !== 'connected') {
            setError('Proceso cancelado o fallido');
          }
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

  return (
    <div className="flex flex-col items-center gap-6 p-8 max-w-md mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Conectar WhatsApp Business
        </h2>
        <p className="text-gray-600 text-sm">
          Conecta tu cuenta de WhatsApp Business para habilitar mensajería automatizada
        </p>
      </div>

      {/* Estado del SDK */}
      <div className="flex items-center gap-2 text-sm">
        <div
          className={`w-2 h-2 rounded-full ${
            isSDKLoaded ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
          }`}
        />
        <span className="text-gray-600">
          {isSDKLoaded ? 'SDK cargado' : 'Cargando SDK...'}
        </span>
      </div>

      {/* Botón de conexión */}
      <button
        onClick={handleConnect}
        disabled={!isSDKLoaded || isLoading}
        className={`
          flex items-center gap-3 px-6 py-3 rounded-lg font-medium text-white
          transition-all duration-200
          ${
            isSDKLoaded && !isLoading
              ? 'bg-[#25D366] hover:bg-[#128C7E] cursor-pointer'
              : 'bg-gray-400 cursor-not-allowed'
          }
        `}
      >
        {/* WhatsApp Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        {isLoading ? 'Conectando...' : 'Conectar WhatsApp Business'}
      </button>

      {/* Error */}
      {error && (
        <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Datos recibidos */}
      {signupData && (
        <div className="w-full p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-medium text-green-800 mb-2">Datos Recibidos:</h3>
          <div className="space-y-1 text-sm font-mono">
            {signupData.waba_id && (
              <p className="text-green-700">
                <span className="font-semibold">WABA ID:</span> {signupData.waba_id}
              </p>
            )}
            {signupData.phone_number_id && (
              <p className="text-green-700">
                <span className="font-semibold">Phone Number ID:</span> {signupData.phone_number_id}
              </p>
            )}
            {signupData.code && (
              <p className="text-green-700 break-all">
                <span className="font-semibold">Code:</span> {signupData.code.substring(0, 100)}...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="text-xs text-gray-500 text-center">
        <p>App ID: {META_APP_ID}</p>
        <p>Config ID: {META_CONFIG_ID}</p>
      </div>
    </div>
  );
}
