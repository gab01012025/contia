// Modulo Prestaciones Sociales - LOTTT Venezuela
// IMPORTANTE: las formulas se VALIDARAN con el Dr. Jose antes de produccion.
// Esta es una version base v0.1 segun lectura general de la LOTTT.
// Articulos referenciados: 142 (garantia y calculo de prestaciones),
// 190 (vacaciones), 192 (bono vacacional), 131-132 (utilidades),
// 92 (indemnizacion por despido injustificado).

function diffMeses(desde, hasta) {
  const d1 = new Date(desde);
  const d2 = new Date(hasta);
  let meses = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
  if (d2.getDate() < d1.getDate()) meses -= 1;
  return Math.max(0, meses);
}

function diffAnios(desde, hasta) {
  return diffMeses(desde, hasta) / 12;
}

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function calcularPrestaciones({
  fechaIngreso,
  fechaEgreso,
  salarioMensual,
  bonosMensuales = 0,
  motivoTerminacion = 'renuncia', // renuncia | despido_justificado | despido_injustificado
  diasUtilidadesAnuales = 30,     // minimo legal LOTTT 30 dias, configurable
  diasBonoVacacionalAnuales = 15, // base LOTTT, +1 por cada año adicional (Art. 192)
}) {
  if (!fechaIngreso || !fechaEgreso) {
    throw new Error('Fechas de ingreso y egreso son obligatorias');
  }

  const meses = diffMeses(fechaIngreso, fechaEgreso);
  const anios = round2(meses / 12);
  const salario = Number(salarioMensual) || 0;
  const bonos = Number(bonosMensuales) || 0;

  // Salario integral diario:
  // = (salario + bonos) / 30 + alicuota utilidades + alicuota bono vacacional
  const salarioMensualTotal = salario + bonos;
  const salarioDiario = round2(salarioMensualTotal / 30);

  const alicUtilidadesDiaria = round2((salarioDiario * diasUtilidadesAnuales) / 360);
  const alicBonoVacDiaria = round2((salarioDiario * diasBonoVacacionalAnuales) / 360);
  const salarioIntegralDiario = round2(salarioDiario + alicUtilidadesDiaria + alicBonoVacDiaria);

  // Garantia de prestaciones (Art. 142 LOTTT):
  // 15 dias por trimestre laborado + 2 dias adicionales por cada año (acumulables)
  const trimestresCompletos = Math.floor(meses / 3);
  const diasGarantiaTrimestral = trimestresCompletos * 15;
  const aniosCompletos = Math.floor(meses / 12);
  // 2 dias adicionales por año despues del primer año
  const diasAdicionales = aniosCompletos > 1 ? (aniosCompletos - 1) * 2 : 0;
  const totalDiasAntiguedad = diasGarantiaTrimestral + diasAdicionales;
  const montoAntiguedad = round2(totalDiasAntiguedad * salarioIntegralDiario);

  // Indemnizacion por despido injustificado (Art. 92): igual al monto de antiguedad
  let indemnizacion = 0;
  if (motivoTerminacion === 'despido_injustificado') {
    indemnizacion = montoAntiguedad;
  }

  // Vacaciones fraccionadas pendientes
  // Base LOTTT 15 dias primer año + 1 dia por cada año adicional
  const diasVacacionalesAnio = 15 + Math.max(0, aniosCompletos - 1);
  const mesesFraccionVac = meses % 12;
  const diasVacFraccionados = round2((diasVacacionalesAnio * mesesFraccionVac) / 12);
  const montoVacacionesFraccionadas = round2(diasVacFraccionados * salarioDiario);

  // Bono vacacional fraccionado
  const diasBonoVacAnioActual = diasBonoVacacionalAnuales + Math.max(0, aniosCompletos - 1);
  const diasBonoVacFraccionados = round2((diasBonoVacAnioActual * mesesFraccionVac) / 12);
  const montoBonoVacFraccionado = round2(diasBonoVacFraccionados * salarioDiario);

  // Utilidades fraccionadas (anio en curso)
  const mesesUtilidadesActual = meses % 12;
  const diasUtilFraccionados = round2((diasUtilidadesAnuales * mesesUtilidadesActual) / 12);
  const montoUtilidadesFraccionadas = round2(diasUtilFraccionados * salarioDiario);

  const totalAPagar = round2(
    montoAntiguedad +
      indemnizacion +
      montoVacacionesFraccionadas +
      montoBonoVacFraccionado +
      montoUtilidadesFraccionadas
  );

  return {
    inputs: {
      fechaIngreso,
      fechaEgreso,
      salarioMensual: salario,
      bonosMensuales: bonos,
      motivoTerminacion,
      diasUtilidadesAnuales,
      diasBonoVacacionalAnuales,
    },
    tiempoServicio: { meses, anios, aniosCompletos, trimestresCompletos },
    salarioBase: {
      salarioMensualTotal,
      salarioDiario,
      alicuotaUtilidadesDiaria: alicUtilidadesDiaria,
      alicuotaBonoVacacionalDiaria: alicBonoVacDiaria,
      salarioIntegralDiario,
    },
    conceptos: {
      antiguedad: {
        dias: totalDiasAntiguedad,
        monto: montoAntiguedad,
        baseLegal: 'Art. 142 LOTTT',
      },
      indemnizacion: {
        aplica: motivoTerminacion === 'despido_injustificado',
        monto: indemnizacion,
        baseLegal: 'Art. 92 LOTTT',
      },
      vacacionesFraccionadas: {
        dias: diasVacFraccionados,
        monto: montoVacacionesFraccionadas,
        baseLegal: 'Art. 190 LOTTT',
      },
      bonoVacacionalFraccionado: {
        dias: diasBonoVacFraccionados,
        monto: montoBonoVacFraccionado,
        baseLegal: 'Art. 192 LOTTT',
      },
      utilidadesFraccionadas: {
        dias: diasUtilFraccionados,
        monto: montoUtilidadesFraccionadas,
        baseLegal: 'Art. 131-132 LOTTT',
      },
    },
    totalAPagar,
    advertencia:
      'Calculo referencial basado en LOTTT. Las cifras deben ser validadas por un profesional antes de uso oficial.',
  };
}

module.exports = { calcularPrestaciones };
