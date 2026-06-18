'use client';
import Link from 'next/link';
import { FileText, Calculator, Briefcase, Wallet, ArrowRight } from 'lucide-react';

const MODULOS = [
  {
    tipo: 'CERTIFICACION_INGRESOS',
    titulo: 'Certificación de ingresos',
    desc: 'Documento profesional con tus ingresos, egresos, activos y pasivos.',
    icon: FileText,
    color: 'blue' as const,
  },
  {
    tipo: 'BALANCE_PERSONAL',
    titulo: 'Balance personal',
    desc: 'Visión completa de tu situación patrimonial actual.',
    icon: Wallet,
    color: 'violet' as const,
  },
  {
    tipo: 'IVA',
    titulo: 'Declaración de IVA (Forma 30)',
    desc: 'Responde preguntas simples y el sistema llena tu planilla de IVA automáticamente.',
    icon: Calculator,
    color: 'emerald' as const,
  },
  {
    tipo: 'PRESTACIONES_SOCIALES',
    titulo: 'Prestaciones sociales (LOTTT)',
    desc: 'Cálculo de antigüedad, vacaciones, bono vacacional, utilidades.',
    icon: Briefcase,
    color: 'amber' as const,
  },
];

const colorMap = {
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-600',    ring: 'ring-blue-100',    hover: 'hover:border-blue-300' },
  violet:  { bg: 'bg-violet-50',  text: 'text-violet-600',  ring: 'ring-violet-100',  hover: 'hover:border-violet-300' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-100', hover: 'hover:border-emerald-300' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',   ring: 'ring-amber-100',   hover: 'hover:border-amber-300' },
};

export default function NuevoTramitePage() {
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Nuevo trámite</h1>
        <p className="text-sm text-slate-500 mt-1">Elige el tipo de trámite que necesitas generar</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {MODULOS.map((m, i) => {
          const Icon = m.icon;
          const c = colorMap[m.color];
          return (
            <Link
              key={m.tipo}
              href={`/dashboard/nuevo/${m.tipo.toLowerCase()}`}
              className={`card-hover group p-5 ${c.hover} animate-slide-up`}
              style={{ animationDelay: `${i * 75}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className={`h-11 w-11 rounded-xl ${c.bg} ${c.text} grid place-items-center ring-1 ${c.ring} shrink-0`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900">{m.titulo}</h3>
                  <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">{m.desc}</p>
                  <div className="mt-3 flex items-center gap-1 text-sm font-medium text-brand-600 group-hover:text-brand-700 transition-colors">
                    Iniciar
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
