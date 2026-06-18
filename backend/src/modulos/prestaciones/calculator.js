// ============================================================================
// Módulo Prestaciones Sociales - LOTTT Venezuela
// v2.0 - Reescritura completa (mayo 2026)
// Artículos referenciados: 142 literales a, b, c (garantía y cálculo retroactivo),
// 190 (vacaciones), 192 (bono vacacional), 131-132 (utilidades),
// 92 (indemnización por despido injustificado).
//
// Soporta tres escenarios:
//   A - Fideicomiso (montos manuales de garantía e intereses)
//   B - Sin fideicomiso, con historial de salarios (cálculo trimestral + intereses BCV)
//   C - Sin fideicomiso ni historial (solo retroactivo + intereses acordados)
// ============================================================================

const path = require('path');

// ---- Carga de tasas BCV ----
const tasasBCV = require(path.join(__dirname, 'tasas-bcv.json'));

// ============================================================================
// UTILIDADES GENERALES
// ============================================================================

/**
 * Redondea a 2 decimales de forma segura.
 */
function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

/**
 * Convierte un string o Date a un objeto Date normalizado (sin hora).
 * Se crea siempre a medianoche UTC para evitar problemas de zona horaria.
 */
function toDate(d) {
  if (d instanceof Date) {
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  }
  // Si es string "YYYY-MM-DD", parseamos manualmente para evitar timezone shifts
  const parts = String(d).split('-').map(Number);
  return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
}

/**
 * Devuelve la clave "YYYY-MM" para buscar en el JSON de tasas BCV.
 */
