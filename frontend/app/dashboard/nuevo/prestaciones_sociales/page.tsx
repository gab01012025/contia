'use client';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

function fmt(n: number) {
  return n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ---------------------------------------------------------------------------
// Date-diff helper: exact years, months, days
// ---------------------------------------------------------------------------
function diffExacto(desdeStr: string, hastaStr: string) {
  const [y1, m1, d1_] = desdeStr.split('-').map(Number);
  const [y2, m2, d2_] = hastaStr.split('-').map(Number);
  const desde = new Date(Date.UTC(y1, m1 - 1, d1_));
  const hasta = new Date(Date.UTC(y2, m2 - 1, d2_));

  let anios = hasta.getUTCFullYear() - desde.getUTCFullYear();
  let meses = hasta.getUTCMonth() - desde.getUTCMonth();
  let dias = hasta.getUTCDate() - desde.getUTCDate();

  if (dias < 0) {
    meses -= 1;
    const prev = new Date(Date.UTC(hasta.getUTCFullYear(), hasta.getUTCMonth(), 0));
    dias += prev.getUTCDate();
  }
  if (meses < 0) {
    anios -= 1;
    meses += 12;
  }

  const totalMeses = anios * 12 + meses;
  const totalDias = Math.round((hasta.getTime() - desde.getTime()) / 86_400_000) + 1;

  return { anios, meses, dias, totalMeses, totalDias };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Escenario = 'A' | 'B' | 'C';

interface SalarioPeriodo {
  desde: string;
  hasta: string;
  salarioMensual: string;
  bonosMensuales: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function PrestacionesSocialesPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    // Worker info
    nombreTrabajador: '',
    cedula: '',
    cargo: '',
    nombreEmpresa: '',
    fechaIngreso: '',
    fechaEgreso: '',
    salarioMensual: '',
    bonosMensuales: '',
    motivoTerminacion: 'renuncia',
    diasUtilidadesAnuales: '30',

    // Date ranges for fractional benefits
    utilidadesDesde: '',
    utilidadesHasta: '',
    vacacionesDesde: '',
    vacacionesHasta: '',

    // Scenario selector
    escenario: 'C' as Escenario,

    // Scenario A fields
    montoAcumuladoGarantia: '',
    interesesAcumuladosFideicomiso: '',

    // Scenario B fields
    historialSalarios: [
      { desde: '', hasta: '', salarioMensual: '', bonosMensuales: '' },
    ] as SalarioPeriodo[],

    // Scenario C fields
    interesesAcordados: '',
  });

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------
  function setField<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function setStringField(key: keyof typeof form, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  // When dates change, auto-fill benefit period dates
  useEffect(() => {
    if (form.fechaIngreso && form.fechaEgreso) {
      const ts = diffExacto(form.fechaIngreso, form.fechaEgreso);
      if (ts.totalDias > 0) {
        const [y, m, d] = form.fechaIngreso.split('-').map(Number);
        const defaultDesde = ts.anios > 0
          ? `${y + ts.anios}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
          : form.fechaIngreso;
        setForm((f) => ({
          ...f,
          utilidadesDesde: f.utilidadesDesde || defaultDesde,
          utilidadesHasta: f.utilidadesHasta || form.fechaEgreso,
          vacacionesDesde: f.vacacionesDesde || defaultDesde,
          vacacionesHasta: f.vacacionesHasta || form.fechaEgreso,
        }));
      }
    }
  }, [form.fechaIngreso, form.fechaEgreso]);

  // Salary history helpers
  function addSalarioPeriodo() {
    setForm((f) => ({
      ...f,
      historialSalarios: [
        ...f.historialSalarios,
        { desde: '', hasta: '', salarioMensual: '', bonosMensuales: '' },
      ],
    }));
  }

  function removeSalarioPeriodo(idx: number) {
    setForm((f) => ({
      ...f,
      historialSalarios: f.historialSalarios.filter((_, i) => i !== idx),
    }));
  }

  function updateSalarioPeriodo(idx: number, key: keyof SalarioPeriodo, val: string) {
    setForm((f) => {
      const copy = [...f.historialSalarios];
      copy[idx] = { ...copy[idx], [key]: val };
      return { ...f, historialSalarios: copy };
    });
  }

  // -----------------------------------------------------------------------
  // Derived values from dates
  // -----------------------------------------------------------------------
  const tiempoServicio = useMemo(() => {
    if (!form.fechaIngreso || !form.fechaEgreso) return null;
    const d = diffExacto(form.fechaIngreso, form.fechaEgreso);
    if (d.totalDias <= 0) return null;
    return d;
  }, [form.fechaIngreso, form.fechaEgreso]);

  const aniosCompletos = tiempoServicio?.anios ?? 0;

  // Si la fracción del último año > 6 meses, contar como año completo adicional
  const aniosEfectivos = (tiempoServicio?.meses ?? 0) > 6 ? aniosCompletos + 1 : aniosCompletos;
  const diasBonoVacacionalAnuales = Math.min(15 + Math.max(0, aniosEfectivos - 1), 30);
  const diasVacacionesAnuales = Math.min(15 + Math.max(0, aniosEfectivos - 1), 30);

  // Salary history gap warning for Scenario B
  const historialWarning = useMemo(() => {
    if (form.escenario !== 'B' || !form.fechaIngreso || !form.fechaEgreso) return '';
    const periodos = form.historialSalarios.filter(
      (p) => p.desde && p.hasta && p.salarioMensual,
    );
    if (periodos.length === 0) return 'No se han ingresado períodos salariales.';

    // Sort by start date
    const sorted = [...periodos].sort(
      (a, b) => new Date(a.desde).getTime() - new Date(b.desde).getTime(),
    );

    // Check coverage
    const ingreso = new Date(form.fechaIngreso + 'T00:00:00').getTime();
    const egreso = new Date(form.fechaEgreso + 'T00:00:00').getTime();
    const firstStart = new Date(sorted[0].desde + 'T00:00:00').getTime();
    const lastEnd = new Date(sorted[sorted.length - 1].hasta + 'T00:00:00').getTime();

    const gaps: string[] = [];
    if (firstStart > ingreso + 86_400_000) {
      gaps.push('Falta cobertura al inicio de la relación laboral.');
    }
    if (lastEnd < egreso - 86_400_000) {
      gaps.push('Falta cobertura al final de la relación laboral.');
    }
    // Check between periods
    for (let i = 0; i < sorted.length - 1; i++) {
      const endCurr = new Date(sorted[i].hasta + 'T00:00:00').getTime();
      const startNext = new Date(sorted[i + 1].desde + 'T00:00:00').getTime();
      if (startNext - endCurr > 2 * 86_400_000) {
        gaps.push(`Hay un vacío entre ${sorted[i].hasta} y ${sorted[i + 1].desde}.`);
      }
    }

    return gaps.join(' ');
  }, [form.escenario, form.fechaIngreso, form.fechaEgreso, form.historialSalarios]);

  // -----------------------------------------------------------------------
  // Preview calculation (Scenarios A & C)
  // -----------------------------------------------------------------------
  const preview = useMemo(() => {
    if (!tiempoServicio) return null;
    if (form.escenario === 'B') return null; // simplified preview handled separately

    const salario = parseFloat(form.salarioMensual) || 0;
    const bonos = parseFloat(form.bonosMensuales) || 0;
    if (salario <= 0) return null;

    const diasUtil = parseInt(form.diasUtilidadesAnuales) || 30;
    const diasBonoVac = diasBonoVacacionalAnuales;

    const { anios, meses: mesesFrac, dias, totalMeses, totalDias } = tiempoServicio;
    const trimestresCompletos = Math.floor(totalMeses / 3);

    const salarioMensualTotal = salario + bonos;
    const salarioDiario = salarioMensualTotal / 30;
    const alicUtil = (salarioDiario * diasUtil) / 360;
    const alicBono = (salarioDiario * diasBonoVac) / 360;
    const salarioIntegral = salarioDiario + alicUtil + alicBono;

    // ---- Literal C (retroactivo) ----
    let diasLiteralC: number;
    if (mesesFrac > 6 || (mesesFrac === 6 && dias > 0)) {
      diasLiteralC = (anios + 1) * 30;
    } else {
      diasLiteralC = Math.round((anios + mesesFrac / 12) * 30 * 100) / 100;
    }
    // Pre-first-quarter: if total service < 3 months, special rule
    if (totalMeses < 3) {
      const mesesContables = totalMeses + (dias > 0 ? 1 : 0);
      diasLiteralC = Math.max(diasLiteralC, 5 * mesesContables);
    }
    const montoLiteralC = diasLiteralC * salarioIntegral;

    // ---- Garantia (Scenario A) ----
    let montoGarantia: number;
    let diasGarantia: number;

    if (form.escenario === 'A') {
      const acumulado = parseFloat(form.montoAcumuladoGarantia) || 0;
      // Fraction of current quarter pending
      const mesesEnTrimestreActual = totalMeses % 3;
      const diasFracTrimestre =
        mesesEnTrimestreActual > 0
          ? Math.round((15 * mesesEnTrimestreActual) / 3 * 100) / 100
          : 0;
      const montoFraccion = diasFracTrimestre * salarioIntegral;
      montoGarantia = acumulado + montoFraccion;
      // Estimate days for display: trimestres * 15 + additional days + fraction
      const diasAdicionales = anios >= 2 ? (anios - 1) * 2 : 0;
      diasGarantia = trimestresCompletos * 15 + diasAdicionales + diasFracTrimestre;
    } else {
      // Scenario C: guarantee is same as Literal C for comparison
      const diasAdicionales = anios >= 2 ? (anios - 1) * 2 : 0;
      diasGarantia = trimestresCompletos * 15 + diasAdicionales;
      montoGarantia = diasGarantia * salarioIntegral;
    }

    const usaRetro = montoLiteralC > montoGarantia;
    const montoAntiguedad = usaRetro ? montoLiteralC : montoGarantia;
    const diasAntiguedad = usaRetro ? diasLiteralC : diasGarantia;

    // ---- Intereses ----
    let intereses = 0;
    if (form.escenario === 'A') {
      intereses = parseFloat(form.interesesAcumuladosFideicomiso) || 0;
    } else if (form.escenario === 'C') {
      intereses = parseFloat(form.interesesAcordados) || 0;
    }

    // ---- Indemnizacion Art 92: always over Literal C ----
    const indemnizacion =
      form.motivoTerminacion === 'despido_injustificado' ? montoLiteralC : 0;

    // ---- Vacaciones & Bono Vacacional fraccionados ----
    // Usa mes completo si hay días parciales (igual que backend)
    let mesesVac = 0;
    if (form.vacacionesDesde && form.vacacionesHasta) {
      const dv = diffExacto(form.vacacionesDesde, form.vacacionesHasta);
      mesesVac = dv.dias > 0 ? dv.totalMeses + 1 : dv.totalMeses;
    } else {
      mesesVac = dias > 0 ? mesesFrac + 1 : mesesFrac;
    }
    const diasVacFrac = Math.round(((diasVacacionesAnuales * mesesVac) / 12) * 100) / 100;
    const montoVac = diasVacFrac * salarioDiario;
    const diasBonoVacFrac = Math.round(((diasBonoVac * mesesVac) / 12) * 100) / 100;
    const montoBonoVac = diasBonoVacFrac * salarioDiario;

    // ---- Utilidades fraccionadas ----
    // Usa mes completo si hay días parciales (igual que backend)
    let mesesUtilidades = 0;
    if (form.utilidadesDesde && form.utilidadesHasta) {
      const du = diffExacto(form.utilidadesDesde, form.utilidadesHasta);
      mesesUtilidades = du.dias > 0 ? du.totalMeses + 1 : du.totalMeses;
    } else {
      mesesUtilidades = dias > 0 ? mesesFrac + 1 : mesesFrac;
    }
    const diasUtilFrac = Math.round(((diasUtil * mesesUtilidades) / 12) * 100) / 100;
    const montoUtilBruto = diasUtilFrac * salarioDiario;
    const inces = montoUtilBruto * 0.005;
    const montoUtilNeto = montoUtilBruto - inces;

    // ---- Deducción fideicomiso (Escenario A) ----
    let deduccionFideicomiso = 0;
    if (form.escenario === 'A') {
      const fideicomisoAcumulado = parseFloat(form.montoAcumuladoGarantia) || 0;
      const interesesFideicomiso = parseFloat(form.interesesAcumuladosFideicomiso) || 0;
      deduccionFideicomiso = fideicomisoAcumulado + interesesFideicomiso;
    }

    const total =
      montoAntiguedad + intereses + indemnizacion + montoVac + montoBonoVac + montoUtilNeto - deduccionFideicomiso;

    return {
      totalMeses,
      totalDias,
      anios,
      mesesFrac,
      dias,
      trimestresCompletos,
      salarioDiario,
      salarioIntegral,
      garantia: { dias: diasGarantia, monto: montoGarantia },
      literalC: { dias: diasLiteralC, monto: montoLiteralC },
      metodoUsado: usaRetro
        ? 'Retroactivo (Art. 142-c)'
        : form.escenario === 'A'
          ? 'Garantía (fideicomiso + fracción)'
          : 'Garantía trimestral (Art. 142-a,b)',
      antiguedad: { dias: diasAntiguedad, monto: montoAntiguedad },
      intereses,
      indemnizacion,
      vacaciones: { dias: diasVacFrac, monto: montoVac },
      bonoVacacional: { dias: diasBonoVacFrac, monto: montoBonoVac },
      utilidades: { diasFrac: diasUtilFrac, bruto: montoUtilBruto, inces, neto: montoUtilNeto },
      deduccionFideicomiso,
      total,
    };
  }, [form, tiempoServicio, diasBonoVacacionalAnuales, diasVacacionesAnuales]);

  // -----------------------------------------------------------------------
  // Preview calculation (Scenario B - simplified)
  // -----------------------------------------------------------------------
  const previewB = useMemo(() => {
    if (!tiempoServicio) return null;
    if (form.escenario !== 'B') return null;

    const salario = parseFloat(form.salarioMensual) || 0;
    const bonos = parseFloat(form.bonosMensuales) || 0;
    if (salario <= 0) return null;

    const diasUtil = parseInt(form.diasUtilidadesAnuales) || 30;
    const diasBonoVac = diasBonoVacacionalAnuales;

    const { anios, meses: mesesFrac, dias, totalMeses } = tiempoServicio;

    const salarioMensualTotal = salario + bonos;
    const salarioDiario = salarioMensualTotal / 30;
    const alicUtil = (salarioDiario * diasUtil) / 360;
    const alicBono = (salarioDiario * diasBonoVac) / 360;
    const salarioIntegral = salarioDiario + alicUtil + alicBono;

    // Literal C only
    let diasLiteralC: number;
    if (mesesFrac > 6 || (mesesFrac === 6 && dias > 0)) {
      diasLiteralC = (anios + 1) * 30;
    } else {
      diasLiteralC = Math.round((anios + mesesFrac / 12) * 30 * 100) / 100;
    }
    if (totalMeses < 3) {
      const mesesContables = totalMeses + (dias > 0 ? 1 : 0);
      diasLiteralC = Math.max(diasLiteralC, 5 * mesesContables);
    }
    const montoLiteralC = diasLiteralC * salarioIntegral;

    return {
      anios,
      mesesFrac,
      dias,
      salarioDiario,
      salarioIntegral,
      literalC: { dias: diasLiteralC, monto: montoLiteralC },
    };
  }, [form, tiempoServicio, diasBonoVacacionalAnuales]);

  // -----------------------------------------------------------------------
  // Submit
  // -----------------------------------------------------------------------
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Common required fields
    const requiredCommon: (keyof typeof form)[] = [
      'nombreTrabajador',
      'cedula',
      'nombreEmpresa',
      'fechaIngreso',
      'fechaEgreso',
      'salarioMensual',
    ];
    for (const f of requiredCommon) {
      const val = form[f];
      if (typeof val === 'string' && !val.trim()) {
        setError('Por favor completa todos los campos obligatorios.');
        return;
      }
    }

    // Scenario-specific validation
    if (form.escenario === 'A') {
      if (!form.montoAcumuladoGarantia.trim()) {
        setError('Ingrese el monto acumulado de la garantía del fideicomiso.');
        return;
      }
    }
    if (form.escenario === 'B') {
      const valid = form.historialSalarios.some(
        (p) => p.desde && p.hasta && p.salarioMensual,
      );
      if (!valid) {
        setError('Ingrese al menos un período en el historial de salarios.');
        return;
      }
    }

    if (!tiempoServicio || tiempoServicio.totalDias <= 0) {
      setError('Verifica las fechas de ingreso y egreso.');
      return;
    }

    setSaving(true);
    try {
      const datos: Record<string, unknown> = {
        nombreTrabajador: form.nombreTrabajador,
        cedula: form.cedula,
        cargo: form.cargo,
        nombreEmpresa: form.nombreEmpresa,
        fechaIngreso: form.fechaIngreso,
        fechaEgreso: form.fechaEgreso,
        salarioMensual: parseFloat(form.salarioMensual) || 0,
        bonosMensuales: parseFloat(form.bonosMensuales) || 0,
        motivoTerminacion: form.motivoTerminacion,
        diasUtilidadesAnuales: parseInt(form.diasUtilidadesAnuales) || 30,
        diasBonoVacacionalAnuales: diasBonoVacacionalAnuales,
        diasVacacionesAnuales: diasVacacionesAnuales,
        escenario: form.escenario,
        utilidadesDesde: form.utilidadesDesde,
        utilidadesHasta: form.utilidadesHasta,
        vacacionesDesde: form.vacacionesDesde,
        vacacionesHasta: form.vacacionesHasta,
      };

      if (form.escenario === 'A') {
        datos.montoAcumuladoGarantia = parseFloat(form.montoAcumuladoGarantia) || 0;
        datos.interesesAcumuladosFideicomiso =
          parseFloat(form.interesesAcumuladosFideicomiso) || 0;
      }
      if (form.escenario === 'B') {
        datos.historialSalarios = form.historialSalarios
          .filter((p) => p.desde && p.hasta && p.salarioMensual)
          .map((p) => ({
            desde: p.desde,
            hasta: p.hasta,
            salarioMensual: parseFloat(p.salarioMensual) || 0,
            bonosMensuales: parseFloat(p.bonosMensuales) || 0,
          }));
      }
      if (form.escenario === 'C') {
        datos.interesesAcordados = parseFloat(form.interesesAcordados) || 0;
      }

      await api('/tramites', {
        method: 'POST',
        body: JSON.stringify({ tipo: 'PRESTACIONES_SOCIALES', datos }),
      });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al guardar el trámite.');
    } finally {
      setSaving(false);
    }
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  const escenarios: {
    key: Escenario;
    title: string;
    desc: string;
  }[] = [
    {
      key: 'A',
      title: 'Tiene fideicomiso bancario',
      desc: 'El trabajador tiene un fideicomiso constituido. Se ingresarán los montos acumulados.',
    },
    {
      key: 'B',
      title: 'Sin fideicomiso, con historial de salarios',
      desc: 'No tiene fideicomiso pero se dispone del historial salarial. El sistema calculará trimestre por trimestre.',
    },
    {
      key: 'C',
      title: 'Sin fideicomiso ni historial salarial',
      desc: 'No se dispone de antecedentes salariales. Se calcula al último salario (retroactivo).',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-6 text-sm text-slate-500">
        <Link href="/dashboard/nuevo" className="hover:underline">
          Nuevo trámite
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">Prestaciones sociales</span>
      </div>

      <h1 className="text-2xl font-bold mb-1">Prestaciones sociales (LOTTT)</h1>
      <p className="text-slate-500 mb-8 text-sm">
        Cálculo de antigüedad, vacaciones, bono vacacional, utilidades e indemnización según
        la LOTTT.
      </p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ============================================================= */}
        {/* Section 1: Datos del Trabajador */}
        {/* ============================================================= */}
        <section className="card">
          <h2 className="font-semibold text-slate-900 mb-4">Datos del trabajador</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Nombre completo *</label>
              <input
                className="input"
                value={form.nombreTrabajador}
                onChange={(e) => setStringField('nombreTrabajador', e.target.value)}
                placeholder="Nombre y apellido del trabajador"
              />
            </div>
            <div>
              <label className="label">Cédula de identidad *</label>
              <input
                className="input"
                value={form.cedula}
                onChange={(e) => setStringField('cedula', e.target.value)}
                placeholder="V-XX.XXX.XXX"
              />
            </div>
            <div>
              <label className="label">Cargo</label>
              <input
                className="input"
                value={form.cargo}
                onChange={(e) => setStringField('cargo', e.target.value)}
                placeholder="Cargo desempeñado"
              />
            </div>
            <div>
              <label className="label">Empresa / Patrono *</label>
              <input
                className="input"
                value={form.nombreEmpresa}
                onChange={(e) => setStringField('nombreEmpresa', e.target.value)}
                placeholder="Nombre de la empresa"
              />
            </div>
          </div>
        </section>

        {/* ============================================================= */}
        {/* Section 2: Relacion Laboral + Scenario Selector */}
        {/* ============================================================= */}
        <section className="card">
          <h2 className="font-semibold text-slate-900 mb-4">Relación laboral</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Fecha de ingreso *</label>
              <input
                className="input"
                type="date"
                value={form.fechaIngreso}
                onChange={(e) => setStringField('fechaIngreso', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Fecha de egreso *</label>
              <input
                className="input"
                type="date"
                value={form.fechaEgreso}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm((f) => ({
                    ...f,
                    fechaEgreso: v,
                    utilidadesHasta: v,
                    vacacionesHasta: v,
                  }));
                }}
              />
            </div>
            <div>
              <label className="label">Motivo de terminación *</label>
              <select
                className="input"
                value={form.motivoTerminacion}
                onChange={(e) => setStringField('motivoTerminacion', e.target.value)}
              >
                <option value="renuncia">Renuncia voluntaria</option>
                <option value="despido_justificado">Despido justificado</option>
                <option value="despido_injustificado">Despido injustificado</option>
              </select>
            </div>
          </div>

          {/* Scenario radio cards */}
          <div className="mt-6">
            <label className="label mb-3">Escenario de cálculo *</label>
            <div className="space-y-3">
              {escenarios.map((esc) => (
                <label
                  key={esc.key}
                  className={`block cursor-pointer rounded-lg border-2 p-4 transition-colors ${
                    form.escenario === esc.key
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="escenario"
                      value={esc.key}
                      checked={form.escenario === esc.key}
                      onChange={() => setField('escenario', esc.key)}
                      className="mt-1 accent-brand-600"
                    />
                    <div>
                      <div className="font-medium text-slate-900">
                        Escenario {esc.key}: {esc.title}
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">{esc.desc}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================= */}
        {/* Section 3: Salario (conditional) */}
        {/* ============================================================= */}
        <section className="card">
          <h2 className="font-semibold text-slate-900 mb-4">
            {form.escenario === 'B' ? 'Salario actual e historial' : 'Salario'}
          </h2>

          {/* Current salary - always shown */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Salario mensual (Bs.) *</label>
              <input
                className="input text-right"
                type="number"
                min="0"
                step="0.01"
                value={form.salarioMensual}
                onChange={(e) => setStringField('salarioMensual', e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="label">Bonos mensuales (Bs.)</label>
              <input
                className="input text-right"
                type="number"
                min="0"
                step="0.01"
                value={form.bonosMensuales}
                onChange={(e) => setStringField('bonosMensuales', e.target.value)}
                placeholder="0.00"
              />
              <p className="text-xs text-slate-400 mt-1">
                Primas fijas, bonos de productividad o pagos regulares mensuales.
              </p>
            </div>
          </div>

          {/* Scenario B: Salary history table */}
          {form.escenario === 'B' && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">
                Historial de salarios
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Ingrese los períodos salariales desde el ingreso hasta el egreso del
                trabajador.
              </p>

              <div className="space-y-3">
                {form.historialSalarios.map((periodo, idx) => (
                  <div
                    key={idx}
                    className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_1fr_auto] items-end rounded-lg border border-slate-200 bg-slate-50 p-3"
                  >
                    <div>
                      <label className="label text-xs">Desde</label>
                      <input
                        className="input text-sm"
                        type="date"
                        value={periodo.desde}
                        onChange={(e) =>
                          updateSalarioPeriodo(idx, 'desde', e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="label text-xs">Hasta</label>
                      <input
                        className="input text-sm"
                        type="date"
                        value={periodo.hasta}
                        onChange={(e) =>
                          updateSalarioPeriodo(idx, 'hasta', e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="label text-xs">Salario mensual</label>
                      <input
                        className="input text-sm text-right"
                        type="number"
                        min="0"
                        step="0.01"
                        value={periodo.salarioMensual}
                        onChange={(e) =>
                          updateSalarioPeriodo(idx, 'salarioMensual', e.target.value)
                        }
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="label text-xs">Bonos</label>
                      <input
                        className="input text-sm text-right"
                        type="number"
                        min="0"
                        step="0.01"
                        value={periodo.bonosMensuales}
                        onChange={(e) =>
                          updateSalarioPeriodo(idx, 'bonosMensuales', e.target.value)
                        }
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => removeSalarioPeriodo(idx)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium px-2 py-2 rounded hover:bg-red-50 transition-colors"
                        title="Eliminar período"
                        disabled={form.historialSalarios.length <= 1}
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addSalarioPeriodo}
                className="mt-3 text-sm text-brand-600 hover:text-brand-800 font-medium flex items-center gap-1"
              >
                <span className="text-lg leading-none">+</span> Agregar período salarial
              </button>

              {historialWarning && (
                <div className="mt-3 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
                  {historialWarning}
                </div>
              )}
            </div>
          )}
        </section>

        {/* ============================================================= */}
        {/* Section 4: Datos del Fideicomiso (Scenario A only) */}
        {/* ============================================================= */}
        {form.escenario === 'A' && (
          <section className="card">
            <h2 className="font-semibold text-slate-900 mb-4">Datos del fideicomiso</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Monto acumulado de garantía (Bs.) *</label>
                <input
                  className="input text-right"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.montoAcumuladoGarantia}
                  onChange={(e) =>
                    setStringField('montoAcumuladoGarantia', e.target.value)
                  }
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="label">Intereses acumulados del fideicomiso (Bs.)</label>
                <input
                  className="input text-right"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.interesesAcumuladosFideicomiso}
                  onChange={(e) =>
                    setStringField('interesesAcumuladosFideicomiso', e.target.value)
                  }
                  placeholder="0.00"
                />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              La fracción pendiente del trimestre en curso se calculará automáticamente al
              salario integral actual.
            </p>
          </section>
        )}

        {/* ============================================================= */}
        {/* Section 5: Intereses Acordados (Scenario C only) */}
        {/* ============================================================= */}
        {form.escenario === 'C' && (
          <section className="card">
            <h2 className="font-semibold text-slate-900 mb-4">Intereses acordados</h2>
            <div className="max-w-sm">
              <label className="label">Monto de intereses acordados (Bs.)</label>
              <input
                className="input text-right"
                type="number"
                min="0"
                step="0.01"
                value={form.interesesAcordados}
                onChange={(e) => setStringField('interesesAcordados', e.target.value)}
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Ingrese el monto de intereses pactado entre las partes en el acta de finiquito.
            </p>
          </section>
        )}

        {/* ============================================================= */}
        {/* Section 6: Parámetros de cálculo */}
        {/* ============================================================= */}
        <section className="card">
          <h2 className="font-semibold text-slate-900 mb-4">Parámetros de cálculo</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Días de utilidades anuales</label>
              <input
                className="input text-right"
                type="number"
                min="30"
                max="120"
                value={form.diasUtilidadesAnuales}
                onChange={(e) => setStringField('diasUtilidadesAnuales', e.target.value)}
                placeholder="30"
              />
              <p className="text-xs text-slate-400 mt-1">
                Mínimo legal LOTTT: 30 días. Puede ser mayor por contrato colectivo.
              </p>
            </div>

            {/* Read-only auto-calculated info */}
            <div className="flex flex-col justify-center space-y-2">
              <div className="text-sm text-slate-600 bg-slate-50 rounded-md px-3 py-2">
                <span className="font-medium text-slate-800">
                  Días de bono vacacional: {diasBonoVacacionalAnuales}
                </span>
                <span className="text-xs text-slate-500 block">
                  15 base{' '}
                  {aniosCompletos > 1
                    ? `+ ${aniosCompletos - 1} por antigüedad`
                    : '(primer año)'}
                </span>
              </div>
              <div className="text-sm text-slate-600 bg-slate-50 rounded-md px-3 py-2">
                <span className="font-medium text-slate-800">
                  Días de vacaciones: {diasVacacionesAnuales}
                </span>
                <span className="text-xs text-slate-500 block">
                  15 base{' '}
                  {aniosCompletos > 1
                    ? `+ ${aniosCompletos - 1} por antigüedad`
                    : '(primer año)'}
                </span>
              </div>
            </div>
          </div>

          {/* Fractional date ranges */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
              Períodos de beneficios fraccionados
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Ingrese las fechas desde el último pago de cada beneficio hasta la fecha de
              egreso.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label text-xs">Utilidades — Desde</label>
                <input
                  className="input text-sm"
                  type="date"
                  value={form.utilidadesDesde}
                  onChange={(e) => setStringField('utilidadesDesde', e.target.value)}
                />
              </div>
              <div>
                <label className="label text-xs">Utilidades — Hasta</label>
                <input
                  className="input text-sm"
                  type="date"
                  value={form.utilidadesHasta}
                  onChange={(e) => setStringField('utilidadesHasta', e.target.value)}
                />
              </div>
              <div>
                <label className="label text-xs">Vacaciones y Bono Vac. — Desde</label>
                <input
                  className="input text-sm"
                  type="date"
                  value={form.vacacionesDesde}
                  onChange={(e) => setStringField('vacacionesDesde', e.target.value)}
                />
              </div>
              <div>
                <label className="label text-xs">Vacaciones y Bono Vac. — Hasta</label>
                <input
                  className="input text-sm"
                  type="date"
                  value={form.vacacionesHasta}
                  onChange={(e) => setStringField('vacacionesHasta', e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================= */}
        {/* Section 7: Vista Previa - Scenarios A & C */}
        {/* ============================================================= */}
        {(form.escenario === 'A' || form.escenario === 'C') && preview && (
          <div className="card bg-brand-50 border-brand-200">
            <h3 className="font-semibold text-brand-900 mb-4">Vista previa del cálculo</h3>

            {/* Tiempo de servicio */}
            <div className="text-sm text-slate-600 mb-4">
              Tiempo de servicio:{' '}
              <span className="font-medium text-slate-800">
                {preview.anios} año{preview.anios !== 1 ? 's' : ''}
                {preview.mesesFrac > 0
                  ? `, ${preview.mesesFrac} mes${preview.mesesFrac !== 1 ? 'es' : ''}`
                  : ''}
                {preview.dias > 0
                  ? ` y ${preview.dias} día${preview.dias !== 1 ? 's' : ''}`
                  : ''}
              </span>{' '}
              ({preview.totalMeses} meses, {preview.trimestresCompletos} trimestres)
            </div>

            {/* Escenario */}
            <div className="text-sm text-slate-600 mb-4 pb-4 border-b border-brand-200">
              Escenario:{' '}
              <span className="font-medium text-slate-800">
                {form.escenario === 'A'
                  ? 'A — Con fideicomiso bancario'
                  : 'C — Sin fideicomiso ni historial (retroactivo)'}
              </span>
            </div>

            {/* Salarios */}
            <div className="grid gap-2 sm:grid-cols-2 text-sm mb-4 pb-4 border-b border-brand-200">
              <div className="flex justify-between">
                <span className="text-slate-600">Salario diario normal</span>
                <span className="font-medium">Bs. {fmt(preview.salarioDiario)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Salario integral diario</span>
                <span className="font-medium">Bs. {fmt(preview.salarioIntegral)}</span>
              </div>
            </div>

            {/* Doble calculo antiguedad */}
            <div className="mb-4 pb-4 border-b border-brand-200">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">
                Antigüedad — Doble cálculo (Art. 142 LOTTT)
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">
                    Garantía{' '}
                    {form.escenario === 'A' ? '(fideicomiso + fracción)' : 'trimestral (a,b)'}:{' '}
                    {fmt(preview.garantia.dias)} días
                  </span>
                  <span className="font-medium">Bs. {fmt(preview.garantia.monto)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">
                    Retroactivo Literal C: {fmt(preview.literalC.dias)} días
                  </span>
                  <span className="font-medium">Bs. {fmt(preview.literalC.monto)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-brand-100">
                  <span className="font-semibold text-slate-800">
                    Se aplica: {preview.metodoUsado}
                  </span>
                  <span className="font-bold text-brand-900">
                    Bs. {fmt(preview.antiguedad.monto)}
                  </span>
                </div>
              </div>
            </div>

            {/* Intereses */}
            {preview.intereses > 0 && (
              <div className="mb-4 pb-4 border-b border-brand-200">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">
                    Intereses{' '}
                    {form.escenario === 'A'
                      ? 'acumulados del fideicomiso'
                      : 'acordados en finiquito'}
                  </span>
                  <span className="font-medium">Bs. {fmt(preview.intereses)}</span>
                </div>
              </div>
            )}

            {/* Otros conceptos */}
            <div className="space-y-2 text-sm mb-4 pb-4 border-b border-brand-200">
              {form.motivoTerminacion === 'despido_injustificado' && (
                <div className="flex justify-between">
                  <span className="text-slate-600">
                    Indemnización Art. 92 (sobre Literal C: {fmt(preview.literalC.dias)}{' '}
                    días)
                  </span>
                  <span className="font-medium">Bs. {fmt(preview.indemnizacion)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-600">
                  Vacaciones fraccionadas ({fmt(preview.vacaciones.dias)} días)
                </span>
                <span className="font-medium">Bs. {fmt(preview.vacaciones.monto)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">
                  Bono vacacional fraccionado ({fmt(preview.bonoVacacional.dias)} días)
                </span>
                <span className="font-medium">
                  Bs. {fmt(preview.bonoVacacional.monto)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">
                  Utilidades fraccionadas ({fmt(preview.utilidades.diasFrac)} días)
                </span>
                <span className="font-medium">
                  Bs. {fmt(preview.utilidades.bruto)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 pl-4">
                <span>INCES (0,5% sobre utilidades)</span>
                <span>- Bs. {fmt(preview.utilidades.inces)}</span>
              </div>
              <div className="flex justify-between pl-4">
                <span className="text-slate-600">Utilidades netas</span>
                <span className="font-medium">Bs. {fmt(preview.utilidades.neto)}</span>
              </div>
            </div>

            {/* Deducción fideicomiso (Escenario A) */}
            {form.escenario === 'A' && preview.deduccionFideicomiso > 0 && (
              <div className="flex justify-between text-sm text-red-600 mb-2">
                <span>Deducción fideicomiso (ya depositado)</span>
                <span className="font-medium">– Bs. {fmt(preview.deduccionFideicomiso)}</span>
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between text-lg">
              <span className="font-bold text-slate-900">TOTAL A PAGAR</span>
              <span className="font-bold text-brand-900">Bs. {fmt(preview.total)}</span>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* Section 7: Vista Previa - Scenario B (simplified) */}
        {/* ============================================================= */}
        {form.escenario === 'B' && previewB && (
          <div className="card bg-brand-50 border-brand-200">
            <h3 className="font-semibold text-brand-900 mb-4">
              Vista previa del cálculo (parcial)
            </h3>

            <div className="text-sm text-slate-600 mb-4">
              Tiempo de servicio:{' '}
              <span className="font-medium text-slate-800">
                {previewB.anios} año{previewB.anios !== 1 ? 's' : ''}
                {previewB.mesesFrac > 0
                  ? `, ${previewB.mesesFrac} mes${previewB.mesesFrac !== 1 ? 'es' : ''}`
                  : ''}
                {previewB.dias > 0
                  ? ` y ${previewB.dias} día${previewB.dias !== 1 ? 's' : ''}`
                  : ''}
              </span>
            </div>

            <div className="text-sm text-slate-600 mb-4 pb-4 border-b border-brand-200">
              Escenario:{' '}
              <span className="font-medium text-slate-800">
                B — Con historial de salarios (cálculo trimestral en servidor)
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 text-sm mb-4 pb-4 border-b border-brand-200">
              <div className="flex justify-between">
                <span className="text-slate-600">Salario diario actual</span>
                <span className="font-medium">Bs. {fmt(previewB.salarioDiario)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Salario integral diario actual</span>
                <span className="font-medium">Bs. {fmt(previewB.salarioIntegral)}</span>
              </div>
            </div>

            <div className="mb-4 pb-4 border-b border-brand-200">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">
                Literal C (retroactivo al último salario)
              </h4>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">
                  {fmt(previewB.literalC.dias)} días
                </span>
                <span className="font-medium">
                  Bs. {fmt(previewB.literalC.monto)}
                </span>
              </div>
            </div>

            <div className="rounded-md bg-brand-100 border border-brand-200 px-3 py-2 text-xs text-brand-800">
              La matriz trimestral detallada con intereses BCV se calculará al enviar el
              trámite. El servidor procesará cada trimestre con el salario integral vigente
              en cada período.
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* Error */}
        {/* ============================================================= */}
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ============================================================= */}
        {/* Actions */}
        {/* ============================================================= */}
        <div className="flex gap-3 justify-end">
          <Link href="/dashboard/nuevo" className="btn-secondary">
            Cancelar
          </Link>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Enviando...' : 'Enviar trámite'}
          </button>
        </div>
      </form>
    </div>
  );
}
