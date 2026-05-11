const router = require('express').Router();
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { authMiddleware } = require('../middlewares/auth');
const { calcularIVA } = require('../modulos/iva/calculator');
const { calcularPrestaciones } = require('../modulos/prestaciones/calculator');
const { calcularBalance } = require('../modulos/certificacion/calculator');
const { notificarAdminNuevoTramite } = require('../email/resend');

router.use(authMiddleware);

// listar mis tramites
router.get('/', async (req, res, next) => {
  try {
    const tramites = await prisma.tramite.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, tipo: true, estado: true, createdAt: true,
        updatedAt: true, reviewedAt: true,
      },
    });
    res.json({ tramites });
  } catch (e) { next(e); }
});

// detalle de un tramite mio
router.get('/:id', async (req, res, next) => {
  try {
    const tramite = await prisma.tramite.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        observaciones: { include: { autor: { select: { nombre: true } } }, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!tramite) return res.status(404).json({ error: 'No encontrado' });
    res.json({ tramite });
  } catch (e) { next(e); }
});

const crearSchema = z.object({
  tipo: z.enum(['CERTIFICACION_INGRESOS', 'BALANCE_PERSONAL', 'IVA', 'PRESTACIONES_SOCIALES']),
  datos: z.record(z.any()),
});

// crear nuevo tramite
router.post('/', async (req, res, next) => {
  try {
    const { tipo, datos } = crearSchema.parse(req.body);

    let calculos = null;
    try {
      if (tipo === 'IVA') calculos = calcularIVA(datos);
      else if (tipo === 'PRESTACIONES_SOCIALES') calculos = calcularPrestaciones(datos);
      else if (tipo === 'CERTIFICACION_INGRESOS' || tipo === 'BALANCE_PERSONAL') {
        calculos = calcularBalance(datos);
      }
    } catch (e) {
      return res.status(400).json({ error: `Datos invalidos: ${e.message}` });
    }

    const tramite = await prisma.tramite.create({
      data: {
        tipo,
        datos,
        calculos,
        userId: req.user.id,
      },
    });

    await prisma.auditLog.create({
      data: { tramiteId: tramite.id, accion: 'creado' },
    });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    notificarAdminNuevoTramite({ tramite, user }).catch(() => {});

    res.status(201).json({ tramite });
  } catch (e) { next(e); }
});

// reenviar tramite devuelto (con datos corregidos)
router.put('/:id/reenviar', async (req, res, next) => {
  try {
    const datos = req.body?.datos;
    if (!datos) return res.status(400).json({ error: 'datos requeridos' });

    const tramite = await prisma.tramite.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!tramite) return res.status(404).json({ error: 'No encontrado' });
    if (tramite.estado !== 'DEVUELTO') {
      return res.status(400).json({ error: 'Solo tramites devueltos pueden reenviarse' });
    }

    let calculos = tramite.calculos;
    if (tramite.tipo === 'IVA') calculos = calcularIVA(datos);
    else if (tramite.tipo === 'PRESTACIONES_SOCIALES') calculos = calcularPrestaciones(datos);
    else calculos = calcularBalance(datos);

    const updated = await prisma.tramite.update({
      where: { id: tramite.id },
      data: { datos, calculos, estado: 'PENDIENTE' },
    });

    await prisma.auditLog.create({
      data: { tramiteId: tramite.id, accion: 'reenviado' },
    });

    res.json({ tramite: updated });
  } catch (e) { next(e); }
});

module.exports = router;
