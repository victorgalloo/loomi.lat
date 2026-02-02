"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Sun, Moon, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'access'>('login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const stored = localStorage.getItem('loomi-theme');
    if (stored) {
      document.documentElement.setAttribute('data-theme', stored);
    }
  }, []);

  const toggleTheme = () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('loomi-theme', next);
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        let errorMessage = "Error al iniciar sesión";

        if (signInError.message === "Invalid login credentials") {
          errorMessage = "Credenciales inválidas";
        } else if (signInError.message?.includes("Email not confirmed")) {
          errorMessage = "Confirma tu email primero";
        }

        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      if (data.user) {
        await new Promise(resolve => setTimeout(resolve, 100));
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Error inesperado");
      setIsLoading(false);
    }
  };

  const handleAccessRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Store demo user info in sessionStorage for sandbox
    sessionStorage.setItem('sandbox_user', JSON.stringify({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
    }));

    // Small delay for UX
    await new Promise(resolve => setTimeout(resolve, 500));

    router.push("/demo/sandbox");
  };

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
            className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-colors"
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
              {mode === 'login' ? 'login_' : 'demo_'}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {mode === 'login' ? 'Accede a tu dashboard' : 'Prueba el agente en vivo'}
            </p>
          </div>

          {mode === 'login' ? (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-4">
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
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all duration-200 bg-surface border border-border text-foreground placeholder:text-muted focus:border-foreground/30 disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-2 text-muted font-mono">
                  password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all duration-200 bg-surface border border-border text-foreground placeholder:text-muted focus:border-foreground/30 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg text-sm bg-terminal-red/10 text-terminal-red border border-terminal-red/20 font-mono">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-foreground text-background hover:bg-foreground/90 font-mono"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    ./continuar
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Access Request Form */
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
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all duration-200 bg-surface border border-border text-foreground placeholder:text-muted focus:border-foreground/30 disabled:opacity-50 disabled:cursor-not-allowed font-mono"
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
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all duration-200 bg-surface border border-border text-foreground placeholder:text-muted focus:border-foreground/30 disabled:opacity-50 disabled:cursor-not-allowed font-mono"
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
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all duration-200 bg-surface border border-border text-foreground placeholder:text-muted focus:border-foreground/30 disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg text-sm bg-terminal-red/10 text-terminal-red border border-terminal-red/20 font-mono">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-terminal-green text-background hover:bg-terminal-green/90 font-mono"
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
          )}

          {/* Toggle Mode */}
          <div className="mt-8 text-center">
            <p className="text-xs text-muted font-mono">
              {mode === 'login' ? (
                <>
                  ¿No tienes cuenta?{' '}
                  <button
                    onClick={() => setMode('access')}
                    className="text-foreground hover:underline"
                  >
                    solicita acceso
                  </button>
                </>
              ) : (
                <>
                  ¿Ya tienes cuenta?{' '}
                  <button
                    onClick={() => setMode('login')}
                    className="text-foreground hover:underline"
                  >
                    iniciar sesión
                  </button>
                </>
              )}
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
