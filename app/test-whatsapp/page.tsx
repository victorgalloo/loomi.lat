import WhatsAppConnect from '@/components/WhatsAppConnect';

export const metadata = {
  title: 'Test WhatsApp Embedded Signup',
  description: 'Demo de WhatsApp Embedded Signup para Meta App Review',
};

export default function TestWhatsAppPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          WhatsApp Embedded Signup Demo
        </h1>
        <p className="text-gray-600">
          Demo para Meta App Review - NetBrokrs Insurtech
        </p>
      </div>

      {/* Card con el componente */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-lg">
        <WhatsAppConnect />
      </div>

      {/* Footer con instrucciones */}
      <div className="mt-8 text-center text-sm text-gray-500 max-w-md">
        <p className="mb-2">
          <strong>Instrucciones:</strong>
        </p>
        <ol className="text-left list-decimal list-inside space-y-1">
          <li>Haz clic en &quot;Conectar WhatsApp Business&quot;</li>
          <li>Inicia sesión con tu cuenta de Facebook</li>
          <li>Selecciona o crea una cuenta de WhatsApp Business</li>
          <li>Los datos (WABA ID, Phone Number ID) aparecerán en pantalla</li>
        </ol>
      </div>

      {/* Nota para el video */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-md">
        <p className="text-blue-800 text-sm">
          <strong>Nota:</strong> Abre la consola del navegador (F12) para ver los logs detallados del proceso de Embedded Signup.
        </p>
      </div>
    </div>
  );
}
