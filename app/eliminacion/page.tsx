"use client";

import Link from "next/link";
import { ArrowLeft, Mail, MessageCircle, AlertCircle } from "lucide-react";

export default function Eliminacion() {
    return (
        <main className="min-h-screen bg-white text-gray-900">
            {/* Header */}
            <header className="border-b border-gray-200 bg-white/80 backdrop-blur-lg sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-gray-600 hover:text-[#FF3621] transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Volver al Inicio</span>
                    </Link>
                </div>
            </header>

            {/* Content */}
            <article className="max-w-4xl mx-auto px-6 py-16">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Eliminación de Datos de Usuario</h1>
                <p className="text-xl text-gray-600 mb-8">
                    Respetamos tu derecho a controlar tus datos personales.
                </p>

                {/* Info Card */}
                <div className="bg-gradient-to-br from-[#FF3621]/5 to-[#FF6B35]/5 border border-[#FF3621]/20 rounded-2xl p-8 mb-12">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-[#FF3621]/10 rounded-xl">
                            <AlertCircle className="w-6 h-6 text-[#FF3621]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 mb-2">
                                ¿Qué datos podemos tener sobre ti?
                            </h2>
                            <p className="text-gray-600">
                                Si has interactuado con nosotros a través de WhatsApp Business o Meta,
                                podemos tener información como tu número de teléfono, nombre y el historial
                                de conversaciones relacionadas con nuestros servicios.
                            </p>
                        </div>
                    </div>
                </div>

                {/* How to Request Deletion */}
                <section className="mb-12">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                        Cómo solicitar la eliminación de tus datos
                    </h2>

                    <div className="space-y-6">
                        {/* Option 1: Email */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-[#FF3621]/50 transition-colors">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-gray-100 rounded-xl">
                                    <Mail className="w-5 h-5 text-gray-700" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 mb-2">Opción 1: Por correo electrónico</h3>
                                    <p className="text-gray-600 mb-4">
                                        Envía un correo con el asunto &quot;Solicitud de eliminación de datos&quot; a:
                                    </p>
                                    <a
                                        href="mailto:privacy@anthana.agency?subject=Solicitud%20de%20eliminación%20de%20datos"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF3621] text-white rounded-lg hover:bg-[#FF3621]/90 transition-colors font-medium"
                                    >
                                        <Mail className="w-4 h-4" />
                                        privacy@anthana.agency
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Option 2: WhatsApp */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-[#FF3621]/50 transition-colors">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-gray-100 rounded-xl">
                                    <MessageCircle className="w-5 h-5 text-gray-700" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 mb-2">Opción 2: Por WhatsApp</h3>
                                    <p className="text-gray-600 mb-4">
                                        Envía un mensaje con el texto &quot;ELIMINAR MIS DATOS&quot; desde el mismo número
                                        que usaste para contactarnos.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* What Happens Next */}
                <section className="mb-12">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-6">¿Qué sucede después?</h2>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 bg-[#FF3621] text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                                1
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">Verificación de identidad</h4>
                                <p className="text-gray-600">
                                    Podemos solicitarte información adicional para verificar tu identidad.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 bg-[#FF3621] text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                                2
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">Procesamiento</h4>
                                <p className="text-gray-600">
                                    Procesaremos tu solicitud dentro de los 30 días hábiles siguientes.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 bg-[#FF3621] text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                                3
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">Confirmación</h4>
                                <p className="text-gray-600">
                                    Te notificaremos una vez que tus datos hayan sido eliminados de nuestros sistemas.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Additional Info */}
                <section className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Información adicional</h3>
                    <p className="text-gray-600 text-sm">
                        Algunos datos pueden retenerse por obligaciones legales o para proteger nuestros
                        derechos legítimos. Para más información, consulta nuestra{" "}
                        <Link href="/privacy-policy" className="text-[#FF3621] hover:underline">
                            Política de Privacidad
                        </Link>
                        .
                    </p>
                </section>
            </article>

            {/* Footer */}
            <footer className="border-t border-gray-200 bg-gray-50 py-8">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <p className="text-sm text-gray-500">© 2026 Anthana.agency. Todos los derechos reservados.</p>
                </div>
            </footer>
        </main>
    );
}
