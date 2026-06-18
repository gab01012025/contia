'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { PlusCircle, FileText, ChevronRight, Loader2, FolderOpen } from 'lucide-react';

const TIPO_LABEL: Record<string, string> = {
  CERTIFICACION_INGRESOS: 'Certificación de ingresos',
  BALANCE_PERSONAL: 'Balance personal',
  IVA: 'IVA',
  PRESTACIONES_SOCIALES: 'Prestaciones sociales',
};

const TIPO_ICON_COLOR: Record<string, string> = {
  CERTIFICACION_INGRESOS: 'bg-blue-50 text-blue-600',
  BALANCE_PERSONAL: 'bg-violet-50 text-violet-600',
  IVA: 'bg-emerald-50 text-emerald-600',
  PRESTACIONES_SOCIALES: 'bg-amber-50 text-amber-600',
};

const ESTADO_BADGE: Record<string, string> = {
  PENDIENTE: 'badge-pending',
  EN_REVISION: 'badge-review',
  APROBADO: 'badge-approved',
  DEVUELTO: 'badge-returned',
};

const ESTADO_LABEL: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  EN_REVISION: 'En revisión',
  APROBADO: 'Aprobado',
  DEVUELTO: 'Devuelto',
};

export default function DashboardPage() {
  const [tramites, setTramites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/tramites')
      .then((r) => setTramites(r.tramites))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mis trámites</h1>
          <p className="text-sm text-slate-500 mt-1">Gestiona tus documentos contables y laborales</p>
        </div>
        <Link href="/dashboard/nuevo" className="btn-primary">
          <PlusCircle className="h-4 w-4" />
          Nuevo trámite
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        </div>
      ) : tramites.length === 0 ? (
        <div className="card text-center py-16">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-slate-100 text-slate-400 grid place-items-center mb-4">
            <FolderOpen className="h-7 w-7" />
          </div>
          <p className="text-slate-600 font-medium">Aún no tienes trámites</p>
          <p className="text-sm text-slate-400 mt-1">Crea tu primer trámite para comenzar</p>
          <Link href="/dashboard/nuevo" className="btn-primary mt-6 inline-flex">
            <PlusCircle className="h-4 w-4" />
            Crear el primero
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {tramites.map((t, i) => (
            <Link
              key={t.id}
              href={`/dashboard/${t.id}`}
              className="card-hover flex items-center gap-4 p-4 group animate-slide-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className={`h-10 w-10 rounded-lg grid place-items-center shrink-0 ${TIPO_ICON_COLOR[t.tipo] || 'bg-slate-100 text-slate-500'}`}>
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900">{TIPO_LABEL[t.tipo] || t.tipo}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {new Date(t.createdAt).toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <span className={ESTADO_BADGE[t.estado]}>{ESTADO_LABEL[t.estado] || t.estado}</span>
              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
