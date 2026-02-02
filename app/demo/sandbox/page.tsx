import { Metadata } from 'next';
import { SandboxChat } from './SandboxChat';

export const metadata: Metadata = {
  title: 'Sandbox Demo | Loomi AI',
  description: 'Prueba el agente de Loomi AI en tiempo real sin necesidad de WhatsApp'
};

export default function SandboxPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Sandbox Demo</h1>
              <p className="text-xs text-white/60">Prueba el agente en tiempo real</p>
            </div>
          </div>
          <a
            href="/"
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            ← Volver al inicio
          </a>
        </div>
      </header>

      {/* Chat Container */}
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/30 shadow-2xl backdrop-blur-xl">
          <SandboxChat />
        </div>
      </div>
    </main>
  );
}
