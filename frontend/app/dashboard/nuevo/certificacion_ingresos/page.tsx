'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface IngresoRow { concepto: string; monto: string; }
interface EgresoRow  { concepto: string; monto: string; }

const emptyIngreso = (): IngresoRow => ({ concepto: '', monto: '' });
const emptyEgreso  = (): EgresoRow  => ({ concepto: '', monto: '' });

function sum(rows: { monto: string }[]) {
  return rows.reduce((acc, r) => acc + (parseFloat(r.monto) || 0), 0);
}

function fmt(n: number) {
  return n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CertificacionIngresosPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const [form, setForm] = useState({
    nombreCliente:      '',
    cedula:             '',
    actividad:          '',
    direccion:          '',
    nombreInstitucion:  '',
    periodoDesde:       '',
    periodoHasta:       '',
    ciudad:             '',
  });

  const [ingresos, setIngresos] = useState<IngresoRow[]>([emptyIngreso()]);
  const [egresos,  setEgresos]  = useState<EgresoRow[]>([]);

  function setField(key: keyof typeof form, val: string) {
    setForm(f => ({ ...f, [key]: val }));
  }

  function updateRow<T extends { concepto: string; monto: string }>(
    arr: T[], setArr: (a: T[]) => void, i: number, key: keyof T, val: string
  ) {
    const next = arr.map((r, idx) => idx === i ? { ...r, [key]: val } : r);
    setArr(next);
  }

  function addRow<T>(arr: T[], setArr: (a: T[]) => void, empty: () => T) {
    setArr([...arr, empty()]);
  }

  function removeRow<T>(arr: T[], setArr: (a: T[]) => void, i: number) {
    setArr(arr.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const requiredFields: (keyof typeof form)[] = [
      'nombreCliente', 'cedula', 'actividad', 'direccion',
      'nombreInstitucion', 'periodoDesde', 'periodoHasta', 'ciudad',
    ];
    for (const f of requiredFields) {
      if (!form[f].trim()) {
        setError('Por favor completa todos los campos obligatorios.');
        return;
      }
    }
    if (ingresos.length === 0 || ingresos.some(r => !r.concepto || !r.monto)) {
      setError('Agrega al menos un ingreso con concepto y monto.');
      return;
    }

    setSaving(true);
    try {
      const datos = {
        ...form,
        ingresos: ingresos.map(r => ({ concepto: r.concepto, monto: parseFloat(r.monto) || 0 })),
        egresos:  egresos.map(r  => ({ concepto: r.concepto,  monto: parseFloat(r.monto)  || 0 })),
      };
      await api('/tramites', {
        method: 'POST',
        body: JSON.stringify({ tipo: 'CERTIFICACION_INGRESOS', datos }),
      });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al guardar el trámite.');
    } finally {
      setSaving(false);
    }
  }

  const totalIngresos = sum(ingresos);
  const totalEgresos  = sum(egresos);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-6 text-sm text-slate-500">
        <Link href="/dashboard/nuevo" className="hover:underline">Nuevo trámite</Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">Certificación de ingresos</span>
      </div>

      <h1 className="text-2xl font-bold mb-1">Certificación de ingresos</h1>
      <p className="text-slate-500 mb-8 text-sm">
        Completa los datos. El contador revisará y emitirá el informe oficial.
      </p>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Datos del cliente */}
        <section className="card">
          <h2 className="font-semibold text-slate-900 mb-4">Datos del cliente</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Nombre completo *</label>
              <input className="input" value={form.nombreCliente}
                onChange={e => setField('nombreCliente', e.target.value)}
                placeholder="Nombre Apellido" />
            </div>
            <div>
              <label className="label">Cédula de identidad *</label>
              <input className="input" value={form.cedula}
                onChange={e => setField('cedula', e.target.value)}
                placeholder="V-XX.XXX.XXX" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Actividad económica *</label>
              <input className="input" value={form.actividad}
                onChange={e => setField('actividad', e.target.value)}
                placeholder="Ej: Médico independiente, Comerciante, etc." />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Dirección *</label>
              <input className="input" value={form.direccion}
                onChange={e => setField('direccion', e.target.value)}
                placeholder="Dirección completa de residencia o negocio" />
            </div>
          </div>
        </section>

        {/* Destinatario y período */}
        <section className="card">
          <h2 className="font-semibold text-slate-900 mb-4">Destinatario y período</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Institución o banco destinatario *</label>
              <input className="input" value={form.nombreInstitucion}
                onChange={e => setField('nombreInstitucion', e.target.value)}
                placeholder="Nombre del banco u organismo que solicita el informe" />
            </div>
            <div>
              <label className="label">Período desde *</label>
              <input className="input" type="date" value={form.periodoDesde}
                onChange={e => setField('periodoDesde', e.target.value)} />
            </div>
            <div>
              <label className="label">Período hasta *</label>
              <input className="input" type="date" value={form.periodoHasta}
                onChange={e => setField('periodoHasta', e.target.value)} />
            </div>
            <div>
              <label className="label">Ciudad *</label>
              <input className="input" value={form.ciudad}
                onChange={e => setField('ciudad', e.target.value)}
                placeholder="Ej: Caracas" />
            </div>
          </div>
        </section>

        {/* Ingresos */}
        <section className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Relación de ingresos *</h2>
            <button
              type="button"
              onClick={() => addRow(ingresos, setIngresos, emptyIngreso)}
              className="btn-secondary text-xs px-3 py-1"
            >
              + Agregar fila
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left p-2 font-medium text-slate-600">Concepto / Descripción</th>
                  <th className="text-right p-2 font-medium text-slate-600 w-40">Monto (Bs.)</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {ingresos.map((row, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="p-1">
                      <input
                        className="input text-sm"
                        value={row.concepto}
                        onChange={e => updateRow(ingresos, setIngresos, i, 'concepto', e.target.value)}
                        placeholder="Ej: Honorarios profesionales enero"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        className="input text-sm text-right"
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.monto}
                        onChange={e => updateRow(ingresos, setIngresos, i, 'monto', e.target.value)}
                        placeholder="0.00"
                      />
                    </td>
                    <td className="p-1 text-center">
                      {ingresos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRow(ingresos, setIngresos, i)}
                          className="text-red-400 hover:text-red-600 text-lg leading-none"
                        >×</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50">
                  <td className="p-2 font-semibold text-slate-700">TOTAL INGRESOS</td>
                  <td className="p-2 font-semibold text-slate-900 text-right">Bs. {fmt(totalIngresos)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* Egresos (opcional) */}
        <section className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-900">Egresos</h2>
              <p className="text-xs text-slate-500 mt-0.5">Opcional — para mostrar flujo neto</p>
            </div>
            <button
              type="button"
              onClick={() => addRow(egresos, setEgresos, emptyEgreso)}
              className="btn-secondary text-xs px-3 py-1"
            >
              + Agregar fila
            </button>
          </div>
          {egresos.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Sin egresos registrados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left p-2 font-medium text-slate-600">Concepto</th>
                    <th className="text-right p-2 font-medium text-slate-600 w-40">Monto (Bs.)</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {egresos.map((row, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="p-1">
                        <input
                          className="input text-sm"
                          value={row.concepto}
                          onChange={e => updateRow(egresos, setEgresos, i, 'concepto', e.target.value)}
                          placeholder="Ej: Gastos operativos"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          className="input text-sm text-right"
                          type="number"
                          min="0"
                          step="0.01"
                          value={row.monto}
                          onChange={e => updateRow(egresos, setEgresos, i, 'monto', e.target.value)}
                          placeholder="0.00"
                        />
                      </td>
                      <td className="p-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeRow(egresos, setEgresos, i)}
                          className="text-red-400 hover:text-red-600 text-lg leading-none"
                        >×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50">
                    <td className="p-2 font-semibold text-slate-700">TOTAL EGRESOS</td>
                    <td className="p-2 font-semibold text-slate-900 text-right">Bs. {fmt(totalEgresos)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>

        {/* Resumen */}
        {(totalIngresos > 0 || totalEgresos > 0) && (
          <div className="card bg-brand-50 border-brand-200">
            <h3 className="font-semibold text-brand-900 mb-3">Resumen</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Total ingresos</span>
                <span className="font-medium">Bs. {fmt(totalIngresos)}</span>
              </div>
              {totalEgresos > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total egresos</span>
                    <span className="font-medium">Bs. {fmt(totalEgresos)}</span>
                  </div>
                  <div className="flex justify-between border-t border-brand-200 pt-1 mt-1">
                    <span className="font-semibold text-slate-800">Flujo neto mensual</span>
                    <span className={`font-bold ${totalIngresos - totalEgresos >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      Bs. {fmt(totalIngresos - totalEgresos)}
                    </span>
                  </div>
                </>
              )}
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
            {saving ? 'Enviando…' : 'Enviar trámite'}
          </button>
        </div>
      </form>
    </div>
  );
}