function claveYYYYMM(date) {
  const d = toDate(date);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Cálculo exacto de diferencia entre dos fechas.
 * Retorna { anios, meses, dias, totalMeses, totalDias, descripcion }.
 *
 * - anios: años completos
 * - meses: meses restantes tras descontar años
 * - dias: días restantes tras descontar años y meses
 * - totalMeses: total de meses completos
 * - totalDias: total de días calendario entre ambas fechas
 */
function diffExacto(desde, hasta) {
  const d1 = toDate(desde);
  const d2 = toDate(hasta);

  // Total días calendario (+1 inclusivo: LOTTT cuenta tanto ingreso como egreso)
  const totalDias = Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;

  // Cálculo de años, meses y días exactos
  let anios = d2.getUTCFullYear() - d1.getUTCFullYear();
  let meses = d2.getUTCMonth() - d1.getUTCMonth();
  let dias = d2.getUTCDate() - d1.getUTCDate();

  // Ajustar si los días son negativos (retroceder un mes)
  if (dias < 0) {
    meses -= 1;
    // Días del mes anterior al mes de d2
    const mesAnterior = new Date(Date.UTC(d2.getUTCFullYear(), d2.getUTCMonth(), 0));
    dias += mesAnterior.getUTCDate();
  }

  // Ajustar si los meses son negativos (retroceder un año)
  if (meses < 0) {
    anios -= 1;
    meses += 12;
  }

  const totalMeses = anios * 12 + meses;

  const partes = [];
  if (anios > 0) partes.push(`${anios} año${anios > 1 ? 's' : ''}`);
  if (meses > 0) partes.push(`${meses} mes${meses > 1 ? 'es' : ''}`);
  if (dias > 0) partes.push(`${dias} día${dias > 1 ? 's' : ''}`);
  const descripcion = partes.length > 0 ? partes.join(', ') : '0 días';

  return { anios, meses, dias, totalMeses, totalDias, descripcion };
}

/**
 * Obtiene la tasa BCV para un mes dado. Si no existe, busca la más cercana disponible.
 * @param {string} clave - formato "YYYY-MM"
 * @returns {number} tasa anual en porcentaje
 */
function obtenerTasaBCV(clave) {
  const tasas = tasasBCV.tasas;
  if (tasas[clave] !== undefined) return tasas[clave];

  // Buscar la tasa más cercana disponible
  const claves = Object.keys(tasas).sort();
  let mejor = null;
  let mejorDist = Infinity;

  for (const k of claves) {
    // Calcular distancia en meses
    const [y1, m1] = clave.split('-').map(Number);
    const [y2, m2] = k.split('-').map(Number);
    const dist = Math.abs((y1 * 12 + m1) - (y2 * 12 + m2));
    if (dist < mejorDist) {
      mejorDist = dist;
      mejor = k;
    }
  }

  return mejor ? tasas[mejor] : 0;
}

/**
 * Calcula días de vacaciones (y bono vacacional) por año según LOTTT Art. 190/192.
 * 15 días base + 1 por cada año adicional a partir del segundo, tope 30.
 */
function diasVacacionesPorSeniority(aniosCompletos) {
  return Math.min(15 + Math.max(0, aniosCompletos - 1), 30);
}

// ============================================================================
// CÁLCULOS DE SALARIO INTEGRAL
// ============================================================================

/**
 * Calcula el salario integral diario a partir de los componentes.
 * @param {number} salarioMensual - salario base mensual
 * @param {number} bonosMensuales - bonos mensuales
 * @param {number} diasUtilidades - días de utilidades anuales
 * @param {number} diasBonoVacacional - días de bono vacacional (auto-calculado)
 * @returns {{ salarioMensualTotal, salarioDiario, alicuotaUtilidadesDiaria, alicuotaBonoVacacionalDiaria, salarioIntegralDiario }}
 */
function calcularSalarioIntegral(salarioMensual, bonosMensuales, diasUtilidades, diasBonoVacacional) {
  const salarioMensualTotal = salarioMensual + bonosMensuales;
  const salarioDiario = round2(salarioMensualTotal / 30);
  const alicuotaUtilidadesDiaria = round2((salarioDiario * diasUtilidades) / 360);
  const alicuotaBonoVacacionalDiaria = round2((salarioDiario * diasBonoVacacional) / 360);
  const salarioIntegralDiario = round2(salarioDiario + alicuotaUtilidadesDiaria + alicuotaBonoVacacionalDiaria);

  return {
    salarioMensualTotal,
    salarioDiario,
    alicuotaUtilidadesDiaria,
    alicuotaBonoVacacionalDiaria,
    salarioIntegralDiario,
  };
}

// ============================================================================
// LITERAL C - CÁLCULO RETROACTIVO (Art. 142 literal c)
// ============================================================================

/**
 * Calcula el monto retroactivo según Art. 142 literal c LOTTT.
 * - 30 días por año de servicio, al salario integral actual.
 * - Si fracción de meses > 6: se redondea al año completo siguiente.
 * - Si fracción de meses <= 6: se calcula proporcional (fraccion/12 * 30).
 *
 * @param {object} tiempoServicio - resultado de diffExacto
 * @param {number} salarioIntegralDiario - salario integral diario actual
 * @returns {{ dias, monto, aniosUsados, fraccion }}
 */
function calcularLiteralC(tiempoServicio, salarioIntegralDiario) {
  const { anios, meses: mesesRestantes } = tiempoServicio;

  let dias;
  let aniosUsados;
  let fraccion;

  if (mesesRestantes > 6) {
    // Redondear al año siguiente
    aniosUsados = anios + 1;
    fraccion = 0;
    dias = aniosUsados * 30;
  } else {
    // Proporcional
    aniosUsados = anios;
    fraccion = mesesRestantes;
    dias = round2((anios + mesesRestantes / 12) * 30);
  }

  const monto = round2(dias * salarioIntegralDiario);

  return { dias, monto, aniosUsados, fraccion };
}

// ============================================================================
// DÍAS ADICIONALES (Art. 142 literal b)
// ============================================================================

/**
 * Calcula los días adicionales acumulados por antigüedad.
 * 2 días adicionales por año a partir del 2do año.
 * Si trabajó >6 meses pasado un aniversario, se redondea al siguiente año.
 * Máximo acumulado: 30 días.
 *
 * @param {number} aniosCompletos - años completos de servicio
 * @param {number} mesesRestantes - meses después del último año completo
 * @returns {number} total de días adicionales acumulados
 */
function calcularDiasAdicionales(aniosCompletos, mesesRestantes) {
  // Determinar los años efectivos para el cálculo de adicionales
  let aniosEfectivos = aniosCompletos;
  if (mesesRestantes > 6) {
    aniosEfectivos += 1;
  }

  // Los adicionales empiezan desde el 2do año
  if (aniosEfectivos < 2) return 0;

  // 2 días por cada año desde el 2do: año 2 = 2, año 3 = 4, ..., año N = (N-1)*2
  // Pero es ACUMULATIVO: al final del año 2 se depositan 2 días,
  // al final del año 3 se depositan 4 días, etc.
  // El total acumulado es la suma: 2 + 4 + 6 + ... + (aniosEfectivos-1)*2
  // Sin embargo, la ley dice "2 días adicionales por cada año" como depósito anual,
  // no como acumulación creciente. Interpretación correcta:
  // Año 2: +2 días, Año 3: +4 días, Año 4: +6 días...
  // Tope: 30 días EN UN AÑO (no acumulado).
  // Lo que se acumula al total de la garantía es la SUMA de todos los depósitos.

  let totalAdicionales = 0;
  for (let a = 2; a <= aniosEfectivos; a++) {
    const diasEsteAnio = Math.min((a - 1) * 2, 30);
    totalAdicionales += diasEsteAnio;
  }

  return totalAdicionales;
}

// ============================================================================
// ESCENARIO A - FIDEICOMISO
// ============================================================================

/**
 * Escenario A: El trabajador tiene fideicomiso bancario.
 * - Garantía = montoAcumuladoGarantia (manual) + fracción pendiente del trimestre actual
 * - Intereses = interesesAcumuladosFideicomiso (manual)
 *
 * La fracción pendiente se calcula como: días del trimestre incompleto actual
 * multiplicados por el salario integral diario dividido entre 15 (proporcional).
 */
function calcularEscenarioA(inputs, tiempoServicio, salarioIntegral) {
  const {
    montoAcumuladoGarantia = 0,
    interesesAcumuladosFideicomiso = 0,
    fechaIngreso,
    fechaEgreso,
  } = inputs;

  // Calcular fracción pendiente del trimestre actual
  // Los trimestres son relativos a la fecha de ingreso
  const diff = diffExacto(fechaIngreso, fechaEgreso);
  const mesesEnServicio = diff.totalMeses;
  const diasExtra = diff.dias;

  // Meses completados en el trimestre actual
  const mesesEnTrimestreActual = mesesEnServicio % 3;

  // Total de días en el período fraccionario del trimestre actual:
  // meses completos * 30 + días extra
  const diasFraccionTrimestre = mesesEnTrimestreActual * 30 + diasExtra;

  // Si estamos en pre-primer-trimestre (< 3 meses), la fracción es 5 días/mes
  let montoFraccion;
  if (mesesEnServicio < 3) {
    // Pre-primer trimestre: 5 días por mes, fracción de mes cuenta como mes completo
    const mesesAPagar = diasExtra > 0 ? mesesEnServicio + 1 : mesesEnServicio;
    montoFraccion = round2(mesesAPagar * 5 * salarioIntegral.salarioIntegralDiario);
  } else {
    // Proporción dentro del trimestre actual: (diasFraccion / 90) * 15 días
    montoFraccion = round2((diasFraccionTrimestre / 90) * 15 * salarioIntegral.salarioIntegralDiario);
  }

  const garantiaTotal = round2(Number(montoAcumuladoGarantia) + montoFraccion);

  return {
    montoAcumuladoGarantia: round2(Number(montoAcumuladoGarantia)),
    fraccionPendiente: montoFraccion,
    diasFraccionTrimestre,
    garantiaTotal,
    intereses: round2(Number(interesesAcumuladosFideicomiso)),
    fuenteIntereses: 'fideicomiso',
  };
}

// ============================================================================
// ESCENARIO B - SIN FIDEICOMISO, CON HISTORIAL DE SALARIOS
// ============================================================================

/**
 * Genera la matriz trimestral de depósitos de garantía.
 * Los trimestres son RELATIVOS a la fecha de ingreso (no trimestres calendario).
 *
 * Para cada trimestre:
 *   - Busca el salario vigente en historialSalarios
 *   - Calcula salario integral
 *   - Deposita 15 días * salario integral (o 5 días/mes si pre-primer-trimestre)
 *   - En cada aniversario (desde el 2do año): deposita días adicionales
 *   - Calcula intereses mensuales sobre el saldo acumulado usando tasa BCV
 */
function calcularEscenarioB(inputs, tiempoServicio) {
  const {
    fechaIngreso,
    fechaEgreso,
    historialSalarios = [],
    diasUtilidadesAnuales,
  } = inputs;

  const d1 = toDate(fechaIngreso);
  const d2 = toDate(fechaEgreso);

  // Ordenar historial por fecha de inicio
  const historial = historialSalarios
    .map(h => ({
      desde: toDate(h.desde),
      hasta: toDate(h.hasta),
      salarioMensual: Number(h.salarioMensual) || 0,
      bonosMensuales: Number(h.bonosMensuales) || 0,
    }))
    .sort((a, b) => a.desde - b.desde);

  /**
   * Busca el salario vigente para una fecha dada dentro del historial.
   * Si no encuentra coincidencia exacta, usa el período más cercano anterior.
   */
  function buscarSalario(fecha) {
    const f = toDate(fecha);
    // Buscar el período que contenga la fecha
    for (const h of historial) {
      if (f >= h.desde && f <= h.hasta) {
        return { salarioMensual: h.salarioMensual, bonosMensuales: h.bonosMensuales };
      }
    }
    // Si no se encontró, usar el último período cuya fecha de inicio sea anterior
    let mejor = null;
    for (const h of historial) {
      if (h.desde <= f) mejor = h;
    }
    if (mejor) return { salarioMensual: mejor.salarioMensual, bonosMensuales: mejor.bonosMensuales };
    // Último recurso: el primer registro
    if (historial.length > 0) {
      return { salarioMensual: historial[0].salarioMensual, bonosMensuales: historial[0].bonosMensuales };
    }
    return { salarioMensual: 0, bonosMensuales: 0 };
  }

  // ---- Generar matriz mes a mes ----
  const matrizMensual = [];
  let saldoAcumulado = 0;
  let totalDepositos = 0;
  let totalAdicionales = 0;
  let totalIntereses = 0;

  // Iterar mes a mes desde fechaIngreso hasta fechaEgreso
  let cursor = new Date(Date.UTC(d1.getUTCFullYear(), d1.getUTCMonth(), d1.getUTCDate()));
  let mesIndex = 0; // meses transcurridos desde ingreso

  while (cursor < d2) {
    const siguienteMes = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, d1.getUTCDate()));
    // No pasar de la fecha de egreso para el último período
    const finPeriodo = siguienteMes > d2 ? d2 : siguienteMes;

    // Obtener salario vigente en este mes
    const sal = buscarSalario(cursor);

    // Calcular años completos de servicio al momento de este mes
    const aniosSeniority = Math.floor(mesIndex / 12);
    const diasBV = diasVacacionesPorSeniority(aniosSeniority);

    const integral = calcularSalarioIntegral(
      sal.salarioMensual, sal.bonosMensuales, diasUtilidadesAnuales, diasBV
    );

    // ---- Depósito trimestral ----
    // Cada 3 meses (meses 3, 6, 9, ...) se depositan 15 días
    let depositoTrimestre = 0;
    const mesEnServicio = mesIndex + 1; // 1-indexed

    // Pre-primer-trimestre: 5 días por mes durante los primeros 3 meses
    if (mesEnServicio <= 3) {
      depositoTrimestre = round2(5 * integral.salarioIntegralDiario);
    } else if (mesEnServicio % 3 === 0) {
      // Al completar cada trimestre (mes 6, 9, 12, ...): depositar 15 días
      depositoTrimestre = round2(15 * integral.salarioIntegralDiario);
    }

    // ---- Días adicionales en aniversarios (desde el 2do año) ----
    let depositoAdicional = 0;
    if (mesEnServicio > 12 && mesEnServicio % 12 === 0) {
      const anioActual = mesEnServicio / 12;
      const diasAdicionalesEsteAnio = Math.min((anioActual - 1) * 2, 30);
      depositoAdicional = round2(diasAdicionalesEsteAnio * integral.salarioIntegralDiario);
      totalAdicionales += depositoAdicional;
    }

    // Sumar depósitos al saldo ANTES de calcular intereses del mes
    saldoAcumulado = round2(saldoAcumulado + depositoTrimestre + depositoAdicional);
    totalDepositos = round2(totalDepositos + depositoTrimestre + depositoAdicional);

    // ---- Intereses mensuales ----
    const claveMes = claveYYYYMM(cursor);
    const tasaAnual = obtenerTasaBCV(claveMes);
    const interesMes = round2(saldoAcumulado * (tasaAnual / 12 / 100));
    saldoAcumulado = round2(saldoAcumulado + interesMes);
    totalIntereses = round2(totalIntereses + interesMes);

    matrizMensual.push({
      mes: mesIndex + 1,
      periodo: claveYYYYMM(cursor),
      salarioMensual: sal.salarioMensual,
      bonosMensuales: sal.bonosMensuales,
      salarioIntegralDiario: integral.salarioIntegralDiario,
      depositoTrimestre,
      depositoAdicional,
      tasaBCV: tasaAnual,
      interesMes,
      saldoAcumulado,
    });

    // Avanzar al siguiente mes
    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, d1.getUTCDate()));
    mesIndex++;
  }

  // ---- Fracción del último trimestre incompleto ----
  // Si el servicio no terminó justo en un límite de trimestre, calcular proporción
  const diff = diffExacto(fechaIngreso, fechaEgreso);
  const mesesCompletos = diff.totalMeses;
  const diasExtra = diff.dias;
  const mesesEnTrimestreActual = mesesCompletos % 3;
  const diasFraccionTrimestre = mesesEnTrimestreActual * 30 + diasExtra;

  // Si hay fracción pendiente y ya pasamos el primer trimestre
  let fraccionPendiente = 0;
  if (mesesCompletos >= 3 && diasFraccionTrimestre > 0) {
    // Buscar salario al momento del egreso
    const salEgreso = buscarSalario(fechaEgreso);
    const aniosAlEgreso = Math.floor(mesesCompletos / 12);
    const diasBVEgreso = diasVacacionesPorSeniority(aniosAlEgreso);
    const integralEgreso = calcularSalarioIntegral(
      salEgreso.salarioMensual, salEgreso.bonosMensuales, diasUtilidadesAnuales, diasBVEgreso
    );
    fraccionPendiente = round2((diasFraccionTrimestre / 90) * 15 * integralEgreso.salarioIntegralDiario);
  }

  const garantiaTotal = round2(totalDepositos + fraccionPendiente);

  return {
    matriz: matrizMensual,
    totalDepositos,
    totalAdicionales,
    fraccionPendiente,
    garantiaTotal,
    intereses: totalIntereses,
    saldoFinal: saldoAcumulado,
    fuenteIntereses: 'calculo_bcv',
  };
}

