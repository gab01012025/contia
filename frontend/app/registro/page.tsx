'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, setToken } from '@/lib/api';
import { Loader2, ArrowRight } from 'lucide-react';

export default function RegistroPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nombre: '', email: '', password: '', cedula: '', telefono: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(k: K, v: string) {
    setForm({ ...form, [k]: v });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const r = await api('/auth/register', { method: 'POST', body: JSON.stringify(form) });
      setToken(r.token);
      router.push('/dashboard');
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
        <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] bg-brand-400/20 rounded-full blur-[120px]" />
        <div className="relative text-center px-12">
          <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-sm text-white grid place-items-center font-bold text-2xl border border-white/10 mx-auto mb-6">
            C
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">CONTIA</h2>
          <p className="mt-3 text-brand-200 text-lg max-w-sm mx-auto">
            Empieza a generar tus trámites contables en minutos
          </p>
        </div>
      </div>

      {/* Right — Register form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="h-9 w-9 rounded-lg bg-gradient-brand text-white grid place-items-center font-bold text-sm">C</div>
            <span className="font-semibold text-slate-900">CONTIA</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Crear cuenta</h1>
          <p className="text-sm text-slate-500 mt-1 mb-8">Empieza a generar tus trámites.</p>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="label">Nombre completo</label>
              <input
                className="input"
                required
                placeholder="Juan Pérez"
                value={form.nombre}
                onChange={(e) => update('nombre', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                required
                placeholder="tu@email.com"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Contraseña</label>
              <input
                className="input"
                type="password"
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Cédula</label>
                <input
                  className="input"
                  placeholder="V-12345678"
                  value={form.cedula}
                  onChange={(e) => update('cedula', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Teléfono</label>
                <input
                  className="input"
                  placeholder="0412-1234567"
                  value={form.telefono}
                  onChange={(e) => update('telefono', e.target.value)}
                />
              </div>
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
                  Crear cuenta
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-sm text-slate-500 text-center">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-brand-600 font-medium hover:text-brand-700 transition-colors">
              Ingresar
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
