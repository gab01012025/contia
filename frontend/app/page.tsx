import Link from 'next/link';
import { FileText, Calculator, Briefcase, ArrowRight, Sparkles, UserCheck, Download, ClipboardList } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-dark text-white">
        {/* Mesh background */}
        <div className="absolute inset-0 opacity-30 bg-mesh" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-400/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />

        <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
          {/* Nav bar */}
          <div className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-white/10 backdrop-blur-sm text-white grid place-items-center font-bold text-sm border border-white/10">
                C
              </div>
              <span className="font-semibold tracking-tight text-lg">CONTIA</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="btn text-sm text-white/80 hover:text-white hover:bg-white/10">
                Ingresar
              </Link>
              <Link href="/registro" className="btn text-sm bg-white text-brand-700 hover:bg-brand-50 shadow-lg shadow-black/10">
                Crear cuenta
              </Link>
            </div>
          </div>

          {/* Hero content */}
          <div className="max-w-3xl animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-sm text-brand-200 mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              Inteligencia artificial + revisión profesional
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
              Tus trámites contables,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-blue-300">
                listos en minutos
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-slate-300 leading-relaxed">
              Genera certificación de ingresos, cálculo de IVA o prestaciones sociales. Cada documento es revisado por un profesional antes de entregarse.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/registro" className="btn bg-white text-brand-700 hover:bg-brand-50 shadow-lg shadow-black/10 px-6 py-3 text-base">
                Comenzar gratis
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="#modulos" className="btn border border-white/20 text-white hover:bg-white/10 px-6 py-3 text-base">
                Ver módulos
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Módulos ──────────────────────────────────────── */}
      <section id="modulos" className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-sm font-medium text-brand-600 mb-2">Módulos disponibles</p>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Lo que puedes generar</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <ModuloCard
            icon={FileText}
            title="Certificación de Ingresos"
            desc="Documento profesional con tus ingresos, egresos, activos y pasivos. Incluye balance personal."
            color="blue"
          />
          <ModuloCard
            icon={Calculator}
            title="IVA — Forma 30"
            desc="Declaración guiada del IVA: responde preguntas simples y el sistema llena tu planilla completa."
            color="emerald"
          />
          <ModuloCard
            icon={Briefcase}
            title="Prestaciones Sociales"
            desc="Cálculo según LOTTT: antigüedad, indemnización, vacaciones, bono vacacional, utilidades."
            color="violet"
          />
        </div>
      </section>

      {/* ─── Cómo funciona ────────────────────────────────── */}
      <section className="bg-gradient-subtle border-y border-slate-200/80">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-sm font-medium text-brand-600 mb-2">Proceso simple</p>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Cómo funciona</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-4">
            <Paso n={1} icon={ClipboardList} t="Llenas el formulario" d="Datos guiados, validados y simples." />
            <Paso n={2} icon={Sparkles} t="IA genera el borrador" d="Documento profesional listo en segundos." />
            <Paso n={3} icon={UserCheck} t="Revisión profesional" d="Un experto valida y aprueba o devuelve." />
            <Paso n={4} icon={Download} t="Descargas el PDF" d="Documento aprobado, listo para usar." />
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="rounded-2xl bg-gradient-brand p-10 md:p-16 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">¿Listo para empezar?</h2>
            <p className="mt-4 text-lg text-white/80 max-w-xl mx-auto">
              Crea tu cuenta gratis y genera tu primer trámite en minutos.
            </p>
            <Link href="/registro" className="inline-flex items-center gap-2 mt-8 btn bg-white text-brand-700 hover:bg-brand-50 shadow-lg px-6 py-3 text-base">
              Crear cuenta gratis
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-slate-200/80 py-10">
        <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-gradient-brand text-white grid place-items-center font-bold text-xs">C</div>
            <span className="text-sm font-medium text-slate-700">CONTIA</span>
          </div>
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} CONTIA — Trámites contables y laborales asistidos por IA
          </p>
        </div>
      </footer>
    </main>
  );
}

const colorMap = {
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', ring: 'ring-blue-100' },
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', ring: 'ring-emerald-100' },
  violet: { bg: 'bg-violet-50', icon: 'text-violet-600', ring: 'ring-violet-100' },
};

function ModuloCard({ icon: Icon, title, desc, color }: {
  icon: React.ElementType; title: string; desc: string; color: 'blue' | 'emerald' | 'violet';
}) {
  const c = colorMap[color];
  return (
    <div className="card-hover group cursor-default">
      <div className={`h-10 w-10 rounded-lg ${c.bg} ${c.icon} grid place-items-center ring-1 ${c.ring} mb-4`}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}

function Paso({ n, icon: Icon, t, d }: { n: number; icon: React.ElementType; t: string; d: string }) {
  return (
    <div className="card-hover text-center group">
      <div className="mx-auto h-12 w-12 rounded-xl bg-brand-50 text-brand-600 grid place-items-center ring-1 ring-brand-100 mb-4 group-hover:bg-brand-100 transition-colors">
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-xs font-medium text-brand-600 mb-1">Paso {n}</div>
      <h4 className="font-semibold text-slate-900">{t}</h4>
      <p className="mt-1 text-sm text-slate-500">{d}</p>
    </div>
  );
}
