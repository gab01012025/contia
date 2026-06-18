'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, clearToken, getToken } from '@/lib/api';
import { LayoutDashboard, FileText, Clock, CheckCircle, LogOut, Loader2 } from 'lucide-react';

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

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-400" />
      </div>
    );
  if (!user) return null;

  const links = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/tramites', label: 'Trámites', icon: FileText },
    { href: '/admin/tramites?estado=PENDIENTE', label: 'Pendientes', icon: Clock, indent: true },
    { href: '/admin/tramites?estado=APROBADO', label: 'Aprobados', icon: CheckCircle, indent: true },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Admin sidebar — dark theme */}
      <aside className="w-64 bg-gradient-dark text-slate-100 flex flex-col">
        {/* Logo */}
        <div className="px-5 pt-6 pb-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-lg bg-white/10 backdrop-blur-sm text-white grid place-items-center font-bold text-sm border border-white/10 group-hover:bg-white/20 transition-colors">
              C
            </div>
            <div>
              <span className="font-semibold text-white tracking-tight">CONTIA</span>
              <p className="text-[10px] text-brand-300 -mt-0.5 tracking-wide">ADMINISTRADOR</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 mt-2">
          <div className="flex flex-col gap-0.5">
            {links.map((l) => {
              const active = pathname === l.href.split('?')[0];
              const Icon = l.icon;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150 ${
                    (l as any).indent ? 'ml-4' : ''
                  } ${
                    active
                      ? 'bg-white/10 text-white font-medium backdrop-blur-sm'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className={`h-[18px] w-[18px] ${active ? 'text-brand-300' : 'text-slate-500'}`} />
                  {l.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User section */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-brand-500/30 text-brand-200 grid place-items-center text-xs font-medium shrink-0 border border-brand-400/20">
              {(user.nombre || user.email)?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{user.nombre || 'Admin'}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-3 flex items-center gap-2 text-sm text-slate-400 hover:text-red-300 transition-colors w-full"
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
