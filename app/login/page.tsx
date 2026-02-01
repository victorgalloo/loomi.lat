"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Zap, Sun, Moon, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const stored = localStorage.getItem('loomi-theme');
    if (stored) {
      setIsDark(stored === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    localStorage.setItem('loomi-theme', !isDark ? 'dark' : 'light');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
        router.push("/loomi/dashboard");
        router.refresh();
      }
    } catch {
      setError("Error inesperado");
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-black' : 'bg-zinc-50'}`}>
      {/* Background Grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: isDark
            ? 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)'
            : 'radial-gradient(rgba(0,0,0,0.03) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/loomi" className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-white' : 'bg-black'}`}>
              <Zap className={`w-4 h-4 ${isDark ? 'text-black' : 'text-white'}`} />
            </div>
            <span className={`font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Loomi</span>
          </Link>

          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'text-zinc-500 hover:text-white hover:bg-zinc-800' : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100'}`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              Iniciar sesión
            </h1>
            <p className={`mt-2 text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
              Accede a tu dashboard de Loomi
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className={`block text-xs font-medium mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                placeholder="tu@email.com"
                className={`
                  w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all duration-200
                  ${isDark
                    ? 'bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700'
                    : 'bg-white border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              />
            </div>

            {/* Password */}
            <div>
              <label className={`block text-xs font-medium mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                placeholder="••••••••"
                className={`
                  w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all duration-200
                  ${isDark
                    ? 'bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700'
                    : 'bg-white border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              />
            </div>

            {/* Error */}
            {error && (
              <div
                className={`
                  p-3 rounded-lg text-sm
                  ${isDark ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-600 border border-red-200'}
                `}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={`
                w-full py-2.5 rounded-lg text-sm font-medium
                transition-colors duration-150 flex items-center justify-center gap-2
                disabled:opacity-50 disabled:cursor-not-allowed
                ${isDark
                  ? 'bg-white text-black hover:bg-zinc-200'
                  : 'bg-zinc-900 text-white hover:bg-zinc-800'
                }
              `}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Continuar
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className={`text-xs ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
              ¿No tienes cuenta?{' '}
              <Link
                href="/loomi"
                className={`font-medium transition-colors ${isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'}`}
              >
                Solicita acceso
              </Link>
            </p>
          </div>

          {/* Powered by */}
          <div className={`mt-12 pt-6 border-t text-center ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
            <p className={`text-xs ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
              Powered by{' '}
              <Link
                href="https://anthana.agency"
                target="_blank"
                className={`font-medium transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'}`}
              >
                anthana.agency
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