// ============================================================================
// ESCENARIO C - SIN FIDEICOMISO NI HISTORIAL
// ============================================================================

/**
 * Escenario C: Solo calcula retroactivo (Literal C) al último salario.
 * Los intereses son un monto manual acordado entre las partes.
 */
function calcularEscenarioC(inputs) {
  return {
    garantiaTotal: 0, // No hay garantía acumulada en este escenario
    intereses: round2(Number(inputs.interesesAcordados) || 0),
    fuenteIntereses: 'acordados',
    nota: 'Sin historial de salarios. Se usa solo el cálculo retroactivo (Literal C) al último salario.',
  };
}

// ============================================================================
// CÁLCULO DE FRACCIONES DE UTILIDADES, VACACIONES, BONO VACACIONAL
// ============================================================================

/**
 * Calcula los meses de fracción para un período dado.
 * Si hay días parciales en un mes, se cuenta como mes completo.
 *
 * @param {string} desde - fecha inicio del período fraccionario
 * @param {string} hasta - fecha fin del período fraccionario
 * @returns {number} meses de fracción (redondeado hacia arriba si hay días parciales)
 */
function calcularMesesFraccion(desde, hasta) {
  const diff = diffExacto(desde, hasta);
  // Si hay días sobrantes, se cuenta como un mes completo
  return diff.dias > 0 ? diff.totalMeses + 1 : diff.totalMeses;
}

