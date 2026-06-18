'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Clock, Search, CheckCircle, RotateCcw, ArrowRight, Loader2 } from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api('/admin/dashboard').then(setStats).catch(() => {});
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Vista general del sistema</p>
      </div>

      {!stats ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-brand-400" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              label="Pendientes"
              value={stats.pendientes}
              icon={Clock}
              color="amber"
            />
            <StatCard
              label="En revisión"
              value={stats.enRevision}
              icon={Search}
              color="blue"
            />
            <StatCard
              label="Aprobados"
              value={stats.aprobados}
              icon={CheckCircle}
              color="emerald"
            />
            <StatCard
              label="Devueltos"
              value={stats.devueltos}
              icon={RotateCcw}
              color="red"
            />
          </div>

          <div className="mt-8">
            <Link href="/admin/tramites" className="btn-primary">
              Ver todos los trámites
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

const colorConfig: Record<string, { iconBg: string; iconText: string; valueBg: string; valueText: string; ring: string }> = {
  amber:   { iconBg: 'bg-amber-50',   iconText: 'text-amber-600',   valueBg: 'bg-amber-50',   valueText: 'text-amber-700',   ring: 'ring-amber-100' },
  blue:    { iconBg: 'bg-blue-50',     iconText: 'text-blue-600',    valueBg: 'bg-blue-50',     valueText: 'text-blue-700',    ring: 'ring-blue-100' },
  emerald: { iconBg: 'bg-emerald-50',  iconText: 'text-emerald-600', valueBg: 'bg-emerald-50',  valueText: 'text-emerald-700', ring: 'ring-emerald-100' },
  red:     { iconBg: 'bg-red-50',      iconText: 'text-red-600',     valueBg: 'bg-red-50',      valueText: 'text-red-700',     ring: 'ring-red-100' },
};

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: number; icon: React.ElementType; color: string;
}) {
  const c = colorConfig[color] || colorConfig.blue;
  return (
    <div className="card group animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className={`h-8 w-8 rounded-lg ${c.iconBg} ${c.iconText} grid place-items-center ring-1 ${c.ring}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className={`text-3xl font-bold ${c.valueText} tracking-tight`}>{value}</p>
    </div>
  );
}
