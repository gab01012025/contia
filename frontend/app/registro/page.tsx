'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, setToken } from '@/lib/api';

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
    <main className="min-h-screen grid place-items-center px-4 py-10">
      <div className="card w-full max-w-md">
        <h1 className="text-xl font-bold mb-1">Crear cuenta</h1>
        <p className="text-sm text-slate-500 mb-6">Empieza a generar tus trámites.</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">Nombre completo</label>
            <input className="input" required value={form.nombre} onChange={(e) => update('nombre', e.target.value)} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} />
          </div>
          <div>
            <label className="label">Contraseña</label>
            <input className="input" type="password" required minLength={6} value={form.password} onChange={(e) => update('password', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Cédula</label>
              <input className="input" value={form.cedula} onChange={(e) => update('cedula', e.target.value)} />
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input className="input" value={form.telefono} onChange={(e) => update('telefono', e.target.value)} />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? 'Creando…' : 'Crear cuenta'}
          </button>
        </form>
        <p className="mt-6 text-sm text-slate-600">
          ¿Ya tienes cuenta? <Link href="/login" className="text-brand-700 hover:underline">Ingresar</Link>
        </p>
      </div>
    </main>
  );
}
