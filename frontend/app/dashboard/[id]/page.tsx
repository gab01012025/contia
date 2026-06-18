'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import PrestacionesResumen from '@/components/PrestacionesResumen';
import IVAResumen from '@/components/IVAResumen';
import { ArrowLeft, Download, Loader2, AlertTriangle, Clock, CheckCircle } from 'lucide-react';

const TIPO_LABEL: Record<string, string> = {
  CERTIFICACION_INGRESOS: 'Certificación de ingresos',
  BALANCE_PERSONAL:       'Balance personal',
  IVA:                    'IVA',
  PRESTACIONES_SOCIALES:  'Prestaciones sociales',
};

const ESTADO_BADGE: Record<string, string> = {
  PENDIENTE:   'badge-pending',
  EN_REVISION: 'badge-review',
  APROBADO:    'badge-approved',
  DEVUELTO:    'badge-returned',
};

const ESTADO_LABEL: Record<string, string> = {
  PENDIENTE:   'Pendiente',
  EN_REVISION: 'En revisión',
  APROBADO:    'Aprobado',
  DEVUELTO:    'Devuelto con observaciones',
};

function fmt(n: number) {
  return n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('es-VE', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

// ── sub-componentes de resumen ───────────────────────────────────────────────

function CertificacionResumen({ datos, calculos }: { datos: any; calculos: any }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 text-sm">
        <div><span className="label">Cliente</span><p>{datos.nombreCliente}</p></div>
        <div><span className="label">Cédula</span><p>{datos.cedula}</p></div>
        <div><span className="label">Actividad</span><p>{datos.actividad}</p></div>
        <div><span className="label">Dirección</span><p>{datos.direccion}</p></div>
        <div><span className="label">Institución destinataria</span><p>{datos.nombreInstitucion}</p></div>
        <div><span className="label">Ciudad</span><p>{datos.ciudad}</p></div>
        <div><span className="label">Período</span>
          <p>{datos.periodoDesde && fmtDate(datos.periodoDesde)} — {datos.periodoHasta && fmtDate(datos.periodoHasta)}</p>
        </div>
      </div>

      {datos.ingresos?.length > 0 && (
        <div>
          <h3 className="font-medium text-slate-800 mb-2">Relación de ingresos</h3>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-3 font-medium text-slate-600">Concepto</th>
                  <th className="text-right p-3 font-medium text-slate-600">Monto (Bs.)</th>
                </tr>
              </thead>
              <tbody>
                {datos.ingresos.map((r: any, i: number) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="p-3">{r.concepto}</td>
                    <td className="p-3 text-right">{fmt(r.monto)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50">
                <tr className="border-t border-slate-200">
                  <td className="p-3 font-semibold">TOTAL INGRESOS</td>
                  <td className="p-3 font-semibold text-right">Bs. {fmt(calculos?.totalIngresos ?? 0)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {calculos && (
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 text-sm">
          <h3 className="font-semibold text-brand-900 mb-2">Cálculos</h3>
          <div className="space-y-1">
            <div className="flex justify-between"><span>Total ingresos</span><span className="font-medium">Bs. {fmt(calculos.totalIngresos)}</span></div>
            {calculos.totalEgresos > 0 && <>
              <div className="flex justify-between"><span>Total egresos</span><span className="font-medium">Bs. {fmt(calculos.totalEgresos)}</span></div>
              <div className="flex justify-between font-semibold border-t border-brand-200 pt-1"><span>Flujo neto</span><span>Bs. {fmt(calculos.flujoMensual)}</span></div>
            </>}
          </div>
        </div>
      )}
    </div>
  );
}

function BalanceResumen({ datos, calculos }: { datos: any; calculos: any }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 text-sm">
        <div><span className="label">Cliente</span><p>{datos.nombreCliente}</p></div>
        <div><span className="label">Cédula</span><p>{datos.cedula}</p></div>
        <div><span className="label">Actividad</span><p>{datos.actividad}</p></div>
        <div><span className="label">Dirección</span><p>{datos.direccion}</p></div>
        <div><span className="label">Institución destinataria</span><p>{datos.nombreInstitucion}</p></div>
        <div><span className="label">Fecha del balance</span><p>{datos.fechaBalance && fmtDate(datos.fechaBalance)}</p></div>
        <div><span className="label">Ciudad</span><p>{datos.ciudad}</p></div>
      </div>

      {calculos && (
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 text-sm">
          <h3 className="font-semibold text-brand-900 mb-3">Estado de situación financiera</h3>
          <div className="space-y-1">
            <div className="flex justify-between font-semibold border-t border-brand-200 pt-1"><span>TOTAL ACTIVOS</span><span>Bs. {fmt(calculos.totalActivos)}</span></div>
            <div className="flex justify-between text-slate-600 pt-2"><span>Total pasivos</span><span>Bs. {fmt(calculos.totalPasivos)}</span></div>
            <div className={`flex justify-between font-bold text-base border-t border-brand-300 pt-2 ${calculos.patrimonioNeto >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              <span>PATRIMONIO NETO</span>
              <span>Bs. {fmt(calculos.patrimonioNeto)}</span>
            </div>
          </div>
        </div>
      )}

      {datos.cajaYBancos?.length > 0 && (
        <div>
          <h3 className="font-medium text-slate-800 mb-2 text-sm">Caja y bancos</h3>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-2 font-medium text-slate-600">Banco</th>
                  <th className="text-left p-2 font-medium text-slate-600">N° cuenta</th>
                  <th className="text-right p-2 font-medium text-slate-600">Monto (Bs.)</th>
                </tr>
              </thead>
              <tbody>
                {datos.cajaYBancos.map((r: any, i: number) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="p-2">{r.banco}</td>
                    <td className="p-2 text-slate-500">{r.numeroCuenta}</td>
                    <td className="p-2 text-right">{fmt(r.monto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {datos.inmuebles?.length > 0 && (
        <div>
          <h3 className="font-medium text-slate-800 mb-2 text-sm">Inmuebles</h3>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-2 font-medium text-slate-600">Tipo</th>
                  <th className="text-left p-2 font-medium text-slate-600">Dirección</th>
                  <th className="text-right p-2 font-medium text-slate-600">Valor est. (Bs.)</th>
                </tr>
              </thead>
              <tbody>
                {datos.inmuebles.map((r: any, i: number) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="p-2">{r.tipo}</td>
                    <td className="p-2 text-slate-500">{r.direccion}</td>
                    <td className="p-2 text-right">{fmt(r.monto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── página principal ─────────────────────────────────────────────────────────

export default function TramiteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const [tramite, setTramite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    api(`/tramites/${id}`)
      .then(r => setTramite(r.tramite))
      .catch(() => router.replace('/dashboard'))
      .finally(() => setLoading(false));
  }, [id, router]);

  async function downloadPdf() {
    setPdfLoading(true);
    try {
      const token = localStorage.getItem('contia_token');
      const base  = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res   = await fetch(`${base}/api/tramites/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error generando PDF');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `contia-${tramite.tipo.toLowerCase()}-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e.message || 'No se pudo generar el PDF.');
    } finally {
      setPdfLoading(false);
    }
  }

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  if (!tramite) return null;

  const { datos, calculos, observaciones, estado, tipo, createdAt } = tramite;
  const isCert    = tipo === 'CERTIFICACION_INGRESOS';
  const isBalance = tipo === 'BALANCE_PERSONAL';
  const isPrest   = tipo === 'PRESTACIONES_SOCIALES';
  const isIVA     = tipo === 'IVA';
  const isApproved = estado === 'APROBADO';

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Breadcrumb */}
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" />
        Mis trámites
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{TIPO_LABEL[tipo] || tipo}</h1>
          <p className="text-slate-500 text-sm mt-1">Enviado el {fmtDate(createdAt)}</p>
        </div>
        <span className={ESTADO_BADGE[estado]}>{ESTADO_LABEL[estado]}</span>
      </div>

      {/* Observaciones si fue devuelto */}
      {estado === 'DEVUELTO' && observaciones?.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-2">Observaciones del contador</h3>
              <ul className="space-y-2">
                {observaciones.map((obs: any) => (
                  <li key={obs.id} className="text-sm text-amber-800">
                    <span className="font-medium">{obs.autor?.nombre}:</span> {obs.texto}
                    <span className="text-amber-600 text-xs ml-2">{fmtDate(obs.createdAt)}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={`/dashboard/nuevo/${tipo.toLowerCase()}`}
                className="btn-primary mt-4 inline-flex text-sm"
              >
                Corregir y reenviar
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Datos del trámite */}
      <div className="card mb-6">
        <h2 className="font-semibold text-slate-900 mb-4">Datos del trámite</h2>
        {isCert    && <CertificacionResumen datos={datos} calculos={calculos} />}
        {isBalance && <BalanceResumen       datos={datos} calculos={calculos} />}
        {isPrest   && <PrestacionesResumen  datos={datos} calculos={calculos} />}
        {isIVA     && <IVAResumen           datos={datos} calculos={calculos} />}
        {!isCert && !isBalance && !isPrest && !isIVA && (
          <pre className="text-xs text-slate-600 overflow-auto rounded-lg bg-slate-50 p-4">
            {JSON.stringify(datos, null, 2)}
          </pre>
        )}
      </div>

      {/* Descargar PDF — solo si aprobado */}
      {isApproved && (
        <div className="card bg-emerald-50 border-emerald-200">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-emerald-100 text-emerald-600 grid place-items-center shrink-0 ring-1 ring-emerald-200">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-emerald-900">Documento aprobado</h3>
              <p className="text-sm text-emerald-700 mt-0.5">
                Revisado y aprobado. Descarga el documento oficial.
              </p>
            </div>
            <button
              onClick={downloadPdf}
              disabled={pdfLoading}
              className="btn bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm shrink-0"
            >
              {pdfLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Descargar PDF
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Si está en revisión o pendiente */}
      {(estado === 'PENDIENTE' || estado === 'EN_REVISION') && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-blue-600 shrink-0" />
            <p className="text-sm text-blue-800">
              Tu trámite está siendo revisado por el contador. Recibirás un correo cuando esté listo.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
