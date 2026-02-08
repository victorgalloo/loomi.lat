"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Sun, Moon, ArrowRight, Loader2 } from "lucide-react";

type Mode = "login" | "signup";

function LoginContent() {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  const smartRedirect = async (userName?: string) => {
    try {
      const res = await fetch('/api/auth/setup-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: userName }),
      });

      if (!res.ok) {
        // If setup-tenant fails, go to onboarding (it also creates tenant)
        router.push('/onboarding');
        router.refresh();
        return;
      }

      const { onboardingComplete } = await res.json();

      if (!onboardingComplete) {
        router.push('/onboarding');
      } else {
        router.push('/dashboard');
      }
    } catch {
      // Fallback to onboarding instead of dashboard
      router.push('/onboarding');
    }
    router.refresh();
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
        await smartRedirect();
      }
    } catch {
      setError("Error inesperado");
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Create user via server-side admin API (auto-confirmed, no email rate limits)
      const signupRes = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          name: name.trim(),
        }),
      });

      const signupData = await signupRes.json();

      if (!signupRes.ok) {
        setError(signupData.error || "Error al crear cuenta");
        setIsLoading(false);
        return;
      }

      // User created and confirmed, now sign in
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (loginError) {
        setError("Cuenta creada pero error al iniciar sesión. Intenta hacer login.");
        setIsLoading(false);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
      await smartRedirect(name.trim());
    } catch {
      setError("Error inesperado");
      setIsLoading(false);
    }
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Background Grid */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
      </div>

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
            className="p-2 rounded-full text-muted hover:text-foreground hover:bg-surface transition-colors"
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
              {mode === "login" ? "login_" : "signup_"}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {mode === "login"
                ? "Accede a tu dashboard"
                : "Crea tu cuenta y conecta tu agente"}
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="flex mb-6 bg-surface border border-border rounded-xl p-1 shadow-subtle">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`flex-1 py-2 text-sm font-mono rounded-md transition-colors ${
                mode === "login"
                  ? "bg-foreground text-background"
                  : "text-muted hover:text-foreground"
              }`}
            >
              ./login
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`flex-1 py-2 text-sm font-mono rounded-md transition-colors ${
                mode === "signup"
                  ? "bg-foreground text-background"
                  : "text-muted hover:text-foreground"
              }`}
            >
              ./signup
            </button>
          </div>

          {/* Form */}
          <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block text-label font-medium mb-2.5 text-muted">
                  nombre
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="Tu nombre o empresa"
                  className="w-full px-3.5 py-3 rounded-xl text-sm outline-none transition-all duration-200 bg-surface border border-border text-foreground placeholder:text-muted focus:border-foreground/30 disabled:opacity-50 disabled:cursor-not-allowed shadow-subtle focus:ring-2 focus:ring-info/30"
                />
              </div>
            )}

            <div>
              <label className="block text-label font-medium mb-2.5 text-muted">
                email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                placeholder="tu@email.com"
                className="w-full px-3.5 py-3 rounded-xl text-sm outline-none transition-all duration-200 bg-surface border border-border text-foreground placeholder:text-muted focus:border-foreground/30 disabled:opacity-50 disabled:cursor-not-allowed shadow-subtle focus:ring-2 focus:ring-info/30"
              />
            </div>

            <div>
              <label className="block text-label font-medium mb-2.5 text-muted">
                password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                placeholder="••••••••"
                minLength={6}
                className="w-full px-3.5 py-3 rounded-xl text-sm outline-none transition-all duration-200 bg-surface border border-border text-foreground placeholder:text-muted focus:border-foreground/30 disabled:opacity-50 disabled:cursor-not-allowed shadow-subtle focus:ring-2 focus:ring-info/30"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl text-sm bg-terminal-red/10 text-terminal-red border border-terminal-red/20">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-foreground text-background hover:bg-foreground/90"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {mode === "login" ? "./continuar" : "./crear_cuenta"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch mode link */}
          <div className="mt-8 text-center">
            <p className="text-xs text-muted">
              {mode === "login" ? (
                <>
                  ¿No tienes cuenta?{' '}
                  <button
                    onClick={() => switchMode("signup")}
                    className="text-info hover:underline"
                  >
                    regístrate
                  </button>
                </>
              ) : (
                <>
                  ¿Ya tienes cuenta?{' '}
                  <button
                    onClick={() => switchMode("login")}
                    className="text-info hover:underline"
                  >
                    inicia sesión
                  </button>
                </>
              )}
            </p>
          </div>

          {/* Powered by */}
          <div className="mt-12 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted">
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
