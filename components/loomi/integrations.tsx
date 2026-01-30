'use client';

import { motion } from 'framer-motion';

const INTEGRATIONS = [
  {
    name: 'WhatsApp',
    logo: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
    color: '#25D366',
  },
  {
    name: 'Claude',
    logo: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
      </svg>
    ),
    color: '#D97706',
  },
  {
    name: 'Cal.com',
    logo: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/>
      </svg>
    ),
    color: '#FFFFFF',
  },
  {
    name: 'HubSpot',
    logo: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M18.164 7.93V5.084a2.198 2.198 0 001.267-1.984v-.066A2.198 2.198 0 0017.235.838h-.066a2.198 2.198 0 00-2.196 2.196v.066c0 .907.55 1.685 1.334 2.022v2.808a5.849 5.849 0 00-2.529 1.106l-6.73-5.236a2.75 2.75 0 00.096-.678A2.751 2.751 0 104.5 5.873a2.75 2.75 0 00.678-.096l6.73 5.236a5.848 5.848 0 00-1.106 3.43 5.848 5.848 0 001.106 3.43l-2.084 1.622a2.198 2.198 0 00-1.985-1.267h-.066a2.198 2.198 0 00-2.196 2.196v.066a2.198 2.198 0 002.196 2.196h.066a2.198 2.198 0 002.157-1.752l2.121-1.65a5.848 5.848 0 003.43 1.106 5.878 5.878 0 100-11.756 5.848 5.848 0 00-2.383.508zm-.717 8.475a3.049 3.049 0 110-6.098 3.049 3.049 0 010 6.098z"/>
      </svg>
    ),
    color: '#FF7A59',
  },
  {
    name: 'Supabase',
    logo: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M11.9 1.036c-.015-.986-1.26-1.41-1.874-.637L.764 12.05C-.33 13.427.65 15.455 2.409 15.455h9.579l.113 7.51c.014.985 1.259 1.408 1.873.636l9.262-11.653c1.093-1.375.113-3.403-1.645-3.403h-9.642l-.001-7.509z"/>
      </svg>
    ),
    color: '#3ECF8E',
  },
  {
    name: 'Vercel',
    logo: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M24 22.525H0l12-21.05 12 21.05z"/>
      </svg>
    ),
    color: '#FFFFFF',
  },
  {
    name: 'Stripe',
    logo: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
      </svg>
    ),
    color: '#635BFF',
  },
  {
    name: 'Slack',
    logo: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 01-2.523 2.521 2.527 2.527 0 01-2.52-2.521V2.522A2.527 2.527 0 0115.165 0a2.528 2.528 0 012.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 012.523 2.522A2.528 2.528 0 0115.165 24a2.527 2.527 0 01-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 01-2.52-2.523 2.526 2.526 0 012.52-2.52h6.313A2.527 2.527 0 0124 15.165a2.528 2.528 0 01-2.522 2.523h-6.313z"/>
      </svg>
    ),
    color: '#E01E5A',
  },
];

export function Integrations() {
  return (
    <section className="py-20 sm:py-24 px-4 sm:px-6 relative overflow-hidden">
      {/* Background line */}
      <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent" />

      <div className="relative max-w-6xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-gray-500 text-sm uppercase tracking-wider mb-12"
        >
          Se integra con tu stack
        </motion.p>

        {/* Logos grid */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-8 sm:gap-6">
          {INTEGRATIONS.map((integration, index) => (
            <motion.div
              key={integration.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.15, y: -5 }}
              className="flex flex-col items-center gap-3 group cursor-pointer"
            >
              <div
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gray-900/50 border border-gray-800 flex items-center justify-center text-gray-500 group-hover:text-white group-hover:border-gray-700 transition-all duration-300"
                style={{
                  '--hover-color': integration.color,
                } as React.CSSProperties}
              >
                <motion.div
                  className="group-hover:drop-shadow-lg"
                  style={{
                    filter: 'grayscale(100%)',
                  }}
                  whileHover={{
                    filter: 'grayscale(0%)',
                    color: integration.color,
                  }}
                >
                  {integration.logo}
                </motion.div>
              </div>
              <span className="text-xs text-gray-600 group-hover:text-gray-400 transition-colors">
                {integration.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
