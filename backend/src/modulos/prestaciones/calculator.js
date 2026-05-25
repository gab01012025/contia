// Modulo Prestaciones Sociales - LOTTT Venezuela
// v0.2 - Validado con el Dr. Jose (mayo 2026)
// Articulos referenciados: 142 literales a,b,c (garantia y calculo retroactivo),
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

  // ============================================================
  // ANTIGÜEDAD - Doble cálculo obligatorio (Art. 142 LOTTT)
  // ============================================================
  const trimestresCompletos = Math.floor(meses / 3);
  const aniosCompletos = Math.floor(meses / 12);
  const mesesFraccion = meses % 12;

  // --- Cálculo A: Garantía trimestral (Art. 142 literales a y b) ---
  // 15 días por trimestre + 2 días adicionales por año a partir del 2do
  const diasGarantiaTrimestral = trimestresCompletos * 15;
  const diasAdicionales = aniosCompletos > 1 ? (aniosCompletos - 1) * 2 : 0;
  const totalDiasGarantia = diasGarantiaTrimestral + diasAdicionales;
  const montoGarantia = round2(totalDiasGarantia * salarioIntegralDiario);

  // --- Cálculo B: Retroactivo (Art. 142 literal c) ---
  // 30 días por cada año trabajado. Fracción > 6 meses = año completo adicional.
  const aniosRetroactivos = mesesFraccion > 6 ? aniosCompletos + 1 : aniosCompletos;
  const diasRetroactivos = aniosRetroactivos * 30;
  const montoRetroactivo = round2(diasRetroactivos * salarioIntegralDiario);

  // --- Resultado: se paga el MAYOR de ambos cálculos ---
  const usaRetroactivo = montoRetroactivo > montoGarantia;
  const totalDiasAntiguedad = usaRetroactivo ? diasRetroactivos : totalDiasGarantia;
  const montoAntiguedad = usaRetroactivo ? montoRetroactivo : montoGarantia;

  // ============================================================
  // INDEMNIZACIÓN por despido injustificado (Art. 92 LOTTT)
  // Se duplica el resultado mayor de antigüedad
  // ============================================================
  let indemnizacion = 0;
  if (motivoTerminacion === 'despido_injustificado') {
    indemnizacion = montoAntiguedad;
  }

  // ============================================================
  // VACACIONES FRACCIONADAS (Art. 190 LOTTT)
  // 15 días base + 1 por año adicional, tope máximo 30 días hábiles
  // ============================================================
  const diasVacacionalesAnio = Math.min(15 + Math.max(0, aniosCompletos - 1), 30);
  const mesesFraccionVac = mesesFraccion;
  const diasVacFraccionados = round2((diasVacacionalesAnio * mesesFraccionVac) / 12);
  const montoVacacionesFraccionadas = round2(diasVacFraccionados * salarioDiario);

  // ============================================================
  // BONO VACACIONAL FRACCIONADO (Art. 192 LOTTT)
  // Mismo esquema de días con tope de 30
  // ============================================================
  const diasBonoVacAnioActual = Math.min(diasBonoVacacionalAnuales + Math.max(0, aniosCompletos - 1), 30);
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
        metodoUsado: usaRetroactivo ? 'retroactivo' : 'garantia_trimestral',
        detalleDobleCalculo: {
          garantia: { dias: totalDiasGarantia, monto: montoGarantia },
          retroactivo: { dias: diasRetroactivos, monto: montoRetroactivo },
        },
        baseLegal: 'Art. 142 LOTTT (literales a, b, c)',
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
      'Cálculo referencial basado en LOTTT (Art. 142, 190, 192, 131-132, 92). Fórmulas validadas con el Dr. José. Las cifras deben ser verificadas por un profesional antes de uso oficial.',
  };
}

module.exports = { calcularPrestaciones };
