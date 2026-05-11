'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, setToken } from '@/lib/api';

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
    <main className="min-h-screen grid place-items-center px-4">
      <div className="card w-full max-w-md">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-8 w-8 rounded-md bg-brand-600 text-white grid place-items-center font-bold">C</div>
          <span className="font-semibold">CONTIA</span>
        </div>
        <h1 className="text-xl font-bold mb-1">Iniciar sesión</h1>
        <p className="text-sm text-slate-500 mb-6">Bienvenido de vuelta.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">Contraseña</label>
            <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-600">
          ¿No tienes cuenta? <Link href="/registro" className="text-brand-700 hover:underline">Crear una</Link>
        </p>
      </div>
    </main>
  );
}
