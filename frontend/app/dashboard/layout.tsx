'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, clearToken, getToken } from '@/lib/api';
import { FileText, PlusCircle, LogOut, Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
      .then((r) => setUser(r.user))
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

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  if (!user) return null;

  const links = [
    { href: '/dashboard', label: 'Mis trámites', icon: FileText },
    { href: '/dashboard/nuevo', label: 'Nuevo trámite', icon: PlusCircle },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col">
        {/* Logo */}
        <div className="px-5 pt-6 pb-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-lg bg-gradient-brand text-white grid place-items-center font-bold text-sm shadow-sm group-hover:shadow-glow transition-shadow">
              C
            </div>
            <div>
              <span className="font-semibold text-slate-900 tracking-tight">CONTIA</span>
              <p className="text-[10px] text-slate-400 -mt-0.5 tracking-wide">PLATAFORMA IA</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 mt-2">
          <div className="flex flex-col gap-0.5">
            {links.map((l) => {
              const active = pathname === l.href;
              const Icon = l.icon;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150 ${
                    active
                      ? 'bg-brand-50 text-brand-700 font-medium shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`h-[18px] w-[18px] ${active ? 'text-brand-600' : 'text-slate-400'}`} />
                  {l.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User section */}
        <div className="px-4 py-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-brand text-white grid place-items-center text-xs font-medium shrink-0">
              {(user.nombre || user.email)?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 truncate">{user.nombre || 'Usuario'}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-3 flex items-center gap-2 text-sm text-slate-500 hover:text-red-600 transition-colors w-full"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-slate-50/50 min-h-screen">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
