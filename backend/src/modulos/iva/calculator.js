// Modulo IVA - calculo programado (NO IA para los numeros)
// Formulas estandar Venezuela. Alicuotas configurables via input.

function calcularIVA({
  ventasBrutas = 0,
  compras = 0,
  alicuotaVentas = 0.16,   // 16% por defecto
  alicuotaCompras = 0.16,
  creditoFiscalAcumulado = 0,
}) {
  const v = Number(ventasBrutas) || 0;
  const c = Number(compras) || 0;
  const aV = Number(alicuotaVentas) || 0;
  const aC = Number(alicuotaCompras) || 0;
  const cfAcum = Number(creditoFiscalAcumulado) || 0;

  const debitoFiscal = round2(v * aV);
  const creditoFiscal = round2(c * aC);
  const ivaResultado = round2(debitoFiscal - creditoFiscal - cfAcum);

  const ivaAPagar = ivaResultado > 0 ? ivaResultado : 0;
  const saldoAFavor = ivaResultado < 0 ? Math.abs(ivaResultado) : 0;

  return {
    inputs: { ventasBrutas: v, compras: c, alicuotaVentas: aV, alicuotaCompras: aC, creditoFiscalAcumulado: cfAcum },
    debitoFiscal,
    creditoFiscal,
    creditoFiscalAcumuladoAplicado: cfAcum,
    ivaAPagar,
    saldoAFavor,
    explicacion: {
      formula: 'IVA = (Ventas x Alicuota) - (Compras x Alicuota) - Credito Fiscal Acumulado',
      interpretacion:
        ivaResultado > 0
          ? `Debe pagar Bs. ${ivaAPagar} de IVA en este periodo.`
          : `Tiene saldo a favor de Bs. ${saldoAFavor} para aplicar al siguiente periodo.`,
    },
  };
}

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

module.exports = { calcularIVA };
