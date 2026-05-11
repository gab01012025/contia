import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* hero */}
      <section className="bg-gradient-to-br from-brand-700 to-brand-900 text-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-white text-brand-700 grid place-items-center font-bold">C</div>
            <span className="text-lg font-semibold tracking-wide">CONTIA</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight max-w-3xl">
            Trámites contables y laborales asistidos por IA, revisados por profesionales.
          </h1>
          <p className="mt-6 max-w-2xl text-brand-100 text-lg">
            Genera tu certificación de ingresos, cálculo de IVA o prestaciones sociales en minutos.
            Cada documento es revisado por un profesional antes de la entrega final.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/registro" className="btn bg-white text-brand-700 hover:bg-brand-50">
              Crear cuenta gratis
            </Link>
            <Link href="/login" className="btn border border-white/30 text-white hover:bg-white/10">
              Ingresar
            </Link>
          </div>
        </div>
      </section>

      {/* modulos */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-bold text-slate-900 mb-8">Lo que puedes generar</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <ModuloCard
            title="Certificación de Ingresos"
            desc="Documento profesional con tus ingresos, egresos, activos y pasivos. Incluye balance personal."
          />
          <ModuloCard
            title="IVA"
            desc="Cálculo referencial automático de débito y crédito fiscal con guía explicativa para SENIAT."
          />
          <ModuloCard
            title="Prestaciones Sociales"
            desc="Cálculo según LOTTT Venezuela: antigüedad, indemnización, vacaciones, bono vacacional, utilidades."
          />
        </div>
      </section>

      {/* flujo */}
      <section className="bg-white border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Cómo funciona</h2>
          <ol className="grid gap-6 md:grid-cols-4">
            <Paso n={1} t="Llenas el formulario" d="Datos guiados, validados y simples." />
            <Paso n={2} t="IA genera el borrador" d="Documento profesional listo en segundos." />
            <Paso n={3} t="Revisión profesional" d="Un experto valida y aprueba o devuelve con observaciones." />
            <Paso n={4} t="Descargas el PDF" d="Documento aprobado, listo para usar." />
          </ol>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-10 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} CONTIA — Trámites contables y laborales asistidos por IA
      </footer>
    </main>
  );
}

function ModuloCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="card hover:shadow-md transition">
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{desc}</p>
    </div>
  );
}

function Paso({ n, t, d }: { n: number; t: string; d: string }) {
  return (
    <li className="rounded-lg border border-slate-200 p-5">
      <div className="h-8 w-8 rounded-full bg-brand-600 text-white grid place-items-center font-bold text-sm">{n}</div>
      <h4 className="mt-3 font-semibold">{t}</h4>
      <p className="mt-1 text-sm text-slate-600">{d}</p>
    </li>
  );
}
