'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, clearToken, getToken } from '@/lib/api';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    api('/auth/me')
      .then((r) => {
        if (r.user.role !== 'ADMIN') {
          router.replace('/dashboard');
          return;
        }
        setUser(r.user);
      })
      .catch(() => {
        clearToken();
        router.replace('/login');
      })
      .finally(() => setLoading(false));
  }, [router]);

  function logout() {
    clearToken();
    router.replace('/login');
  }

  if (loading) return <div className="p-10 text-center text-slate-500">Cargando…</div>;
  if (!user) return null;

  const links = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/tramites', label: 'Trámites' },
    { href: '/admin/tramites?estado=PENDIENTE', label: '› Pendientes' },
    { href: '/admin/tramites?estado=APROBADO', label: '› Aprobados' },
  ];

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-slate-900 text-slate-100 p-5 flex flex-col">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <div className="h-8 w-8 rounded-md bg-white text-brand-700 grid place-items-center font-bold">C</div>
          <span className="font-semibold">CONTIA · Admin</span>
        </Link>
        <nav className="flex flex-col gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-md px-3 py-2 text-sm ${
                pathname === l.href.split('?')[0]
                  ? 'bg-slate-800 text-white font-medium'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-6 border-t border-slate-800 text-sm">
          <p className="font-medium">{user.nombre}</p>
          <p className="text-slate-400 text-xs truncate">{user.email}</p>
          <button onClick={logout} className="mt-3 text-sm text-red-400 hover:underline">
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 bg-slate-50">{children}</main>
    </div>
  );
}
