'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, setToken } from '@/lib/api';
import { Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const r = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      setToken(r.token);
      router.push(r.user.role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex">
      {/* Left — Branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-dark relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-mesh opacity-20" />
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-brand-500/20 rounded-full blur-[120px]" />
        <div className="relative text-center px-12">
          <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-sm text-white grid place-items-center font-bold text-2xl border border-white/10 mx-auto mb-6">
            C
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">CONTIA</h2>
          <p className="mt-3 text-brand-200 text-lg max-w-sm mx-auto">
            Trámites contables y laborales asistidos por inteligencia artificial
          </p>
        </div>
      </div>

      {/* Right — Login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="h-9 w-9 rounded-lg bg-gradient-brand text-white grid place-items-center font-bold text-sm">C</div>
            <span className="font-semibold text-slate-900">CONTIA</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Iniciar sesión</h1>
          <p className="text-sm text-slate-500 mt-1 mb-8">Bienvenido de vuelta. Ingresa tus datos para continuar.</p>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                required
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Contraseña</label>
              <input
                className="input"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
                {error}
              </div>
            )}

            <button className="btn-primary w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Ingresar
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-sm text-slate-500 text-center">
            ¿No tienes cuenta?{' '}
            <Link href="/registro" className="text-brand-600 font-medium hover:text-brand-700 transition-colors">
              Crear una
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
