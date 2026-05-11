'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

const TIPO_LABEL: Record<string, string> = {
  CERTIFICACION_INGRESOS: 'Certificación de ingresos',
  BALANCE_PERSONAL: 'Balance personal',
  IVA: 'IVA',
  PRESTACIONES_SOCIALES: 'Prestaciones sociales',
};

const ESTADO_BADGE: Record<string, string> = {
  PENDIENTE: 'badge-pending',
  EN_REVISION: 'badge-review',
  APROBADO: 'badge-approved',
  DEVUELTO: 'badge-returned',
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Mis trámites</h1>
        <Link href="/dashboard/nuevo" className="btn-primary">+ Nuevo trámite</Link>
      </div>
      {loading ? (
        <p className="text-slate-500">Cargando…</p>
      ) : tramites.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-slate-600">Aún no tienes trámites.</p>
          <Link href="/dashboard/nuevo" className="btn-primary mt-4 inline-block">Crear el primero</Link>
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="text-left p-4">Tipo</th>
                <th className="text-left p-4">Estado</th>
                <th className="text-left p-4">Creado</th>
                <th className="text-left p-4"></th>
              </tr>
            </thead>
            <tbody>
              {tramites.map((t) => (
                <tr key={t.id} className="border-t border-slate-200">
                  <td className="p-4">{TIPO_LABEL[t.tipo] || t.tipo}</td>
                  <td className="p-4">
                    <span className={ESTADO_BADGE[t.estado]}>{t.estado.replace('_', ' ')}</span>
                  </td>
                  <td className="p-4 text-slate-500">{new Date(t.createdAt).toLocaleString()}</td>
                  <td className="p-4 text-right">
                    <Link href={`/dashboard/${t.id}`} className="text-brand-700 hover:underline">Ver</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
