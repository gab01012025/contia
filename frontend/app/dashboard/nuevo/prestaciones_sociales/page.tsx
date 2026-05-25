'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

function fmt(n: number) {
  return n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function PrestacionesSocialesPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
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
    diasBonoVacacionalAnuales: '15',
  });

  function setField(key: keyof typeof form, val: string) {
    setForm(f => ({ ...f, [key]: val }));
  }

  // --- Preview calculation ---
  const preview = useMemo(() => {
    const salario = parseFloat(form.salarioMensual) || 0;
    const bonos = parseFloat(form.bonosMensuales) || 0;
    const diasUtil = parseInt(form.diasUtilidadesAnuales) || 30;
    const diasBonoVac = parseInt(form.diasBonoVacacionalAnuales) || 15;

    if (!form.fechaIngreso || !form.fechaEgreso || salario <= 0) return null;

    const d1 = new Date(form.fechaIngreso);
    const d2 = new Date(form.fechaEgreso);
    if (d2 <= d1) return null;

    let meses = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
    if (d2.getDate() < d1.getDate()) meses -= 1;
    if (meses <= 0) return null;

    const aniosCompletos = Math.floor(meses / 12);
    const mesesFraccion = meses % 12;
    const trimestresCompletos = Math.floor(meses / 3);

    const salarioMensualTotal = salario + bonos;
    const salarioDiario = salarioMensualTotal / 30;
    const alicUtil = (salarioDiario * diasUtil) / 360;
    const alicBono = (salarioDiario * diasBonoVac) / 360;
    const salarioIntegral = salarioDiario + alicUtil + alicBono;

    // Doble calculo Art. 142
    const diasGarantia = trimestresCompletos * 15 + (aniosCompletos > 1 ? (aniosCompletos - 1) * 2 : 0);
    const montoGarantia = diasGarantia * salarioIntegral;
    const aniosRetro = mesesFraccion > 6 ? aniosCompletos + 1 : aniosCompletos;
    const diasRetro = aniosRetro * 30;
    const montoRetro = diasRetro * salarioIntegral;
    const usaRetro = montoRetro > montoGarantia;
    const montoAntiguedad = usaRetro ? montoRetro : montoGarantia;
    const diasAntiguedad = usaRetro ? diasRetro : diasGarantia;

    // Indemnizacion
    const indemnizacion = form.motivoTerminacion === 'despido_injustificado' ? montoAntiguedad : 0;

    // Vacaciones fraccionadas (tope 30)
    const diasVacAnio = Math.min(15 + Math.max(0, aniosCompletos - 1), 30);
    const diasVacFrac = (diasVacAnio * mesesFraccion) / 12;
    const montoVac = diasVacFrac * salarioDiario;

    // Bono vacacional fraccionado (tope 30)
    const diasBonoVacAnio = Math.min(diasBonoVac + Math.max(0, aniosCompletos - 1), 30);
    const diasBonoVacFrac = (diasBonoVacAnio * mesesFraccion) / 12;
    const montoBonoVac = diasBonoVacFrac * salarioDiario;

    // Utilidades fraccionadas
    const diasUtilFrac = (diasUtil * (meses % 12)) / 12;
    const montoUtil = diasUtilFrac * salarioDiario;

    const total = montoAntiguedad + indemnizacion + montoVac + montoBonoVac + montoUtil;

    return {
      meses, aniosCompletos, mesesFraccion, trimestresCompletos,
      salarioDiario, salarioIntegral,
      garantia: { dias: diasGarantia, monto: montoGarantia },
      retroactivo: { dias: diasRetro, monto: montoRetro },
      metodoUsado: usaRetro ? 'Retroactivo (Art. 142-c)' : 'Garantia trimestral (Art. 142-a,b)',
      antiguedad: { dias: diasAntiguedad, monto: montoAntiguedad },
      indemnizacion,
      vacaciones: { dias: diasVacFrac, monto: montoVac },
      bonoVacacional: { dias: diasBonoVacFrac, monto: montoBonoVac },
      utilidades: { dias: diasUtilFrac, monto: montoUtil },
      total,
    };
  }, [form]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const required: (keyof typeof form)[] = [
      'nombreTrabajador', 'cedula', 'nombreEmpresa',
      'fechaIngreso', 'fechaEgreso', 'salarioMensual',
    ];
    for (const f of required) {
      if (!form[f].trim()) {
        setError('Por favor completa todos los campos obligatorios.');
        return;
      }
    }
    if (!preview) {
      setError('Verifica las fechas y el salario.');
      return;
    }

    setSaving(true);
    try {
      const datos = {
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
        diasBonoVacacionalAnuales: parseInt(form.diasBonoVacacionalAnuales) || 15,
      };
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

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-6 text-sm text-slate-500">
        <Link href="/dashboard/nuevo" className="hover:underline">Nuevo trámite</Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">Prestaciones sociales</span>
      </div>

      <h1 className="text-2xl font-bold mb-1">Prestaciones sociales (LOTTT)</h1>
      <p className="text-slate-500 mb-8 text-sm">
        Cálculo de antigüedad, vacaciones, bono vacacional, utilidades e indemnización según la LOTTT.
      </p>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Datos del trabajador */}
        <section className="card">
          <h2 className="font-semibold text-slate-900 mb-4">Datos del trabajador</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Nombre completo *</label>
              <input className="input" value={form.nombreTrabajador}
                onChange={e => setField('nombreTrabajador', e.target.value)}
                placeholder="Nombre y apellido del trabajador" />
            </div>
            <div>
              <label className="label">Cédula de identidad *</label>
              <input className="input" value={form.cedula}
                onChange={e => setField('cedula', e.target.value)}
                placeholder="V-XX.XXX.XXX" />
            </div>
            <div>
              <label className="label">Cargo</label>
              <input className="input" value={form.cargo}
                onChange={e => setField('cargo', e.target.value)}
                placeholder="Cargo desempeñado" />
            </div>
            <div>
              <label className="label">Empresa / Patrono *</label>
              <input className="input" value={form.nombreEmpresa}
                onChange={e => setField('nombreEmpresa', e.target.value)}
                placeholder="Nombre de la empresa" />
            </div>
          </div>
        </section>

        {/* Relación laboral */}
        <section className="card">
          <h2 className="font-semibold text-slate-900 mb-4">Relación laboral</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Fecha de ingreso *</label>
              <input className="input" type="date" value={form.fechaIngreso}
                onChange={e => setField('fechaIngreso', e.target.value)} />
            </div>
            <div>
              <label className="label">Fecha de egreso *</label>
              <input className="input" type="date" value={form.fechaEgreso}
                onChange={e => setField('fechaEgreso', e.target.value)} />
            </div>
            <div>
              <label className="label">Motivo de terminación *</label>
              <select className="input" value={form.motivoTerminacion}
                onChange={e => setField('motivoTerminacion', e.target.value)}>
                <option value="renuncia">Renuncia voluntaria</option>
                <option value="despido_justificado">Despido justificado</option>
                <option value="despido_injustificado">Despido injustificado</option>
              </select>
            </div>
          </div>
        </section>

        {/* Salario y parámetros */}
        <section className="card">
          <h2 className="font-semibold text-slate-900 mb-4">Salario y parámetros</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Salario mensual (Bs.) *</label>
              <input className="input text-right" type="number" min="0" step="0.01"
                value={form.salarioMensual}
                onChange={e => setField('salarioMensual', e.target.value)}
                placeholder="0.00" />
            </div>
            <div>
              <label className="label">Bonos mensuales (Bs.)</label>
              <input className="input text-right" type="number" min="0" step="0.01"
                value={form.bonosMensuales}
                onChange={e => setField('bonosMensuales', e.target.value)}
                placeholder="0.00" />
              <p className="text-xs text-slate-400 mt-1">
                Primas fijas, bonos de productividad o pagos regulares mensuales.
              </p>
            </div>
            <div>
              <label className="label">Días de utilidades anuales</label>
              <input className="input text-right" type="number" min="30" max="120"
                value={form.diasUtilidadesAnuales}
                onChange={e => setField('diasUtilidadesAnuales', e.target.value)}
                placeholder="30" />
              <p className="text-xs text-slate-400 mt-1">
                Mínimo legal LOTTT: 30 días. Puede ser mayor por contrato colectivo.
              </p>
            </div>
            <div>
              <label className="label">Días de bono vacacional anuales</label>
              <input className="input text-right" type="number" min="15" max="30"
                value={form.diasBonoVacacionalAnuales}
                onChange={e => setField('diasBonoVacacionalAnuales', e.target.value)}
                placeholder="15" />
              <p className="text-xs text-slate-400 mt-1">
                Base LOTTT: 15 días.
              </p>
            </div>
          </div>
        </section>

        {/* Preview de cálculos */}
        {preview && (
          <div className="card bg-brand-50 border-brand-200">
            <h3 className="font-semibold text-brand-900 mb-4">Vista previa del cálculo</h3>

            {/* Tiempo de servicio */}
            <div className="text-sm text-slate-600 mb-4">
              Tiempo de servicio: <span className="font-medium text-slate-800">
                {preview.aniosCompletos} año{preview.aniosCompletos !== 1 ? 's' : ''}
                {preview.mesesFraccion > 0 ? ` y ${preview.mesesFraccion} mes${preview.mesesFraccion !== 1 ? 'es' : ''}` : ''}
              </span>
              {' '}({preview.meses} meses, {preview.trimestresCompletos} trimestres)
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
                    Garantía trimestral (a,b): {preview.garantia.dias} días
                  </span>
                  <span className="font-medium">Bs. {fmt(preview.garantia.monto)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">
                    Retroactivo (c): {preview.retroactivo.dias} días
                  </span>
                  <span className="font-medium">Bs. {fmt(preview.retroactivo.monto)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-brand-100">
                  <span className="font-semibold text-slate-800">
                    Se aplica: {preview.metodoUsado}
                  </span>
                  <span className="font-bold text-brand-900">Bs. {fmt(preview.antiguedad.monto)}</span>
                </div>
              </div>
            </div>

            {/* Otros conceptos */}
            <div className="space-y-2 text-sm mb-4 pb-4 border-b border-brand-200">
              {form.motivoTerminacion === 'despido_injustificado' && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Indemnización Art. 92 (despido injustificado)</span>
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
                <span className="font-medium">Bs. {fmt(preview.bonoVacacional.monto)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">
                  Utilidades fraccionadas ({fmt(preview.utilidades.dias)} días)
                </span>
                <span className="font-medium">Bs. {fmt(preview.utilidades.monto)}</span>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between text-lg">
              <span className="font-bold text-slate-900">TOTAL A PAGAR</span>
              <span className="font-bold text-brand-900">Bs. {fmt(preview.total)}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <Link href="/dashboard/nuevo" className="btn-secondary">Cancelar</Link>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Enviando...' : 'Enviar trámite'}
          </button>
        </div>
      </form>
    </div>
  );
}
