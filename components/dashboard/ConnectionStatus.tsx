'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface ConnectionStatusProps {
  connected: boolean;
  phoneNumber?: string;
  businessName?: string;
}

export default function ConnectionStatus({
  connected,
  phoneNumber,
  businessName
}: ConnectionStatusProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        relative p-6 rounded-2xl border overflow-hidden shadow-sm
        ${connected
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-amber-50 border-amber-200'
        }
      `}
    >
      {/* Background glow */}
      <div
        className={`absolute -top-10 -right-10 w-32 h-32 blur-[60px] rounded-full pointer-events-none
          ${connected ? 'bg-emerald-400/30' : 'bg-amber-400/30'}
        `}
      />

      <div className="flex items-start gap-4 relative z-10">
        <motion.div
          className={`
            w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm
            ${connected
              ? 'bg-emerald-100 border border-emerald-200'
              : 'bg-amber-100 border border-amber-200'
            }
          `}
          animate={connected ? {
            boxShadow: [
              '0 0 0px rgba(16,185,129,0.2)',
              '0 0 15px rgba(16,185,129,0.3)',
              '0 0 0px rgba(16,185,129,0.2)'
            ]
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <svg
            className={`w-7 h-7 ${connected ? 'text-emerald-600' : 'text-amber-600'}`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </motion.div>

        <div className="flex-1">
          <h3 className={`text-lg font-semibold ${connected ? 'text-emerald-800' : 'text-amber-800'}`}>
            {connected ? 'WhatsApp Conectado' : 'WhatsApp No Conectado'}
          </h3>
          {connected ? (
            <div className="mt-1 space-y-0.5">
              {businessName && (
                <p className="text-gray-800 font-medium">{businessName}</p>
              )}
              {phoneNumber && (
                <p className="text-gray-600 text-sm font-mono">{phoneNumber}</p>
              )}
            </div>
          ) : (
            <p className="text-amber-700 mt-1">
              Conecta tu cuenta de WhatsApp Business para empezar a recibir mensajes.
            </p>
          )}
        </div>

        {connected ? (
          <div className="flex items-center gap-2">
            <motion.span
              className="relative flex h-3 w-3"
              animate={{
                scale: [1, 1.2, 1]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40 animate-ping" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </motion.span>
            <span className="text-sm text-emerald-700 font-medium">Activo</span>
          </div>
        ) : (
          <Link
            href="/loomi/dashboard/connect"
            className="group flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-colors"
          >
            Conectar
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>
    </motion.div>
  );
}
