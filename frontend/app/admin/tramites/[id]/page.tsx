'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function TramiteDetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [tramite, setTramite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [obs, setObs] = useState('');
  const [acting, setActing] = useState(false);

  function load() {
    setLoading(true);
    api(`/admin/tramites/${params.id}`)
      .then((r) => setTramite(r.tramite))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function aprobar() {
    setActing(true);
    try {
      await api(`/admin/tramites/${params.id}/aprobar`, { method: 'POST' });
      router.push('/admin/tramites');
    } finally { setActing(false); }
  }

  async function devolver() {
    if (obs.trim().length < 3) {
      alert('Escribe la observación antes de devolver.');
      return;
    }
    setActing(true);
    try {
      await api(`/admin/tramites/${params.id}/devolver`, {
        method: 'POST',
        body: JSON.stringify({ observacion: obs }),
      });
      router.push('/admin/tramites');
    } finally { setActing(false); }
  }

  if (loading) return <p className="text-slate-500">Cargando…</p>;
  if (!tramite) return <p>No encontrado</p>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">{tramite.tipo.replace(/_/g, ' ').toLowerCase()}</h1>
        <p className="text-sm text-slate-500">
          Solicitado por <b>{tramite.user.nombre}</b> ({tramite.user.email})
        </p>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3">Datos del formulario</h2>
        <pre className="text-xs bg-slate-50 p-4 rounded overflow-x-auto">
          {JSON.stringify(tramite.datos, null, 2)}
        </pre>
      </div>

      {tramite.calculos && (
        <div className="card">
          <h2 className="font-semibold mb-3">Cálculos automáticos</h2>
          <pre className="text-xs bg-slate-50 p-4 rounded overflow-x-auto">
            {JSON.stringify(tramite.calculos, null, 2)}
          </pre>
        </div>
      )}

      {tramite.observaciones?.length > 0 && (
        <div className="card">
          <h2 className="font-semibold mb-3">Observaciones previas</h2>
          <ul className="space-y-2">
            {tramite.observaciones.map((o: any) => (
              <li key={o.id} className="text-sm border-l-2 border-amber-400 pl-3">
                <p>{o.texto}</p>
                <p className="text-xs text-slate-500">
                  — {o.autor?.nombre} · {new Date(o.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(tramite.estado === 'PENDIENTE' || tramite.estado === 'EN_REVISION') && (
        <div className="card border-brand-200">
          <h2 className="font-semibold mb-3">Decisión profesional</h2>
          <textarea
            className="input min-h-[100px]"
            placeholder="Escribe observaciones aquí (obligatorio si vas a devolver)…"
            value={obs}
            onChange={(e) => setObs(e.target.value)}
          />
          <div className="flex gap-3 mt-4">
            <button onClick={aprobar} disabled={acting} className="btn-primary">
              ✓ Aprobar
            </button>
            <button onClick={devolver} disabled={acting} className="btn-danger">
              ↩ Devolver con observaciones
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="font-semibold mb-3">Auditoría</h2>
        <ul className="text-sm space-y-1">
          {tramite.auditoria?.map((a: any) => (
            <li key={a.id} className="text-slate-600">
              <span className="text-slate-400">{new Date(a.createdAt).toLocaleString()}</span> — {a.accion}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
