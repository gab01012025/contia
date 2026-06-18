// ═══════════════════════════════════════════════════════════════
//  Modulo IVA – Calculador Forma 30 (Declaración de IVA)
//  Venezuela – Alicuota general 16%, adicional lujo 15%
//  v2.0 – Reescritura completa con todas las casillas
// ═══════════════════════════════════════════════════════════════

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function num(v) {
  return round2(Number(v) || 0);
}

// ── Desglose: dado un monto IVA-incluido, separa base y fiscal ──
function desglosarIVA(montoConIVA, alicuota) {
  const base = round2(montoConIVA / (1 + alicuota));
  const fiscal = round2(montoConIVA - base);
  return { base, fiscal };
}

// ═══════════════════════════════════════════════════════════════
//  FUNCIÓN PRINCIPAL
// ═══════════════════════════════════════════════════════════════

function calcularIVA(datos) {
  // ── 1. Extraer inputs ──────────────────────────────────────
  const razonSocial = datos.razonSocial || '';
  const rif = datos.rif || '';
  const mes = datos.mes || '';
  const anio = datos.anio || '';

  // Parte 1: Ventas
  const ventasExentas = num(datos.ventasExentas);
  const ventasExterior = num(datos.ventasExterior);
  const ventasComunesConIVA = num(datos.ventasComunes);
  const ventasLujoConIVA = num(datos.ventasLujo);
  const devolucionesClientes = num(datos.devolucionesClientes);

  // Parte 2: Compras
  const comprasSinIVA = num(datos.comprasSinIVA);
  const importacionesConIVA = num(datos.importaciones);
  const gastosNegocioConIVA = num(datos.gastosNegocio);
  const devolucionesProveedores = num(datos.devolucionesProveedores);

  // Parte 3: Créditos y retenciones
  const excedenteMesAnterior = num(datos.excedenteMesAnterior);
  const retencionesNuevas = num(datos.retencionesNuevas);
  const retencionesAcumuladas = num(datos.retencionesAcumuladas);

  // ── 2. Calcular Débitos Fiscales ───────────────────────────

  // Casilla 40: Ventas exentas (directo)
  const c40 = ventasExentas;

  // Casilla 41: Ventas de exportación (directo)
  const c41 = ventasExterior;

  // Casillas 42/43: Ventas internas gravadas alícuota general (16%)
  const ventasComunes = desglosarIVA(ventasComunesConIVA, 0.16);
  const c42 = ventasComunes.base;
  const c43 = ventasComunes.fiscal;

  // Casillas 442/452: Ventas internas gravadas alícuota general + adicional (31%)
  const ventasLujo = desglosarIVA(ventasLujoConIVA, 0.31);
  const c442 = ventasLujo.base;
  const c452 = ventasLujo.fiscal;

  // Casillas 443/453: Ventas alícuota reducida (no usadas en este flujo)
  const c443 = 0;
  const c453 = 0;

  // Casilla 46: Total ventas y débitos fiscales - Base imponible
  const c46 = round2(c40 + c41 + c42 + c442 + c443);

  // Casilla 47: Total ventas y débitos fiscales - Débito fiscal
  const c47 = round2(c43 + c452 + c453);

  // Casilla 48: Ajuste a los débitos fiscales de períodos anteriores
  const c48 = devolucionesClientes;

  // Casilla 80: Certificado de débitos fiscales exonerados
  const c80 = 0;

  // Casilla 49: Total débitos fiscales
  const c49 = round2(c47 + c48 - c80);

  // ── 3. Calcular Créditos Fiscales ──────────────────────────

  // Casilla 30: Compras no gravadas
  const c30 = comprasSinIVA;

  // Casillas 31/32: Importaciones gravadas alícuota general
  const importaciones = desglosarIVA(importacionesConIVA, 0.16);
  const c31 = importaciones.base;
  const c32 = importaciones.fiscal;

  // Casillas 312/322: Importaciones alícuota general + adicional (no usadas)
  const c312 = 0;
  const c322 = 0;

  // Casillas 313/323: Importaciones alícuota reducida (no usadas)
  const c313 = 0;
  const c323 = 0;

  // Casillas 33/34: Compras internas gravadas alícuota general
  const gastos = desglosarIVA(gastosNegocioConIVA, 0.16);
  const c33 = gastos.base;
  const c34 = gastos.fiscal;

  // Casillas 332/342: Compras internas alícuota general + adicional (no usadas)
  const c332 = 0;
  const c342 = 0;

  // Casillas 333/343: Compras internas alícuota reducida (no usadas)
  const c333 = 0;
  const c343 = 0;

  // Casilla 35: Total compras - Base imponible
  const c35 = round2(c30 + c31 + c312 + c313 + c33 + c332 + c333);

  // Casilla 36: Total compras - Crédito fiscal del período
  const c36 = round2(c32 + c322 + c323 + c34 + c342 + c343);

  // ── 4. Prorrata ────────────────────────────────────────────
  const totalVentasGravadas = round2(c42 + c442 + c443);
  const totalVentasTodas = round2(c40 + c41 + c42 + c442 + c443);

  let porcentajeProrrata = 100;
  let prorrataAplicada = false;

  if (totalVentasTodas > 0 && (c40 > 0 || c41 > 0)) {
    porcentajeProrrata = round2((totalVentasGravadas / totalVentasTodas) * 100);
    prorrataAplicada = true;
  }

  // Casilla 70: Créditos fiscales totalmente deducibles (importaciones)
  const c70 = c32;

  // Casilla 37: Créditos fiscales producto de la prorrata
  const c37 = prorrataAplicada
    ? round2(c34 * (porcentajeProrrata / 100))
    : c34;

  // Casilla 71: Total créditos fiscales deducibles
  const c71 = round2(c70 + c37);

  // Casilla 20: Excedente de créditos fiscales del mes anterior
  const c20 = excedenteMesAnterior;

  // Casilla 21: Reintegro solicitado (solo exportadores)
  const c21 = 0;

  // Casilla 81: Reintegro solicitado (entes exonerados)
  const c81 = 0;

  // Casilla 38: Ajustes a los créditos de períodos anteriores
  const c38 = devolucionesProveedores;

  // Casilla 82: Certificado de débitos fiscales exonerados (emitidos)
  const c82 = 0;

  // Casilla 39: Total créditos fiscales
  const c39 = round2(c71 + c20 + c21 + c81 + c38 + c82);

  // ── 5. Autoliquidación ─────────────────────────────────────

  const resultadoPreliminar = round2(c49 - (c71 + c20 + c38));

  // Casilla 53: Total cuota tributaria
  const c53 = resultadoPreliminar > 0 ? resultadoPreliminar : 0;

  // Casilla 60: Excedente de crédito fiscal para el mes siguiente
  const c60 = resultadoPreliminar <= 0 ? round2(Math.abs(resultadoPreliminar)) : 0;

  // Casilla 22: Impuesto pagado en declaración sustituida
  const c22 = 0;

  // Casilla 51: Retenciones descontadas en declaración sustituida
  const c51 = 0;

  // Casilla 24: Percepciones descontadas en declaración sustituida
  const c24 = 0;

  // Casilla 78: Sub-total impuesto a pagar
  const c78 = round2(Math.max(0, c53 - c22 - c51 - c24));

  // ── 6. Retenciones ─────────────────────────────────────────

  // Casilla 54: Retenciones acumuladas por descontar
  const c54 = retencionesAcumuladas;

  // Casilla 66: Retenciones del período
  const c66 = retencionesNuevas;

  // Casilla 72: Créditos adquiridos por cesión de retenciones
  const c72 = 0;

  // Casilla 73: Recuperación de retenciones solicitado
  const c73 = 0;

  // Casilla 74: Total retenciones
  const c74 = round2(c54 + c66 + c72 - c73);

  // Aplicación de retenciones (solo si hay impuesto a pagar)
  let c55 = 0;  // Retenciones soportadas y descontadas
  let c67 = 0;  // Saldo de retenciones de IVA no aplicado
  let c56 = 0;  // Total impuesto a pagar

  if (c78 > 0) {
    if (c74 <= c78) {
      c55 = c74;
      c67 = 0;
      c56 = round2(c78 - c74);
    } else {
      c55 = c78;
      c67 = round2(c74 - c78);
      c56 = 0;
    }
  } else {
    c55 = 0;
    c67 = c74;
    c56 = 0;
  }

  // ── 7. Construir resultado ─────────────────────────────────

  return {
    version: 2,

    contribuyente: { razonSocial, rif, mes, anio },

    casillas: {
      c40, c41, c42, c43, c442, c452, c443, c453,
      c46, c47, c48, c80, c49,
      c30, c31, c32, c312, c322, c313, c323,
      c33, c34, c332, c342, c333, c343,
      c35, c36,
      c70, c37, c71,
      c20, c21, c81, c38, c82, c39,
      c53, c60, c22, c51, c24, c78,
      c54, c66, c72, c73, c74, c55, c67, c56,
    },

    prorrata: {
      porcentaje: porcentajeProrrata,
      aplicada: prorrataAplicada,
    },

    resumen: {
      totalDebitosFiscales: c49,
      totalCreditosDeducibles: c71,
      cuotaTributaria: c53,
      excedenteMesSiguiente: c60,
      totalRetenciones: c74,
      retencionesDescontadas: c55,
      saldoRetencionesNoAplicado: c67,
      totalImpuestoAPagar: c56,
    },

    // Compatibilidad con v1
    inputs: {
      ventasBrutas: ventasComunesConIVA + ventasLujoConIVA,
      compras: importacionesConIVA + gastosNegocioConIVA,
      alicuotaVentas: 0.16,
      alicuotaCompras: 0.16,
      creditoFiscalAcumulado: excedenteMesAnterior,
    },
    debitoFiscal: c49,
    creditoFiscal: c71,
    ivaAPagar: c56,
    saldoAFavor: c60,
    explicacion: {
      formula: 'Forma 30 SENIAT — Autoliquidación IVA',
      interpretacion: c56 > 0
        ? `Debe pagar Bs. ${c56.toLocaleString('es-VE', { minimumFractionDigits: 2 })} de IVA en este período.`
        : c60 > 0
          ? `Tiene un excedente de crédito fiscal de Bs. ${c60.toLocaleString('es-VE', { minimumFractionDigits: 2 })} para el siguiente período.`
          : 'No tiene impuesto a pagar ni excedente de crédito fiscal.',
    },
  };
}

module.exports = { calcularIVA };