/**
 * Calcula utilidades fraccionadas con deducción INCES.
 *
 * @param {string} desde - inicio del período de utilidades fraccionadas
 * @param {string} hasta - fin del período
 * @param {number} diasUtilidadesAnuales - días de utilidades anuales (min 30)
 * @param {number} salarioDiario - salario diario (sin alícuotas)
 * @returns {{ periodo, mesesFraccion, dias, montoBruto, inces, montoNeto }}
 */
function calcularUtilidadesFraccionadas(desde, hasta, diasUtilidadesAnuales, salarioDiario) {
  const mesesFraccion = calcularMesesFraccion(desde, hasta);
  const dias = round2((diasUtilidadesAnuales * mesesFraccion) / 12);
  const montoBruto = round2(dias * salarioDiario);

  // INCES: 0.5% sobre utilidades brutas (aporte del trabajador)
  const tasaInces = 0.5;
  const montoInces = round2(montoBruto * tasaInces / 100);
  const montoNeto = round2(montoBruto - montoInces);

  return {
    periodo: `${desde} a ${hasta}`,
    mesesFraccion,
    dias,
    montoBruto,
    inces: {
      tasa: tasaInces,
      monto: montoInces,
    },
    montoNeto,
    baseLegal: 'Art. 131-132 LOTTT; INCES: Art. 14 Ley INCES (aporte trabajador 0.5%)',
  };
}

