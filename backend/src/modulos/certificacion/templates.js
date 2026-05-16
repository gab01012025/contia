// Templates HTML para generación de PDF — Módulo 1
// Replicando fielmente los documentos oficiales de la Lcda. Mariali Carrizales

const path = require('path');
const fs   = require('fs');

// Logo del Colegio de Contadores Públicos de Venezuela (embedded como base64)
const logoPath    = path.join(__dirname, 'assets', 'logo-cpc-venezuela.png');
const LOGO_CPC_B64 = fs.readFileSync(logoPath, 'base64');

const LOGO_CPC_URI = `data:image/png;base64,${LOGO_CPC_B64}`;

function fmtBs(n) {
  return Number(n || 0).toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtFecha(iso) {
  if (!iso) return '_______________';
  return new Date(iso).toLocaleDateString('es-VE', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS base compartido por todos los documentos
// ─────────────────────────────────────────────────────────────────────────────
const BASE_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "Times New Roman", Times, serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #000;
    background: #fff;
  }
  .page {
    padding: 10mm 20mm 15mm 25mm;
    max-width: 210mm;
    margin: 0 auto;
  }
  .header-logo {
    text-align: center;
    margin-bottom: 18pt;
  }
  .header-logo img.logo-cpc {
    width: 60px;
    height: auto;
    margin-bottom: 6pt;
  }
  .header-logo .firma-nombre {
    font-size: 13pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .header-logo .firma-titulo {
    font-size: 11pt;
    font-style: italic;
  }
  .header-logo .firma-cpc {
    font-size: 10pt;
  }
  hr { border: none; border-top: 1.5px solid #000; margin: 12pt 0; }
  h1.titulo-doc {
    font-size: 12pt;
    font-weight: bold;
    text-align: center;
    text-transform: uppercase;
    margin-bottom: 16pt;
    letter-spacing: 0.3px;
  }
  p { margin-bottom: 10pt; text-align: justify; }
  .destinatario { margin-bottom: 14pt; }
  .destinatario .label { font-weight: bold; }
  .seccion-titulo {
    font-weight: bold;
    text-decoration: underline;
    margin-bottom: 6pt;
    margin-top: 12pt;
    text-transform: uppercase;
    font-size: 10.5pt;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 10pt 0;
    font-size: 10.5pt;
  }
  table th {
    background: #f5f5f5;
    border: 1px solid #999;
    padding: 5pt 8pt;
    font-weight: bold;
    text-align: left;
  }
  table td {
    border: 1px solid #999;
    padding: 4pt 8pt;
  }
  table .td-right { text-align: right; }
  table .td-total {
    font-weight: bold;
    background: #f5f5f5;
  }
  .firma-bloque {
    margin-top: 40pt;
    page-break-inside: avoid;
  }
  .firma-linea {
    border-top: 1px solid #000;
    width: 60%;
    margin: 0;
    padding-top: 4pt;
  }
  .firma-nombre-pie {
    font-weight: bold;
    font-size: 11pt;
  }
  .ciudad-fecha {
    margin-top: 14pt;
    font-weight: bold;
  }
  .page-break { page-break-after: always; }
  .note-titulo {
    font-weight: bold;
    margin-top: 10pt;
    margin-bottom: 4pt;
  }
  .indent { margin-left: 20pt; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENTO 1: CERTIFICACIÓN DE INGRESOS
// Compuesto por: Informe + Anexo (Relación de Ingresos)
// ─────────────────────────────────────────────────────────────────────────────
function htmlCertificacionIngresos(datos, calculos) {
  const {
    nombreCliente      = '_______________',
    cedula             = '_______________',
    actividad          = '_______________',
    direccion          = '_______________',
    nombreInstitucion  = '_______________',
    periodoDesde,
    periodoHasta,
    ciudad             = '_______________',
    ingresos           = [],
    egresos            = [],
  } = datos;

  const periodoStr = `${fmtFecha(periodoDesde)} al ${fmtFecha(periodoHasta)}`;
  const totalIngresos = fmtBs(calculos?.totalIngresos ?? 0);

  const filasIngresos = ingresos.map(r => `
    <tr>
      <td>${r.concepto || ''}</td>
      <td class="td-right">Bs. ${fmtBs(r.monto)}</td>
    </tr>
  `).join('');

  const filasEgresos = egresos.length > 0 ? egresos.map(r => `
    <tr>
      <td>${r.concepto || ''}</td>
      <td class="td-right">Bs. ${fmtBs(r.monto)}</td>
    </tr>
  `).join('') : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Certificación de Ingresos — ${nombreCliente}</title>
  <style>${BASE_CSS}</style>
</head>
<body>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- PÁGINA 1: INFORME DE ENCARGO DE ASEGURAMIENTO             -->
<!-- ═══════════════════════════════════════════════════════════ -->
<div class="page">

  <div class="header-logo">
    <img class="logo-cpc" src="${LOGO_CPC_URI}" alt="Colegio de Contadores Públicos de Venezuela">
    <div class="firma-nombre">Lcda. Mariali C. Carrizales P.</div>
    <div class="firma-titulo">Contador Público Colegiado</div>
    <div class="firma-cpc">C.P.C. 90.419</div>
  </div>

  <hr>

  <h1 class="titulo-doc">
    Informe de Encargos de Aseguramiento sobre la<br>
    Relación de Ingresos de ${nombreCliente}
  </h1>

  <div class="destinatario">
    <span class="label">Señores:</span><br>
    ${nombreInstitucion}
  </div>

  <p class="seccion-titulo">Alcance</p>
  <p>
    He revisado la evidencia inherente a los ingresos percibidos por
    ${nombreCliente}, titular de la Cédula de Identidad N° ${cedula},
    detallado en la relación adjunta, para el período del ${periodoStr};
    correspondiente a su actividad como: ${actividad}.
  </p>

  <p class="seccion-titulo">Responsabilidad del cliente</p>
  <p>
    ${nombreCliente} es responsable de la preparación y presentación del
    importe de sus ingresos que se adjunta a este informe, incluyendo la
    integridad, legalidad y veracidad de los documentos suministrados.
    Esta responsabilidad incluye la aseveración de que todos y cada uno de
    los ingresos detallados en la relación, provienen de actividades
    legítimas y de comprobable lícito ejercicio.
  </p>

  <p class="seccion-titulo">Responsabilidad del Auditor Independiente</p>
  <p>
    Mi responsabilidad es expresar una seguridad limitada sobre la relación
    de ingresos obtenida por ${nombreCliente}, durante el período señalado
    de acuerdo con mis procedimientos, los cuales he realizado de conformidad
    con la Norma Internacional de Encargos de Aseguramiento (NIEA 3000),
    distintos de la auditoría o de la revisión de información financiera
    histórica. Esta norma prevé que cumpla con los requerimientos éticos, y
    que planifique y realice mis procedimientos para obtener una seguridad
    limitada de que, en todos los aspectos materiales, la relación está
    presentada razonablemente.
  </p>
  <p>
    Un encargo de aseguramiento implica llevar a cabo procedimientos para
    obtener evidencia acerca de la razonabilidad de las aseveraciones emitidas
    por el responsable. Los procedimientos para compilar evidencia son más
    limitados que para un encargo de asegurar con seguridad razonable; por lo
    tanto, se obtiene menos certeza que en un encargo de asegurar con seguridad
    razonable, los cuales dependen del juicio profesional del contador público,
    que incluye evaluar los riesgos acerca de que los ingresos no estén
    presentados razonablemente. El objetivo es obtener una seguridad limitada
    para que el contador público obtenga un nivel moderado de seguridad como
    base de una forma negativa de expresión.
  </p>

  <p class="seccion-titulo">Conclusión</p>
  <p>
    Con base en el trabajo efectuado descrito en este informe, no ha llamado
    mi atención algo que me haga pensar que la relación de ingresos que se
    anexa, en todos los aspectos importantes, no sea razonable y que los
    ingresos detallados en la relación, no provengan de actividades legítimas
    y de comprobable lícito ejercicio.
  </p>
  <p>
    Este informe está dirigido únicamente para la actualización de datos para
    ${nombreInstitucion}.
  </p>

  <p class="ciudad-fecha">${ciudad}, ${fmtFecha(new Date().toISOString())}</p>

  <div class="firma-bloque">
    <div class="firma-linea"></div>
    <div class="firma-nombre-pie">Lcda. Mariali C. Carrizales P.</div>
    <div>Contador Público Colegiado</div>
    <div>C.P.C. 90.419</div>
  </div>

</div>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- PÁGINA 2: ANEXO — RELACIÓN DE INGRESOS                     -->
<!-- ═══════════════════════════════════════════════════════════ -->
<div class="page page-break" style="page-break-before: always;">

  <div style="text-align: center; margin-bottom: 20pt;">
    <div style="font-weight: bold; font-size: 12pt;">${nombreCliente}</div>
    <div>${cedula}</div>
  </div>

  <h1 class="titulo-doc">
    Relación de Ingresos<br>
    <span style="font-size: 10pt; font-weight: normal;">
      Del ${fmtFecha(periodoDesde)} al ${fmtFecha(periodoHasta)}
    </span>
  </h1>

  <table>
    <thead>
      <tr>
        <th>Concepto / Descripción</th>
        <th style="width: 180px; text-align: right;">Monto</th>
      </tr>
    </thead>
    <tbody>
      ${filasIngresos}
    </tbody>
    <tfoot>
      <tr>
        <td class="td-total">TOTAL INGRESOS</td>
        <td class="td-total td-right">Bs. ${totalIngresos}</td>
      </tr>
    </tfoot>
  </table>

  ${egresos.length > 0 ? `
  <table style="margin-top: 16pt;">
    <thead>
      <tr>
        <th>Egresos / Gastos</th>
        <th style="width: 180px; text-align: right;">Monto</th>
      </tr>
    </thead>
    <tbody>${filasEgresos}</tbody>
    <tfoot>
      <tr>
        <td class="td-total">TOTAL EGRESOS</td>
        <td class="td-total td-right">Bs. ${fmtBs(calculos?.totalEgresos ?? 0)}</td>
      </tr>
    </tfoot>
  </table>
  <table style="margin-top: 8pt;">
    <tfoot>
      <tr>
        <td class="td-total">FLUJO NETO</td>
        <td class="td-total td-right">Bs. ${fmtBs(calculos?.flujoMensual ?? 0)}</td>
      </tr>
    </tfoot>
  </table>
  ` : ''}

  <div style="margin-top: 30pt; font-style: italic; text-align: justify; font-size: 10pt;">
    <strong>Legitimación de Capitales:</strong> Todos y cada uno de los ingresos
    detallados en la relación que le he facilitado para su revisión, por monto en
    Bs. ${totalIngresos}, provienen de actividades legítimas y de comprobable
    lícito ejercicio.
  </div>

  <div style="margin-top: 30pt; text-align: center; page-break-inside: avoid;">
    <div style="margin-bottom: 30pt;">
      <div style="border-top: 1px solid #000; width: 55%; margin: 0 auto; padding-top: 4pt;">
        <strong>${nombreCliente}</strong><br>
        ${cedula}
      </div>
    </div>
  </div>

  <div style="margin-top: 20pt; font-size: 10pt;">
    <div class="note-titulo">NOTA 1: IDENTIFICACIÓN</div>
    <p class="indent">
      Detalle de los ingresos percibidos de ${nombreCliente}, identificado/a con
      la cédula de identidad N° ${cedula}, correspondiente a su actividad económica
      como: ${actividad}. Dirección: ${direccion}.
    </p>

    <div class="note-titulo">NOTA 2: CUADRO DEMOSTRATIVO</div>
    <p class="indent">
      Cuadro demostrativo correspondiente a la actividad económica de
      ${nombreCliente}, identificado/a con la cédula de identidad N° ${cedula}.
      Período: ${periodoStr}.
    </p>
  </div>

  <div class="firma-bloque" style="margin-top: 30pt;">
    <div class="firma-linea"></div>
    <div class="firma-nombre-pie">Lcda. Mariali C. Carrizales P.</div>
    <div>Contador Público Colegiado — C.P.C. 90.419</div>
  </div>

</div>

</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENTO 2: BALANCE PERSONAL
// Informe de Compilación + Estado de Situación Financiera + Notas
// ─────────────────────────────────────────────────────────────────────────────
function htmlBalancePersonal(datos, calculos) {
  const {
    nombreCliente      = '_______________',
    cedula             = '_______________',
    actividad          = '_______________',
    direccion          = '_______________',
    nombreInstitucion  = '_______________',
    fechaBalance,
    ciudad             = '_______________',
    cajaYBancos        = [],
    cuentasPorCobrar   = [],
    inmuebles          = [],
    vehiculos          = [],
    muebles            = [],
    inversiones        = [],
    prestamos          = [],
    cuentasPorPagar    = [],
  } = datos;

  const fechaStr = fmtFecha(fechaBalance);

  // Cálculos por subcategoría
  function sumArr(arr) {
    return arr.reduce((s, r) => s + (Number(r.monto) || 0), 0);
  }
  const totalCaja      = sumArr(cajaYBancos);
  const totalCobrar    = sumArr(cuentasPorCobrar);
  const totalACorriente = totalCaja + totalCobrar;
  const totalInmuebles  = sumArr(inmuebles);
  const totalVehiculos  = sumArr(vehiculos);
  const totalMuebles    = sumArr(muebles);
  const totalInversion  = sumArr(inversiones);
  const totalANoCorriente = totalInmuebles + totalVehiculos + totalMuebles + totalInversion;
  const totalActivos    = totalACorriente + totalANoCorriente;
  const totalPrestamos  = sumArr(prestamos);
  const totalPagarC     = sumArr(cuentasPorPagar);
  const totalPasivos    = totalPrestamos + totalPagarC;
  const patrimonio      = totalActivos - totalPasivos;

  // Filas de tabla para cada categoría
  function filasSimples(arr) {
    return arr.map(r => `
      <tr>
        <td>${r.concepto || r.descripcion || r.banco || ''}</td>
        <td class="td-right">Bs. ${fmtBs(r.monto)}</td>
      </tr>`).join('');
  }

  const filasBancos = cajaYBancos.map(r => `
    <tr>
      <td>${r.banco || 'Efectivo'}</td>
      <td>${r.numeroCuenta || ''}</td>
      <td class="td-right">Bs. ${fmtBs(r.monto)}</td>
    </tr>`).join('');

  const filasInmuebles = inmuebles.map(r => `
    <tr>
      <td>${r.tipo || ''}</td>
      <td>${r.direccion || ''}</td>
      <td class="td-right">Bs. ${fmtBs(r.monto)}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Balance Personal — ${nombreCliente}</title>
  <style>${BASE_CSS}
    .balance-table td, .balance-table th { text-align: left; }
    .balance-table td:last-child, .balance-table th:last-child { text-align: right; width: 160px; }
    .subtotal-row td { font-weight: bold; border-top: 1.5px solid #555; }
    .subtotal-row td:first-child { text-align: left; }
    .subtotal-row td:last-child { text-align: right; }
    .total-row td { font-weight: bold; background: #f0f0f0; border-top: 2px solid #000; }
    .total-row td:first-child { text-align: left; }
    .total-row td:last-child { text-align: right; }
    td.section-header {
      font-weight: bold;
      background: #e8e8e8;
      text-transform: uppercase;
      text-align: left !important;
      font-size: 10pt;
      letter-spacing: 0.3px;
    }
  </style>
</head>
<body>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- PÁGINA 1: INFORME DE COMPILACIÓN                           -->
<!-- ═══════════════════════════════════════════════════════════ -->
<div class="page">

  <div class="header-logo">
    <img class="logo-cpc" src="${LOGO_CPC_URI}" alt="Colegio de Contadores Públicos de Venezuela">
    <div class="firma-nombre">Lcda. Mariali Carrizales</div>
    <div class="firma-titulo">Contador Público Colegiado</div>
    <div class="firma-cpc">C.P.C. 90.419</div>
  </div>

  <hr>

  <h1 class="titulo-doc">Informe de Compilación del Contador Público Independiente</h1>

  <div class="destinatario">
    <span class="label">Señores:</span><br>
    ${nombreInstitucion}<br>
    Presente.-
  </div>

  <p>
    He compilado el Estado de Situación Financiera adjunto de
    <strong>${nombreCliente}</strong>, titular de la Cédula de Identidad
    N° ${cedula}, sobre la base de la información proporcionada por el cliente.
  </p>
  <p>
    Este Estado Financiero comprende el Estado de Situación Financiera al
    <strong>${fechaStr}</strong>, así como las notas explicativas correspondientes.
    He realizado este encargo de compilación de conformidad con la Norma
    Internacional de Servicios Relacionados (NISR) 4410 (Revisada) "Encargos de
    Compilación". He aplicado conocimientos especializados de contabilidad y
    preparación de información financiera, con el fin de facilitar la preparación
    y presentación del presente estado financiero, de conformidad con los
    Principios de Contabilidad Generalmente Aceptados en Venezuela (VEN-NIF PYME),
    cumpliendo con los requerimientos éticos aplicables, incluidos los principios
    de integridad, objetividad y, competencia y diligencia profesional.
  </p>
  <p>
    Usted es responsable de este estado financiero, y de la exactitud e integridad
    de la información utilizada para su compilación. Tratándose de una persona
    natural, es práctica común que no se lleven registros de contabilidad que
    aseguren la inclusión de todos sus activos y pasivos; asimismo, las bases de
    medición utilizadas, en muchos casos, son distintas al costo de adquisición.
  </p>
  <p>
    Puesto que un encargo de compilación no es un encargo de aseguramiento, no he
    verificado ni la exactitud ni la integridad de la información proporcionada
    para la compilación de este estado financiero y, en consecuencia, no expreso
    una opinión de auditoría ni una conclusión de revisión acerca de si la
    información financiera se preparó de conformidad con los Principios de
    Contabilidad Generalmente Aceptados en Venezuela (VEN-NIF PYME).
  </p>
  <p>
    <strong>Limitación de Distribución de la información</strong><br>
    Este informe ha sido preparado exclusivamente para uso de
    ${nombreInstitucion} y no debe ser distribuido a terceros sin
    autorización previa.
  </p>

  <p class="ciudad-fecha">${ciudad}, ${fmtFecha(new Date().toISOString())}</p>

  <div class="firma-bloque">
    <div class="firma-linea"></div>
    <div class="firma-nombre-pie">Lcda. Mariali Carrizales</div>
    <div>Contador Público Colegiado</div>
    <div>C.P.C. 90.419</div>
  </div>

</div>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- PÁGINA 2: ESTADO DE SITUACIÓN FINANCIERA                   -->
<!-- ═══════════════════════════════════════════════════════════ -->
<div class="page" style="page-break-before: always;">

  <div style="text-align: center; margin-bottom: 16pt;">
    <div style="font-weight: bold; font-size: 13pt;">${nombreCliente}</div>
    <div style="font-weight: bold; font-size: 11pt; margin-top: 6pt;">
      ESTADO DE SITUACIÓN FINANCIERA AL ${fechaStr.toUpperCase()}
    </div>
    <div style="font-style: italic; font-size: 10pt;">(EXPRESADO EN BOLÍVARES)</div>
  </div>

  <table class="balance-table">
    <!-- ACTIVOS -->
    <tr><td class="section-header" colspan="2">ACTIVOS</td></tr>
    <tr><td colspan="2" style="font-weight:bold; padding-left: 8pt; padding-top: 6pt;">ACTIVOS CORRIENTES</td></tr>
    <tr>
      <td style="padding-left: 16pt;">Caja y Bancos</td>
      <td class="td-right">Bs. ${fmtBs(totalCaja)}</td>
    </tr>
    ${totalCobrar > 0 ? `<tr>
      <td style="padding-left: 16pt;">Cuentas por Cobrar</td>
      <td class="td-right">Bs. ${fmtBs(totalCobrar)}</td>
    </tr>` : ''}
    <tr class="subtotal-row">
      <td style="padding-left: 8pt;">TOTAL ACTIVOS CORRIENTES</td>
      <td>Bs. ${fmtBs(totalACorriente)}</td>
    </tr>

    <tr><td colspan="2" style="font-weight:bold; padding-left: 8pt; padding-top: 8pt;">ACTIVOS NO CORRIENTES</td></tr>
    ${totalInmuebles > 0 ? `<tr>
      <td style="padding-left: 16pt;">Inmuebles</td>
      <td class="td-right">Bs. ${fmtBs(totalInmuebles)}</td>
    </tr>` : ''}
    ${totalVehiculos > 0 ? `<tr>
      <td style="padding-left: 16pt;">Vehículos</td>
      <td class="td-right">Bs. ${fmtBs(totalVehiculos)}</td>
    </tr>` : ''}
    ${totalMuebles > 0 ? `<tr>
      <td style="padding-left: 16pt;">Muebles y Equipos</td>
      <td class="td-right">Bs. ${fmtBs(totalMuebles)}</td>
    </tr>` : ''}
    ${totalInversion > 0 ? `<tr>
      <td style="padding-left: 16pt;">Inversiones</td>
      <td class="td-right">Bs. ${fmtBs(totalInversion)}</td>
    </tr>` : ''}
    <tr class="subtotal-row">
      <td style="padding-left: 8pt;">TOTAL ACTIVOS NO CORRIENTES</td>
      <td>Bs. ${fmtBs(totalANoCorriente)}</td>
    </tr>

    <tr class="total-row">
      <td>TOTAL ACTIVOS</td>
      <td>Bs. ${fmtBs(totalActivos)}</td>
    </tr>

    <!-- PASIVOS -->
    <tr><td class="section-header" colspan="2" style="padding-top: 12pt;">PASIVOS</td></tr>
    ${totalPrestamos > 0 ? `<tr>
      <td style="padding-left: 16pt;">Préstamos Bancarios</td>
      <td class="td-right">Bs. ${fmtBs(totalPrestamos)}</td>
    </tr>` : ''}
    ${totalPagarC > 0 ? `<tr>
      <td style="padding-left: 16pt;">Cuentas por Pagar</td>
      <td class="td-right">Bs. ${fmtBs(totalPagarC)}</td>
    </tr>` : ''}
    <tr class="subtotal-row">
      <td>TOTAL PASIVOS</td>
      <td>Bs. ${fmtBs(totalPasivos)}</td>
    </tr>

    <!-- PATRIMONIO -->
    <tr><td class="section-header" colspan="2" style="padding-top: 12pt;">PATRIMONIO</td></tr>
    <tr>
      <td style="padding-left: 16pt;">Capital</td>
      <td class="td-right">Bs. ${fmtBs(patrimonio)}</td>
    </tr>
    <tr class="subtotal-row">
      <td>TOTAL PATRIMONIO</td>
      <td>Bs. ${fmtBs(patrimonio)}</td>
    </tr>
    <tr class="total-row">
      <td>TOTAL PASIVO Y PATRIMONIO</td>
      <td>Bs. ${fmtBs(totalPasivos + patrimonio)}</td>
    </tr>
  </table>

</div>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- PÁGINA 3: NOTAS AL ESTADO DE SITUACIÓN FINANCIERA          -->
<!-- ═══════════════════════════════════════════════════════════ -->
<div class="page" style="page-break-before: always;">

  <h1 class="titulo-doc">Notas al Estado de Situación Financiera</h1>

  <div class="note-titulo">NOTA 1. IDENTIFICACIÓN DEL RESPONSABLE DE LA INFORMACIÓN</div>
  <p class="indent">
    Los ingresos percibidos por <strong>${nombreCliente}</strong>, titular de la
    C.I. N° ${cedula}, domiciliado/a en ${direccion}.
    Corresponden a su actividad como ${actividad}.
  </p>

  <div class="note-titulo">NOTA 2. BASES DE PREPARACIÓN</div>
  <p class="indent">
    El Estado de Situación Financiera ha sido preparado tomando como referencia
    los VEN-NIF aplicables en Venezuela, pero no cumplen en totalidad con los
    VEN-NIF por tratarse de una persona natural no comerciante y por lo tanto no
    está obligada a llevar registros de contabilidad de conformidad con el Código
    de Comercio.
  </p>

  <div class="note-titulo">NOTA 3. BASES DE MEDICIÓN</div>
  <p class="indent">
    El balance general personal está preparado a valores nominales o históricos,
    incluyendo valores razonables para los activos que le son aplicables de
    conformidad con los principios de contabilidad de aceptación general en
    Venezuela.
  </p>

  <div class="note-titulo">NOTA 4. USO DE ESTIMADOS Y JUICIOS</div>
  <p class="indent">
    La preparación de estados financieros, de conformidad con principios de
    contabilidad de aceptación general en Venezuela (VEN-NIF), requiere se
    realicen una serie de juicios, estimados y suposiciones que afectan la
    aplicación de las políticas contables en relación con los montos presentados
    de activos, pasivos, ingresos y gastos informados durante el período
    correspondiente. Los resultados finales pudieran diferir de tales estimados.
  </p>

  <div class="note-titulo">NOTA 5. POLÍTICAS CONTABLES SIGNIFICATIVAS</div>
  <p class="indent">
    Las políticas y principios contables más significativos han sido
    consistentemente aplicados para la preparación de los estados financieros.
    Los saldos presentados se clasifican en función de su vencimiento: como
    corriente aquellos con vencimiento igual o inferior a doce meses, y como no
    corriente los de vencimiento superior a dicho período.
  </p>

  ${cajaYBancos.length > 0 ? `
  <div class="note-titulo">NOTA 6. BANCOS</div>
  <p class="indent">Detalle de efectivo y cuentas bancarias:</p>
  <table class="indent" style="margin-left: 20pt; width: calc(100% - 20pt);">
    <thead>
      <tr>
        <th>Banco / Efectivo</th>
        <th>N° de cuenta</th>
        <th style="text-align:right;">Monto (Bs.)</th>
      </tr>
    </thead>
    <tbody>${filasBancos}</tbody>
    <tfoot>
      <tr class="subtotal-row">
        <td colspan="2">TOTAL</td>
        <td class="td-right">Bs. ${fmtBs(totalCaja)}</td>
      </tr>
    </tfoot>
  </table>` : ''}

  ${inmuebles.length > 0 ? `
  <div class="note-titulo">NOTA 7. INMUEBLES</div>
  <p class="indent">Detalle de propiedades y valor estimado:</p>
  <table class="indent" style="margin-left: 20pt; width: calc(100% - 20pt);">
    <thead>
      <tr>
        <th>Tipo de inmueble</th>
        <th>Dirección</th>
        <th style="text-align:right;">Valor estimado (Bs.)</th>
      </tr>
    </thead>
    <tbody>${filasInmuebles}</tbody>
    <tfoot>
      <tr class="subtotal-row">
        <td colspan="2">TOTAL</td>
        <td class="td-right">Bs. ${fmtBs(totalInmuebles)}</td>
      </tr>
    </tfoot>
  </table>` : ''}

  ${vehiculos.length > 0 ? `
  <div class="note-titulo">NOTA 8. VEHÍCULOS</div>
  <p class="indent">Detalle de vehículos y valor estimado:</p>
  <table class="indent" style="margin-left: 20pt; width: calc(100% - 20pt);">
    <thead><tr><th>Descripción</th><th style="text-align:right;">Valor estimado (Bs.)</th></tr></thead>
    <tbody>${filasSimples(vehiculos)}</tbody>
    <tfoot><tr class="subtotal-row"><td>TOTAL</td><td class="td-right">Bs. ${fmtBs(totalVehiculos)}</td></tr></tfoot>
  </table>` : ''}

  ${muebles.length > 0 ? `
  <div class="note-titulo">NOTA 9. MUEBLES Y ENSERES DEL HOGAR</div>
  <p class="indent">Detalle de muebles y enseres y valor estimado:</p>
  <table class="indent" style="margin-left: 20pt; width: calc(100% - 20pt);">
    <thead><tr><th>Descripción</th><th style="text-align:right;">Valor estimado (Bs.)</th></tr></thead>
    <tbody>${filasSimples(muebles)}</tbody>
    <tfoot><tr class="subtotal-row"><td>TOTAL</td><td class="td-right">Bs. ${fmtBs(totalMuebles)}</td></tr></tfoot>
  </table>` : ''}

  ${inversiones.length > 0 ? `
  <div class="note-titulo">NOTA 10. INVERSIONES</div>
  <p class="indent">Detalle de acciones o participaciones societarias:</p>
  <table class="indent" style="margin-left: 20pt; width: calc(100% - 20pt);">
    <thead><tr><th>Descripción</th><th style="text-align:right;">Monto (Bs.)</th></tr></thead>
    <tbody>${filasSimples(inversiones)}</tbody>
    <tfoot><tr class="subtotal-row"><td>TOTAL</td><td class="td-right">Bs. ${fmtBs(totalInversion)}</td></tr></tfoot>
  </table>` : ''}

  <div style="margin-top: 40pt; text-align: center; page-break-inside: avoid;">
    <div style="border-top: 1px solid #000; width: 55%; margin: 0 auto; padding-top: 4pt;">
      <strong>${nombreCliente}</strong><br>
      C.I. N° ${cedula}
    </div>
  </div>

</div>

</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Selector principal
// ─────────────────────────────────────────────────────────────────────────────
function generarHtmlDocumento(tipo, datos, calculos) {
  if (tipo === 'CERTIFICACION_INGRESOS') return htmlCertificacionIngresos(datos, calculos);
  if (tipo === 'BALANCE_PERSONAL')       return htmlBalancePersonal(datos, calculos);
  throw new Error(`Tipo de documento no soportado: ${tipo}`);
}

module.exports = { generarHtmlDocumento };
