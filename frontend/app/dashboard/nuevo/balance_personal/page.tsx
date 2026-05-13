'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

// ── tipos de fila ──────────────────────────────────────────────────────────
interface BancoRow    { banco: string; numeroCuenta: string; monto: string; }
interface SimpleRow   { concepto: string; monto: string; }
interface InmuebleRow { tipo: string; direccion: string; monto: string; }
interface VehiculoRow { descripcion: string; monto: string; }
interface PrestamoRow { banco: string; monto: string; }

const emptyBanco    = (): BancoRow    => ({ banco: '', numeroCuenta: '', monto: '' });
const emptyCobrar   = (): SimpleRow   => ({ concepto: '', monto: '' });
const emptyInmueble = (): InmuebleRow => ({ tipo: '', direccion: '', monto: '' });
const emptyVehiculo = (): VehiculoRow => ({ descripcion: '', monto: '' });
const emptyMueble   = (): SimpleRow   => ({ concepto: '', monto: '' });
const emptyInversion= (): SimpleRow   => ({ concepto: '', monto: '' });
const emptyPrestamo = (): PrestamoRow => ({ banco: '', monto: '' });
const emptyPagar    = (): SimpleRow   => ({ concepto: '', monto: '' });

function sum(rows: { monto: string }[]) {
  return rows.reduce((acc, r) => acc + (parseFloat(r.monto) || 0), 0);
}
function fmt(n: number) {
  return n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function addRow<T>(arr: T[], set: (a: T[]) => void, empty: () => T) {
  set([...arr, empty()]);
}
function removeRow<T>(arr: T[], set: (a: T[]) => void, i: number) {
  set(arr.filter((_, idx) => idx !== i));
}

export default function BalancePersonalPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const [form, setForm] = useState({
    nombreCliente:     '',
    cedula:            '',
    actividad:         '',
    direccion:         '',
    nombreInstitucion: '',
    fechaBalance:      '',
    ciudad:            '',
  });

  // activos corrientes
  const [cajaYBancos,      setCajaYBancos]      = useState<BancoRow[]>([emptyBanco()]);
  const [cuentasPorCobrar, setCuentasPorCobrar] = useState<SimpleRow[]>([]);
  // activos no corrientes
  const [inmuebles,   setInmuebles]   = useState<InmuebleRow[]>([]);
  const [vehiculos,   setVehiculos]   = useState<VehiculoRow[]>([]);
  const [muebles,     setMuebles]     = useState<SimpleRow[]>([]);
  const [inversiones, setInversiones] = useState<SimpleRow[]>([]);
  // pasivos
  const [prestamos,      setPrestamos]      = useState<PrestamoRow[]>([]);
  const [cuentasPorPagar,setCuentasPorPagar]= useState<SimpleRow[]>([]);

  function setField(key: keyof typeof form, val: string) {
    setForm(f => ({ ...f, [key]: val }));
  }

  function updateField<T extends object>(
    arr: T[], set: (a: T[]) => void, i: number, key: keyof T, val: string
  ) {
    set(arr.map((r, idx) => idx === i ? { ...r, [key]: val } : r));
  }

  // totales en tiempo real
  const totalCaja      = sum(cajaYBancos);
  const totalCobrar    = sum(cuentasPorCobrar);
  const totalACorriente = totalCaja + totalCobrar;

  const totalInmuebles = sum(inmuebles);
  const totalVehiculos = sum(vehiculos);
  const totalMuebles   = sum(muebles);
  const totalInversion = sum(inversiones);
  const totalANoCorriente = totalInmuebles + totalVehiculos + totalMuebles + totalInversion;

  const totalActivos   = totalACorriente + totalANoCorriente;
  const totalPrestamos = sum(prestamos);
  const totalPagar     = sum(cuentasPorPagar);
  const totalPasivos   = totalPrestamos + totalPagar;
  const patrimonio     = totalActivos - totalPasivos;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const requiredFields: (keyof typeof form)[] = [
      'nombreCliente','cedula','actividad','direccion',
      'nombreInstitucion','fechaBalance','ciudad',
    ];
    for (const f of requiredFields) {
      if (!form[f].trim()) {
        setError('Por favor completa todos los campos obligatorios.');
        return;
      }
    }
    if (totalActivos === 0) {
      setError('Agrega al menos un activo.');
      return;
    }

    setSaving(true);
    try {
      // aplanar activos y pasivos para la calculadora existente
      const activosFlat = [
        ...cajaYBancos.map(r => ({ concepto: `Banco: ${r.banco}`, monto: parseFloat(r.monto) || 0 })),
        ...cuentasPorCobrar.map(r => ({ concepto: r.concepto, monto: parseFloat(r.monto) || 0 })),
        ...inmuebles.map(r => ({ concepto: `Inmueble: ${r.tipo}`, monto: parseFloat(r.monto) || 0 })),
        ...vehiculos.map(r => ({ concepto: r.descripcion, monto: parseFloat(r.monto) || 0 })),
        ...muebles.map(r => ({ concepto: r.concepto, monto: parseFloat(r.monto) || 0 })),
        ...inversiones.map(r => ({ concepto: r.concepto, monto: parseFloat(r.monto) || 0 })),
      ];
      const pasivosFlat = [
        ...prestamos.map(r => ({ concepto: `Préstamo: ${r.banco}`, monto: parseFloat(r.monto) || 0 })),
        ...cuentasPorPagar.map(r => ({ concepto: r.concepto, monto: parseFloat(r.monto) || 0 })),
      ];

      const datos = {
        ...form,
        // detalle estructurado para el PDF
        cajaYBancos:      cajaYBancos.map(r => ({ ...r, monto: parseFloat(r.monto) || 0 })),
        cuentasPorCobrar: cuentasPorCobrar.map(r => ({ ...r, monto: parseFloat(r.monto) || 0 })),
        inmuebles:        inmuebles.map(r => ({ ...r, monto: parseFloat(r.monto) || 0 })),
        vehiculos:        vehiculos.map(r => ({ ...r, monto: parseFloat(r.monto) || 0 })),
        muebles:          muebles.map(r => ({ ...r, monto: parseFloat(r.monto) || 0 })),
        inversiones:      inversiones.map(r => ({ ...r, monto: parseFloat(r.monto) || 0 })),
        prestamos:        prestamos.map(r => ({ ...r, monto: parseFloat(r.monto) || 0 })),
        cuentasPorPagar:  cuentasPorPagar.map(r => ({ ...r, monto: parseFloat(r.monto) || 0 })),
        // plano para la calculadora
        activos: activosFlat,
        pasivos: pasivosFlat,
        ingresos: [],
        egresos: [],
      };

      await api('/tramites', {
        method: 'POST',
        body: JSON.stringify({ tipo: 'BALANCE_PERSONAL', datos }),
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
        <span className="text-slate-800 font-medium">Balance personal</span>
      </div>

      <h1 className="text-2xl font-bold mb-1">Balance personal</h1>
      <p className="text-slate-500 mb-8 text-sm">
        Estado de situación financiera personal. El contador compilará y emitirá el informe oficial.
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
                placeholder="Dirección completa" />
            </div>
          </div>
        </section>

        {/* Destinatario y fecha */}
        <section className="card">
          <h2 className="font-semibold text-slate-900 mb-4">Destinatario y fecha</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Institución o banco destinatario *</label>
              <input className="input" value={form.nombreInstitucion}
                onChange={e => setField('nombreInstitucion', e.target.value)}
                placeholder="Nombre del banco u organismo" />
            </div>
            <div>
              <label className="label">Fecha del balance *</label>
              <input className="input" type="date" value={form.fechaBalance}
                onChange={e => setField('fechaBalance', e.target.value)} />
            </div>
            <div>
              <label className="label">Ciudad *</label>
              <input className="input" value={form.ciudad}
                onChange={e => setField('ciudad', e.target.value)}
                placeholder="Ej: Caracas" />
            </div>
          </div>
        </section>

        {/* ── ACTIVOS CORRIENTES ────────────────────────────────────── */}
        <section className="card">
          <h2 className="font-semibold text-slate-900 mb-1">Activos corrientes</h2>
          <p className="text-xs text-slate-500 mb-5">Cuentas bancarias y cuentas por cobrar.</p>

          {/* Caja y Bancos */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-700">Caja y Bancos</h3>
              <button type="button" onClick={() => addRow(cajaYBancos, setCajaYBancos, emptyBanco)}
                className="btn-secondary text-xs px-2 py-1">+ Agregar</button>
            </div>
            <div className="space-y-2">
              {cajaYBancos.map((row, i) => (
                <div key={i} className="grid gap-2 sm:grid-cols-3 items-end">
                  <div>
                    <label className="label text-xs">Banco / Efectivo</label>
                    <input className="input text-sm" value={row.banco}
                      onChange={e => updateField(cajaYBancos, setCajaYBancos, i, 'banco', e.target.value)}
                      placeholder="Ej: Banco de Venezuela" />
                  </div>
                  <div>
                    <label className="label text-xs">N° de cuenta</label>
                    <input className="input text-sm" value={row.numeroCuenta}
                      onChange={e => updateField(cajaYBancos, setCajaYBancos, i, 'numeroCuenta', e.target.value)}
                      placeholder="0102-XXXX-XXXX" />
                  </div>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="label text-xs">Monto (Bs.)</label>
                      <input className="input text-sm text-right" type="number" min="0" step="0.01"
                        value={row.monto}
                        onChange={e => updateField(cajaYBancos, setCajaYBancos, i, 'monto', e.target.value)}
                        placeholder="0.00" />
                    </div>
                    {cajaYBancos.length > 1 && (
                      <button type="button" onClick={() => removeRow(cajaYBancos, setCajaYBancos, i)}
                        className="text-red-400 hover:text-red-600 text-xl mb-2">×</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-right text-xs text-slate-500 mt-2">
              Subtotal: <span className="font-medium">Bs. {fmt(totalCaja)}</span>
            </p>
          </div>

          {/* Cuentas por Cobrar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-700">Cuentas por cobrar</h3>
              <button type="button" onClick={() => addRow(cuentasPorCobrar, setCuentasPorCobrar, emptyCobrar)}
                className="btn-secondary text-xs px-2 py-1">+ Agregar</button>
            </div>
            {cuentasPorCobrar.length === 0
              ? <p className="text-xs text-slate-400 italic">Sin cuentas por cobrar.</p>
              : (
                <div className="space-y-2">
                  {cuentasPorCobrar.map((row, i) => (
                    <div key={i} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="label text-xs">Concepto</label>
                        <input className="input text-sm" value={row.concepto}
                          onChange={e => updateField(cuentasPorCobrar, setCuentasPorCobrar, i, 'concepto', e.target.value)}
                          placeholder="Ej: Préstamo a familiar" />
                      </div>
                      <div className="w-36">
                        <label className="label text-xs">Monto (Bs.)</label>
                        <input className="input text-sm text-right" type="number" min="0" step="0.01"
                          value={row.monto}
                          onChange={e => updateField(cuentasPorCobrar, setCuentasPorCobrar, i, 'monto', e.target.value)}
                          placeholder="0.00" />
                      </div>
                      <button type="button" onClick={() => removeRow(cuentasPorCobrar, setCuentasPorCobrar, i)}
                        className="text-red-400 hover:text-red-600 text-xl mb-2">×</button>
                    </div>
                  ))}
                </div>
              )
            }
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-right text-sm">
            <span className="text-slate-600">Total activos corrientes: </span>
            <span className="font-semibold">Bs. {fmt(totalACorriente)}</span>
          </div>
        </section>

        {/* ── ACTIVOS NO CORRIENTES ─────────────────────────────────── */}
        <section className="card">
          <h2 className="font-semibold text-slate-900 mb-1">Activos no corrientes</h2>
          <p className="text-xs text-slate-500 mb-5">Inmuebles, vehículos, muebles e inversiones.</p>

          {/* Inmuebles */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-700">Inmuebles</h3>
              <button type="button" onClick={() => addRow(inmuebles, setInmuebles, emptyInmueble)}
                className="btn-secondary text-xs px-2 py-1">+ Agregar</button>
            </div>
            {inmuebles.length === 0
              ? <p className="text-xs text-slate-400 italic">Sin inmuebles registrados.</p>
              : (
                <div className="space-y-2">
                  {inmuebles.map((row, i) => (
                    <div key={i} className="grid gap-2 sm:grid-cols-3 items-end">
                      <div>
                        <label className="label text-xs">Tipo de inmueble</label>
                        <input className="input text-sm" value={row.tipo}
                          onChange={e => updateField(inmuebles, setInmuebles, i, 'tipo', e.target.value)}
                          placeholder="Ej: Apartamento" />
                      </div>
                      <div>
                        <label className="label text-xs">Dirección</label>
                        <input className="input text-sm" value={row.direccion}
                          onChange={e => updateField(inmuebles, setInmuebles, i, 'direccion', e.target.value)}
                          placeholder="Dirección del inmueble" />
                      </div>
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <label className="label text-xs">Valor estimado (Bs.)</label>
                          <input className="input text-sm text-right" type="number" min="0" step="0.01"
                            value={row.monto}
                            onChange={e => updateField(inmuebles, setInmuebles, i, 'monto', e.target.value)}
                            placeholder="0.00" />
                        </div>
                        <button type="button" onClick={() => removeRow(inmuebles, setInmuebles, i)}
                          className="text-red-400 hover:text-red-600 text-xl mb-2">×</button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </div>

          {/* Vehículos */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-700">Vehículos</h3>
              <button type="button" onClick={() => addRow(vehiculos, setVehiculos, emptyVehiculo)}
                className="btn-secondary text-xs px-2 py-1">+ Agregar</button>
            </div>
            {vehiculos.length === 0
              ? <p className="text-xs text-slate-400 italic">Sin vehículos registrados.</p>
              : (
                <div className="space-y-2">
                  {vehiculos.map((row, i) => (
                    <div key={i} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="label text-xs">Descripción</label>
                        <input className="input text-sm" value={row.descripcion}
                          onChange={e => updateField(vehiculos, setVehiculos, i, 'descripcion', e.target.value)}
                          placeholder="Ej: Toyota Corolla 2018" />
                      </div>
                      <div className="w-40">
                        <label className="label text-xs">Valor estimado (Bs.)</label>
                        <input className="input text-sm text-right" type="number" min="0" step="0.01"
                          value={row.monto}
                          onChange={e => updateField(vehiculos, setVehiculos, i, 'monto', e.target.value)}
                          placeholder="0.00" />
                      </div>
                      <button type="button" onClick={() => removeRow(vehiculos, setVehiculos, i)}
                        className="text-red-400 hover:text-red-600 text-xl mb-2">×</button>
                    </div>
                  ))}
                </div>
              )
            }
          </div>

          {/* Muebles y Enseres */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-700">Muebles y enseres del hogar</h3>
              <button type="button" onClick={() => addRow(muebles, setMuebles, emptyMueble)}
                className="btn-secondary text-xs px-2 py-1">+ Agregar</button>
            </div>
            {muebles.length === 0
              ? <p className="text-xs text-slate-400 italic">Sin muebles registrados.</p>
              : (
                <div className="space-y-2">
                  {muebles.map((row, i) => (
                    <div key={i} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="label text-xs">Descripción</label>
                        <input className="input text-sm" value={row.concepto}
                          onChange={e => updateField(muebles, setMuebles, i, 'concepto', e.target.value)}
                          placeholder="Ej: Menaje del hogar en general" />
                      </div>
                      <div className="w-40">
                        <label className="label text-xs">Valor estimado (Bs.)</label>
                        <input className="input text-sm text-right" type="number" min="0" step="0.01"
                          value={row.monto}
                          onChange={e => updateField(muebles, setMuebles, i, 'monto', e.target.value)}
                          placeholder="0.00" />
                      </div>
                      <button type="button" onClick={() => removeRow(muebles, setMuebles, i)}
                        className="text-red-400 hover:text-red-600 text-xl mb-2">×</button>
                    </div>
                  ))}
                </div>
              )
            }
          </div>

          {/* Inversiones */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-700">Inversiones</h3>
              <button type="button" onClick={() => addRow(inversiones, setInversiones, emptyInversion)}
                className="btn-secondary text-xs px-2 py-1">+ Agregar</button>
            </div>
            {inversiones.length === 0
              ? <p className="text-xs text-slate-400 italic">Sin inversiones registradas.</p>
              : (
                <div className="space-y-2">
                  {inversiones.map((row, i) => (
                    <div key={i} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="label text-xs">Descripción</label>
                        <input className="input text-sm" value={row.concepto}
                          onChange={e => updateField(inversiones, setInversiones, i, 'concepto', e.target.value)}
                          placeholder="Ej: Acciones, participación societaria" />
                      </div>
                      <div className="w-40">
                        <label className="label text-xs">Monto (Bs.)</label>
                        <input className="input text-sm text-right" type="number" min="0" step="0.01"
                          value={row.monto}
                          onChange={e => updateField(inversiones, setInversiones, i, 'monto', e.target.value)}
                          placeholder="0.00" />
                      </div>
                      <button type="button" onClick={() => removeRow(inversiones, setInversiones, i)}
                        className="text-red-400 hover:text-red-600 text-xl mb-2">×</button>
                    </div>
                  ))}
                </div>
              )
            }
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-right text-sm">
            <span className="text-slate-600">Total activos no corrientes: </span>
            <span className="font-semibold">Bs. {fmt(totalANoCorriente)}</span>
          </div>
        </section>

        {/* ── PASIVOS ───────────────────────────────────────────────── */}
        <section className="card">
          <h2 className="font-semibold text-slate-900 mb-1">Pasivos</h2>
          <p className="text-xs text-slate-500 mb-5">Préstamos y cuentas por pagar.</p>

          {/* Préstamos */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-700">Préstamos bancarios</h3>
              <button type="button" onClick={() => addRow(prestamos, setPrestamos, emptyPrestamo)}
                className="btn-secondary text-xs px-2 py-1">+ Agregar</button>
            </div>
            {prestamos.length === 0
              ? <p className="text-xs text-slate-400 italic">Sin préstamos registrados.</p>
              : (
                <div className="space-y-2">
                  {prestamos.map((row, i) => (
                    <div key={i} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="label text-xs">Banco / Institución</label>
                        <input className="input text-sm" value={row.banco}
                          onChange={e => updateField(prestamos, setPrestamos, i, 'banco', e.target.value)}
                          placeholder="Ej: Banesco" />
                      </div>
                      <div className="w-40">
                        <label className="label text-xs">Monto (Bs.)</label>
                        <input className="input text-sm text-right" type="number" min="0" step="0.01"
                          value={row.monto}
                          onChange={e => updateField(prestamos, setPrestamos, i, 'monto', e.target.value)}
                          placeholder="0.00" />
                      </div>
                      <button type="button" onClick={() => removeRow(prestamos, setPrestamos, i)}
                        className="text-red-400 hover:text-red-600 text-xl mb-2">×</button>
                    </div>
                  ))}
                </div>
              )
            }
          </div>

          {/* Cuentas por Pagar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-700">Cuentas por pagar</h3>
              <button type="button" onClick={() => addRow(cuentasPorPagar, setCuentasPorPagar, emptyPagar)}
                className="btn-secondary text-xs px-2 py-1">+ Agregar</button>
            </div>
            {cuentasPorPagar.length === 0
              ? <p className="text-xs text-slate-400 italic">Sin cuentas por pagar.</p>
              : (
                <div className="space-y-2">
                  {cuentasPorPagar.map((row, i) => (
                    <div key={i} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="label text-xs">Concepto</label>
                        <input className="input text-sm" value={row.concepto}
                          onChange={e => updateField(cuentasPorPagar, setCuentasPorPagar, i, 'concepto', e.target.value)}
                          placeholder="Ej: Deuda a proveedor" />
                      </div>
                      <div className="w-40">
                        <label className="label text-xs">Monto (Bs.)</label>
                        <input className="input text-sm text-right" type="number" min="0" step="0.01"
                          value={row.monto}
                          onChange={e => updateField(cuentasPorPagar, setCuentasPorPagar, i, 'monto', e.target.value)}
                          placeholder="0.00" />
                      </div>
                      <button type="button" onClick={() => removeRow(cuentasPorPagar, setCuentasPorPagar, i)}
                        className="text-red-400 hover:text-red-600 text-xl mb-2">×</button>
                    </div>
                  ))}
                </div>
              )
            }
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-right text-sm">
            <span className="text-slate-600">Total pasivos: </span>
            <span className="font-semibold">Bs. {fmt(totalPasivos)}</span>
          </div>
        </section>

        {/* ── RESUMEN ───────────────────────────────────────────────── */}
        {totalActivos > 0 && (
          <div className="card bg-brand-50 border-brand-200">
            <h3 className="font-semibold text-brand-900 mb-3">Estado de situación financiera — resumen</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Activos corrientes</span>
                <span>Bs. {fmt(totalACorriente)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Activos no corrientes</span>
                <span>Bs. {fmt(totalANoCorriente)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t border-brand-200 pt-1">
                <span>TOTAL ACTIVOS</span>
                <span>Bs. {fmt(totalActivos)}</span>
              </div>
              <div className="flex justify-between text-slate-600 pt-2">
                <span>Total pasivos</span>
                <span>Bs. {fmt(totalPasivos)}</span>
              </div>
              <div className={`flex justify-between font-bold text-base border-t border-brand-300 pt-2 ${patrimonio >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                <span>PATRIMONIO NETO</span>
                <span>Bs. {fmt(patrimonio)}</span>
              </div>
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