/**
 * Calcula vacaciones fraccionadas.
 *
 * @param {string} desde - inicio del período fraccionario
 * @param {string} hasta - fin del período
 * @param {number} aniosCompletos - años completos de servicio (para calcular días por seniority)
 * @param {number} salarioDiario - salario diario (sin alícuotas)
 * @returns {{ periodo, mesesFraccion, diasPorAnio, dias, monto }}
 */
function calcularVacacionesFraccionadas(desde, hasta, aniosCompletos, salarioDiario) {
  const mesesFraccion = calcularMesesFraccion(desde, hasta);
  const diasPorAnio = diasVacacionesPorSeniority(aniosCompletos);
  const dias = round2((diasPorAnio * mesesFraccion) / 12);
  const monto = round2(dias * salarioDiario);

  return {
    periodo: `${desde} a ${hasta}`,
    mesesFraccion,
    diasPorAnio,
    dias,
    monto,
    baseLegal: 'Art. 190 LOTTT',
  };
}

/**
 * Calcula bono vacacional fraccionado.
 * Usa la misma fórmula de días que vacaciones: min(15 + max(0, años-1), 30).
 *
 * @param {string} desde - inicio del período fraccionario
 * @param {string} hasta - fin del período
 * @param {number} aniosCompletos - años completos de servicio
 * @param {number} salarioDiario - salario diario (sin alícuotas)
 * @returns {{ periodo, mesesFraccion, diasPorAnio, dias, monto }}
 */
