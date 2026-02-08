'use client';

import { useState, useEffect } from 'react';
import { SandboxChat } from './SandboxChat';
import Link from 'next/link';
import { Sun, Moon, ArrowRight, Loader2 } from 'lucide-react';

export default function DemoPage() {
  const [hasAccess, setHasAccess] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('loomi-theme');
    if (stored) {
      document.documentElement.setAttribute('data-theme', stored);
    }

    // Check if user already has access
    const sandboxUser = sessionStorage.getItem('sandbox_user');
    if (sandboxUser) {
      setHasAccess(true);
    }
    setIsCheckingAccess(false);
  }, []);

  const toggleTheme = () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('loomi-theme', next);
  };

  const handleAccessRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    // Store demo user info in sessionStorage
    sessionStorage.setItem('sandbox_user', JSON.stringify({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
    }));

    // Small delay for UX
    await new Promise(resolve => setTimeout(resolve, 500));

    setHasAccess(true);
    setIsLoading(false);
  };

  if (isCheckingAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted" />
      </div>
    );
  }

  // Show access form if user doesn't have access yet
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background transition-colors duration-300">
        {/* Background Grid */}
        <div
          className="fixed inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: 'radial-gradient(var(--muted) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Top Bar */}
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-terminal-red" />
                <div className="w-3 h-3 rounded-full bg-terminal-yellow" />
                <div className="w-3 h-3 rounded-full bg-terminal-green" />
              </div>
              <span className="font-mono font-semibold text-foreground">loomi_</span>
            </Link>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface transition-colors"
            >
              <Sun className="w-4 h-4 hidden dark:block" />
              <Moon className="w-4 h-4 block dark:hidden" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="min-h-screen flex items-center justify-center px-6 py-20">
          <div className="w-full max-w-sm">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold text-foreground font-mono">
                demo_
              </h1>
              <p className="mt-2 text-sm text-muted">
                Prueba el agente en vivo
              </p>
            </div>

            {/* Access Request Form */}
            <form onSubmit={handleAccessRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-2 text-muted font-mono">
                  nombre
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="Tu nombre"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-200 bg-surface border border-border text-foreground placeholder:text-muted focus:border-foreground/30 disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-2 text-muted font-mono">
                  email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="tu@email.com"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-200 bg-surface border border-border text-foreground placeholder:text-muted focus:border-foreground/30 disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-2 text-muted font-mono">
                  teléfono
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="+52 55 1234 5678"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-200 bg-surface border border-border text-foreground placeholder:text-muted focus:border-foreground/30 disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-terminal-green text-background hover:bg-terminal-green/90 font-mono"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    ./probar-demo
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Link to Login */}
            <div className="mt-8 text-center">
              <p className="text-xs text-muted font-mono">
                ¿Ya tienes cuenta?{' '}
                <Link
                  href="/login"
                  className="text-foreground hover:underline"
                >
                  iniciar sesión
                </Link>
              </p>
            </div>

            {/* Powered by */}
            <div className="mt-12 pt-6 border-t border-border text-center">
              <p className="text-xs text-muted font-mono">
                powered by{' '}
                <Link
                  href="https://anthana.agency"
                  target="_blank"
                  className="text-foreground hover:underline"
                >
                  anthana
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show chat if user has access
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground">
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
              <h1 className="text-sm font-medium text-foreground">Loomi Demo</h1>
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
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
          <SandboxChat />
        </div>
      </div>
    </main>
  );
}
