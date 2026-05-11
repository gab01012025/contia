'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api('/admin/dashboard').then(setStats).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      {!stats ? (
        <p className="text-slate-500">Cargando…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          <Stat label="Pendientes" value={stats.pendientes} accent="amber" />
          <Stat label="En revisión" value={stats.enRevision} accent="blue" />
          <Stat label="Aprobados" value={stats.aprobados} accent="emerald" />
          <Stat label="Devueltos" value={stats.devueltos} accent="red" />
        </div>
      )}
      <div className="mt-8">
        <Link href="/admin/tramites" className="btn-primary">Ver todos los trámites</Link>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent: string }) {
  const colors: Record<string, string> = {
    amber: 'text-amber-700 bg-amber-50',
    blue: 'text-blue-700 bg-blue-50',
    emerald: 'text-emerald-700 bg-emerald-50',
    red: 'text-red-700 bg-red-50',
  };
  return (
    <div className="card">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${colors[accent]?.split(' ')[0] || ''}`}>{value}</p>
    </div>
  );
}
