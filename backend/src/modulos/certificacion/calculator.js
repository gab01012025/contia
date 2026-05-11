// Modulo Certificacion / Balance personal
// No requiere calculos complejos: solo totales basicos

function calcularBalance({ ingresos = [], egresos = [], activos = [], pasivos = [] }) {
  const sum = (arr) =>
    arr.reduce((acc, x) => acc + (Number(x.monto) || 0), 0);

  const totalIngresos = round2(sum(ingresos));
  const totalEgresos = round2(sum(egresos));
  const flujoMensual = round2(totalIngresos - totalEgresos);

  const totalActivos = round2(sum(activos));
  const totalPasivos = round2(sum(pasivos));
  const patrimonioNeto = round2(totalActivos - totalPasivos);

  return {
    totalIngresos,
    totalEgresos,
    flujoMensual,
    totalActivos,
    totalPasivos,
    patrimonioNeto,
  };
}

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

module.exports = { calcularBalance };
