'use client';
import Link from 'next/link';

const MODULOS = [
  {
    tipo: 'CERTIFICACION_INGRESOS',
    titulo: 'Certificación de ingresos',
    desc: 'Documento profesional con tus ingresos, egresos, activos y pasivos.',
  },
  {
    tipo: 'BALANCE_PERSONAL',
    titulo: 'Balance personal',
    desc: 'Visión completa de tu situación patrimonial actual.',
  },
  {
    tipo: 'IVA',
    titulo: 'IVA (cálculo referencial)',
    desc: 'Cálculo de débito y crédito fiscal con guía explicativa.',
  },
  {
    tipo: 'PRESTACIONES_SOCIALES',
    titulo: 'Prestaciones sociales (LOTTT)',
    desc: 'Cálculo de antigüedad, vacaciones, bono vacacional, utilidades.',
  },
];

export default function NuevoTramitePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Nuevo trámite</h1>
      <p className="text-slate-600 mb-8">Elige el tipo de trámite que necesitas generar.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {MODULOS.map((m) => (
          <Link
            key={m.tipo}
            href={`/dashboard/nuevo/${m.tipo.toLowerCase()}`}
            className="card hover:shadow-md transition border-slate-200 hover:border-brand-300"
          >
            <h3 className="font-semibold text-slate-900">{m.titulo}</h3>
            <p className="mt-2 text-sm text-slate-600">{m.desc}</p>
            <p className="mt-4 text-sm text-brand-700 font-medium">Iniciar →</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
