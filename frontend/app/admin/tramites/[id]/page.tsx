'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import PrestacionesResumen from '@/components/PrestacionesResumen';
import IVAResumen from '@/components/IVAResumen';
import { ArrowLeft, CheckCircle, RotateCcw, Download, Loader2, Clock, History } from 'lucide-react';
import Link from 'next/link';

const TIPO_LABEL: Record<string, string> = {
  CERTIFICACION_INGRESOS: 'Certificación de ingresos',
  BALANCE_PERSONAL:       'Balance personal',
  IVA:                    'IVA',
  PRESTACIONES_SOCIALES:  'Prestaciones sociales',
};

export default function TramiteDetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [tramite, setTramite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [obs, setObs] = useState('');
  const [acting, setActing] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  async function downloadPdf() {
    setPdfLoading(true);
    try {
      const token = localStorage.getItem('contia_token');
      const base  = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res   = await fetch(`${base}/api/admin/tramites/${params.id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || 'Error generando PDF');
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `contia-${tramite?.tipo?.toLowerCase() || 'documento'}-${params.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e.message || 'No se pudo generar el PDF.');
    } finally {
      setPdfLoading(false);
    }
  }

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

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-brand-400" />
      </div>
    );
  if (!tramite) return <p className="text-slate-500">No encontrado</p>;

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      {/* Breadcrumb */}
      <Link href="/admin/tramites" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Trámites
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight capitalize">
          {TIPO_LABEL[tramite.tipo] || tramite.tipo.replace(/_/g, ' ').toLowerCase()}
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Solicitado por <span className="text-slate-200 font-medium">{tramite.user.nombre}</span>{' '}
          <span className="text-slate-500">({tramite.user.email})</span>
        </p>
      </div>

      {/* Datos y cálculos */}
      {(tramite.tipo === 'PRESTACIONES_SOCIALES' || tramite.tipo === 'IVA') ? (
        <div className="card">
          <h2 className="font-semibold text-slate-900 mb-4">Datos y cálculos</h2>
          {tramite.tipo === 'PRESTACIONES_SOCIALES' && <PrestacionesResumen datos={tramite.datos} calculos={tramite.calculos} />}
          {tramite.tipo === 'IVA' && <IVAResumen datos={tramite.datos} calculos={tramite.calculos} />}
        </div>
      ) : (
        <>
          <div className="card">
            <h2 className="font-semibold text-slate-900 mb-3">Datos del formulario</h2>
            <pre className="text-xs bg-slate-50 p-4 rounded-lg overflow-x-auto border border-slate-100">
              {JSON.stringify(tramite.datos, null, 2)}
            </pre>
          </div>
          {tramite.calculos && (
            <div className="card">
              <h2 className="font-semibold text-slate-900 mb-3">Cálculos automáticos</h2>
              <pre className="text-xs bg-slate-50 p-4 rounded-lg overflow-x-auto border border-slate-100">
                {JSON.stringify(tramite.calculos, null, 2)}
              </pre>
            </div>
          )}
        </>
      )}

      {/* Observaciones previas */}
      {tramite.observaciones?.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-slate-900 mb-3">Observaciones previas</h2>
          <ul className="space-y-3">
            {tramite.observaciones.map((o: any) => (
              <li key={o.id} className="text-sm border-l-2 border-amber-400 pl-3 py-1">
                <p className="text-slate-700">{o.texto}</p>
                <p className="text-xs text-slate-400 mt-1">
                  — {o.autor?.nombre} · {new Date(o.createdAt).toLocaleString('es-VE')}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Decisión profesional */}
      {(tramite.estado === 'PENDIENTE' || tramite.estado === 'EN_REVISION') && (
        <div className="card border-brand-200">
          <h2 className="font-semibold text-slate-900 mb-3">Decisión profesional</h2>
          <textarea
            className="input min-h-[100px] resize-y"
            placeholder="Escribe observaciones aquí (obligatorio si vas a devolver)…"
            value={obs}
            onChange={(e) => setObs(e.target.value)}
          />
          <div className="flex gap-3 mt-4">
            <button onClick={aprobar} disabled={acting} className="btn-primary">
              {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Aprobar
            </button>
            <button onClick={devolver} disabled={acting} className="btn-danger">
              {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              Devolver con observaciones
            </button>
          </div>
        </div>
      )}

      {/* Descargar PDF */}
      {(tramite.tipo === 'CERTIFICACION_INGRESOS' || tramite.tipo === 'BALANCE_PERSONAL') && (
        <div className="card bg-emerald-50 border-emerald-200">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-emerald-100 text-emerald-600 grid place-items-center shrink-0 ring-1 ring-emerald-200">
              <Download className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-emerald-900">Documento PDF</h3>
              <p className="text-sm text-emerald-700 mt-0.5">
                {tramite.estado === 'APROBADO'
                  ? 'Descarga el PDF oficial para firmar y enviar al cliente.'
                  : 'Vista previa del PDF con los datos actuales (sin firma).'}
              </p>
            </div>
            <button
              onClick={downloadPdf}
              disabled={pdfLoading}
              className="btn bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm shrink-0"
            >
              {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {pdfLoading ? 'Generando…' : 'Descargar PDF'}
            </button>
          </div>
        </div>
      )}

      {/* Auditoría */}
      {tramite.auditoria?.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <History className="h-4 w-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Auditoría</h2>
          </div>
          <ul className="text-sm space-y-2">
            {tramite.auditoria?.map((a: any) => (
              <li key={a.id} className="flex items-start gap-3 text-slate-600">
                <Clock className="h-3.5 w-3.5 text-slate-300 mt-0.5 shrink-0" />
                <div>
                  <span className="text-slate-400 text-xs">{new Date(a.createdAt).toLocaleString('es-VE')}</span>
                  <span className="mx-1.5 text-slate-300">—</span>
                  {a.accion}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
