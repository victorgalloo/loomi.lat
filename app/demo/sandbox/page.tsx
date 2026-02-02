import { Metadata } from 'next';
import { SandboxChat } from './SandboxChat';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sandbox Demo | Loomi AI',
  description: 'Prueba el agente de Loomi AI en tiempo real sin necesidad de WhatsApp'
};

export default function SandboxPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground">
              <svg
                className="h-5 w-5 text-background"
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
              <h1 className="text-sm font-medium text-foreground">Loomi Sandbox</h1>
              <p className="text-xs text-muted font-mono">agent testing environment</p>
            </div>
          </div>
          <Link
            href="/"
            className="text-xs text-muted hover:text-foreground transition-colors font-mono"
          >
            ← back
          </Link>
        </div>
      </header>

      {/* Chat Container */}
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
          <SandboxChat />
        </div>
      </div>
    </main>
  );
}