function calcularBonoVacacionalFraccionado(desde, hasta, aniosCompletos, salarioDiario) {
  const mesesFraccion = calcularMesesFraccion(desde, hasta);
  const diasPorAnio = diasVacacionesPorSeniority(aniosCompletos);
  const dias = round2((diasPorAnio * mesesFraccion) / 12);
  const monto = round2(dias * salarioDiario);

  return {
    periodo: `${desde} a ${hasta}`,
    mesesFraccion,
    diasPorAnio,
    dias,
    monto,
    baseLegal: 'Art. 192 LOTTT',
  };
}

// ============================================================================
// FUNCIÓN PRINCIPAL - CALCULAR PRESTACIONES
// ============================================================================

/**
 * Calcula las prestaciones sociales según LOTTT Venezuela.
 *
 * @param {object} params - Parámetros de entrada (ver Input Schema)
 * @returns {object} Resultado completo del cálculo
 */
function calcularPrestaciones({
  fechaIngreso,
  fechaEgreso,
  salarioMensual,
  bonosMensuales = 0,
  motivoTerminacion = 'renuncia', // 'renuncia' | 'despido_justificado' | 'despido_injustificado'
  diasUtilidadesAnuales = 30,     // mínimo legal LOTTT: 30 días

  // Selector de escenario
  escenario = 'C', // 'A' | 'B' | 'C'

  // Escenario A (fideicomiso)
  montoAcumuladoGarantia = 0,
  interesesAcumuladosFideicomiso = 0,

  // Escenario B (historial de salarios)
  historialSalarios = [],

  // Escenario C (intereses acordados)
  interesesAcordados = 0,

  // Rangos de fechas para beneficios fraccionados
  utilidadesDesde,
  utilidadesHasta,
  vacacionesDesde,
  vacacionesHasta,
}) {
  // ---- Validaciones básicas ----
  if (!fechaIngreso || !fechaEgreso) {
    throw new Error('Fechas de ingreso y egreso son obligatorias.');
  }

  if (!['A', 'B', 'C'].includes(escenario)) {
    throw new Error("El escenario debe ser 'A', 'B' o 'C'.");
  }

  if (diasUtilidadesAnuales < 30) {
    throw new Error('El mínimo legal de días de utilidades anuales es 30 (Art. 131 LOTTT).');
  }

  const salario = Number(salarioMensual) || 0;
  const bonos = Number(bonosMensuales) || 0;

  // ---- Tiempo de servicio ----
  const tiempoServicio = diffExacto(fechaIngreso, fechaEgreso);
  const { anios: aniosCompletos, meses: mesesRestantes, dias: diasRestantes } = tiempoServicio;

  // ---- Días de vacaciones y bono vacacional auto-calculados ----
  // Si la fracción del último año > 6 meses, se cuenta como año completo adicional (LOTTT)
  const aniosEfectivosParaBeneficios = mesesRestantes > 6 ? aniosCompletos + 1 : aniosCompletos;
  const diasBonoVacacionalCalculados = diasVacacionesPorSeniority(aniosEfectivosParaBeneficios);
  const diasVacacionesCalculados = diasVacacionesPorSeniority(aniosEfectivosParaBeneficios);

  // ---- Salario integral diario (al último salario) ----
  const salarioIntegral = calcularSalarioIntegral(
    salario, bonos, diasUtilidadesAnuales, diasBonoVacacionalCalculados
  );

  // ====================================================================
  // LITERAL C - RETROACTIVO (siempre se calcula, independiente del escenario)
  // ====================================================================
  const literalC = calcularLiteralC(tiempoServicio, salarioIntegral.salarioIntegralDiario);

  // ====================================================================
  // CÁLCULO POR ESCENARIO
  // ====================================================================
  let garantia;
  let intereses;

  if (escenario === 'A') {
    garantia = calcularEscenarioA(
      { montoAcumuladoGarantia, interesesAcumuladosFideicomiso, fechaIngreso, fechaEgreso },
      tiempoServicio,
      salarioIntegral
    );
    intereses = garantia.intereses;
  } else if (escenario === 'B') {
    garantia = calcularEscenarioB(
      { fechaIngreso, fechaEgreso, historialSalarios, diasUtilidadesAnuales },
      tiempoServicio
    );
    intereses = garantia.intereses;
  } else {
    // Escenario C
    garantia = calcularEscenarioC({ interesesAcordados });
    intereses = garantia.intereses;
  }

  // ====================================================================
  // COMPARACIÓN: GARANTÍA vs RETROACTIVO
  // Se paga el MAYOR de ambos + intereses (los intereses siempre se pagan)
  // ====================================================================
  const garantiaSinIntereses = garantia.garantiaTotal;
  const retroactivo = literalC.monto;
  const usaRetroactivo = retroactivo > garantiaSinIntereses;
  const montoAntiguedad = usaRetroactivo ? retroactivo : garantiaSinIntereses;
  const metodoUsado = usaRetroactivo ? 'retroactivo_literal_c' : 'garantia';

  const comparacion = {
    garantiaSinIntereses,
    retroactivo,
    usaRetroactivo,
    metodoUsado,
  };

  // Total antigüedad = monto mayor + intereses
  const totalAntiguedadConIntereses = round2(montoAntiguedad + intereses);

  // ====================================================================
  // INDEMNIZACIÓN Art. 92 - Despido injustificado
  // IMPORTANTE: Siempre usa el valor del Literal C, NO el mayor
  // ====================================================================
  let indemnizacion = {
    aplica: false,
    monto: 0,
    nota: motivoTerminacion === 'despido_injustificado'
      ? 'Equivalente al monto del Literal C (cálculo retroactivo)'
      : motivoTerminacion === 'despido_justificado'
        ? 'No aplica en despido justificado'
        : 'No aplica en caso de renuncia voluntaria',
    baseLegal: 'Art. 92 LOTTT',
  };

  if (motivoTerminacion === 'despido_injustificado') {
    indemnizacion.aplica = true;
    indemnizacion.monto = literalC.monto; // Siempre usa Literal C
  }

  // ====================================================================
  // BENEFICIOS FRACCIONADOS
  // ====================================================================

  // Calcular último aniversario como default para períodos fraccionados
  let defaultDesde = fechaIngreso;
  if (aniosCompletos > 0) {
    const [iy, im, id] = String(fechaIngreso).split('-').map(Number);
    defaultDesde = `${iy + aniosCompletos}-${String(im).padStart(2, '0')}-${String(id).padStart(2, '0')}`;
  }

  // Fechas para utilidades fraccionadas (usar proporcionadas o último aniversario)
  const utilDesde = utilidadesDesde || defaultDesde;
  const utilHasta = utilidadesHasta || fechaEgreso;

  // Fechas para vacaciones y bono vacacional fraccionados
  const vacDesde = vacacionesDesde || defaultDesde;
  const vacHasta = vacacionesHasta || fechaEgreso;

  const utilidades = calcularUtilidadesFraccionadas(
    utilDesde, utilHasta, diasUtilidadesAnuales, salarioIntegral.salarioDiario
  );

  const vacaciones = calcularVacacionesFraccionadas(
    vacDesde, vacHasta, aniosEfectivosParaBeneficios, salarioIntegral.salarioDiario
  );

  const bonoVacacional = calcularBonoVacacionalFraccionado(
    vacDesde, vacHasta, aniosEfectivosParaBeneficios, salarioIntegral.salarioDiario
  );

  // ====================================================================
  // DEDUCCIÓN FIDEICOMISO (Escenario A)
  // Si hay fideicomiso, esos montos ya pertenecen al trabajador.
  // Se descuentan del total a pagar para evitar duplicación.
  // ====================================================================
  let deduccionFideicomiso = 0;
  if (escenario === 'A') {
    deduccionFideicomiso = round2(
      Number(montoAcumuladoGarantia) + Number(interesesAcumuladosFideicomiso)
    );
  }

  // ====================================================================
  // TOTAL A PAGAR
  // ====================================================================
  const totalAPagar = round2(
    totalAntiguedadConIntereses +
    indemnizacion.monto +
    vacaciones.monto +
    bonoVacacional.monto +
    utilidades.montoNeto - // Se usa el neto (ya descontado INCES)
    deduccionFideicomiso   // Descontar lo ya depositado en fideicomiso
  );

  // ====================================================================
  // RESULTADO FINAL
  // ====================================================================
  return {
    version: 2,
    inputs: {
      fechaIngreso,
      fechaEgreso,
      salarioMensual: salario,
      bonosMensuales: bonos,
      motivoTerminacion,
      diasUtilidadesAnuales,
      escenario,
      // Incluir inputs específicos del escenario
      ...(escenario === 'A' ? { montoAcumuladoGarantia, interesesAcumuladosFideicomiso } : {}),
      ...(escenario === 'B' ? { historialSalarios } : {}),
      ...(escenario === 'C' ? { interesesAcordados } : {}),
      utilidadesDesde: utilDesde,
      utilidadesHasta: utilHasta,
      vacacionesDesde: vacDesde,
      vacacionesHasta: vacHasta,
    },
    tiempoServicio: {
      anios: aniosCompletos,
      meses: mesesRestantes,
      dias: diasRestantes,
      totalMeses: tiempoServicio.totalMeses,
      totalDias: tiempoServicio.totalDias,
      descripcion: tiempoServicio.descripcion,
    },
    salarioBase: {
      salarioMensualTotal: salarioIntegral.salarioMensualTotal,
      salarioDiario: salarioIntegral.salarioDiario,
      alicuotaUtilidadesDiaria: salarioIntegral.alicuotaUtilidadesDiaria,
      alicuotaBonoVacacionalDiaria: salarioIntegral.alicuotaBonoVacacionalDiaria,
      salarioIntegralDiario: salarioIntegral.salarioIntegralDiario,
      diasBonoVacacionalCalculados,
      diasVacacionesCalculados,
    },
    escenario,
    garantia,
    literalC,
    comparacion,
    conceptos: {
      antiguedad: {
        monto: montoAntiguedad,
        metodoUsado,
        baseLegal: 'Art. 142 LOTTT (literales a, b, c)',
      },
      intereses: {
        fuente: garantia.fuenteIntereses,
        monto: intereses,
        baseLegal: 'Art. 143 LOTTT - Intereses sobre prestaciones sociales',
      },
      indemnizacion,
      vacacionesFraccionadas: vacaciones,
      bonoVacacionalFraccionado: bonoVacacional,
      utilidadesFraccionadas: utilidades,
    },
    totalAntiguedadConIntereses,
    deduccionFideicomiso,
    totalAPagar,
    advertencia:
      'Cálculo referencial basado en LOTTT (Art. 142, 143, 190, 192, 131-132, 92). ' +
      'Las cifras deben ser verificadas por un profesional antes de uso oficial.',
  };
}

module.exports = { calcularPrestaciones };
