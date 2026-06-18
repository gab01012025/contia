'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { FileText, ChevronRight, Loader2, FolderOpen } from 'lucide-react';

const TIPO_LABEL: Record<string, string> = {
  CERTIFICACION_INGRESOS: 'Cert. ingresos',
  BALANCE_PERSONAL: 'Balance personal',
  IVA: 'IVA',
  PRESTACIONES_SOCIALES: 'Prestaciones',
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

export default function AdminTramitesPage() {
  const sp = useSearchParams();
  const estado = sp.get('estado') || '';
  const [tramites, setTramites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const qs = estado ? `?estado=${estado}` : '';
    api(`/admin/tramites${qs}`)
      .then((r) => setTramites(r.tramites))
      .finally(() => setLoading(false));
  }, [estado]);

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Trámites
          {estado && <span className="text-slate-400 text-lg font-normal ml-2">/ {ESTADO_LABEL[estado] || estado}</span>}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {estado ? `Filtrado por estado: ${ESTADO_LABEL[estado] || estado}` : 'Todos los trámites del sistema'}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-brand-400" />
        </div>
      ) : tramites.length === 0 ? (
        <div className="card text-center py-16">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-slate-100 text-slate-400 grid place-items-center mb-4">
            <FolderOpen className="h-7 w-7" />
          </div>
          <p className="text-slate-600 font-medium">No hay trámites con este filtro</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tramites.map((t, i) => (
            <Link
              key={t.id}
              href={`/admin/tramites/${t.id}`}
              className="card-hover flex items-center gap-4 p-4 group animate-slide-up"
              style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'both' }}
            >
              <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-500 grid place-items-center shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-900">{t.user.nombre}</p>
                  <span className="text-xs text-slate-400">{t.user.email}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-500">{TIPO_LABEL[t.tipo] || t.tipo}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-xs text-slate-400">
                    {new Date(t.createdAt).toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
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
