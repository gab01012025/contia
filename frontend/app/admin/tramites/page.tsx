'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

const ESTADO_BADGE: Record<string, string> = {
  PENDIENTE: 'badge-pending',
  EN_REVISION: 'badge-review',
  APROBADO: 'badge-approved',
  DEVUELTO: 'badge-returned',
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
    <div>
      <h1 className="text-2xl font-bold mb-6">
        Trámites {estado ? <span className="text-slate-500 text-base">/ {estado}</span> : null}
      </h1>
      {loading ? (
        <p className="text-slate-500">Cargando…</p>
      ) : tramites.length === 0 ? (
        <p className="text-slate-500">No hay trámites con este filtro.</p>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="text-left p-4">Usuario</th>
                <th className="text-left p-4">Tipo</th>
                <th className="text-left p-4">Estado</th>
                <th className="text-left p-4">Creado</th>
                <th className="text-left p-4"></th>
              </tr>
            </thead>
            <tbody>
              {tramites.map((t) => (
                <tr key={t.id} className="border-t border-slate-200">
                  <td className="p-4">
                    <div className="font-medium">{t.user.nombre}</div>
                    <div className="text-xs text-slate-500">{t.user.email}</div>
                  </td>
                  <td className="p-4">{t.tipo.replace(/_/g, ' ').toLowerCase()}</td>
                  <td className="p-4">
                    <span className={ESTADO_BADGE[t.estado]}>{t.estado.replace('_', ' ')}</span>
                  </td>
                  <td className="p-4 text-slate-500">{new Date(t.createdAt).toLocaleString()}</td>
                  <td className="p-4 text-right">
                    <Link href={`/admin/tramites/${t.id}`} className="text-brand-700 hover:underline">Revisar</Link>
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
