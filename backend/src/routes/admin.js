const router = require('express').Router();
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { authMiddleware, adminOnly } = require('../middlewares/auth');
const { notificarUsuarioAprobado, notificarUsuarioDevuelto } = require('../email/resend');

router.use(authMiddleware, adminOnly);

// listar tramites con filtro por estado
router.get('/tramites', async (req, res, next) => {
  try {
    const { estado, tipo } = req.query;
    const where = {};
    if (estado) where.estado = estado;
    if (tipo) where.tipo = tipo;

    const tramites = await prisma.tramite.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, nombre: true, email: true } },
      },
    });
    res.json({ tramites });
  } catch (e) { next(e); }
});

// detalle completo
router.get('/tramites/:id', async (req, res, next) => {
  try {
    const tramite = await prisma.tramite.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, nombre: true, email: true, cedula: true } },
        revisor: { select: { id: true, nombre: true } },
        observaciones: {
          include: { autor: { select: { nombre: true } } },
          orderBy: { createdAt: 'desc' },
        },
        auditoria: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!tramite) return res.status(404).json({ error: 'No encontrado' });

    // marcar en revision si estaba pendiente
    if (tramite.estado === 'PENDIENTE') {
      await prisma.tramite.update({
        where: { id: tramite.id },
        data: { estado: 'EN_REVISION', revisorId: req.user.id },
      });
      await prisma.auditLog.create({
        data: { tramiteId: tramite.id, accion: 'en_revision' },
      });
      tramite.estado = 'EN_REVISION';
    }

    res.json({ tramite });
  } catch (e) { next(e); }
});

// aprobar
router.post('/tramites/:id/aprobar', async (req, res, next) => {
  try {
    const tramite = await prisma.tramite.update({
      where: { id: req.params.id },
      data: { estado: 'APROBADO', revisorId: req.user.id, reviewedAt: new Date() },
      include: { user: true },
    });
    await prisma.auditLog.create({
      data: { tramiteId: tramite.id, accion: 'aprobado' },
    });
    notificarUsuarioAprobado({ tramite, user: tramite.user }).catch(() => {});
    res.json({ tramite });
  } catch (e) { next(e); }
});

// devolver con observaciones
const devolverSchema = z.object({ observacion: z.string().min(3) });

router.post('/tramites/:id/devolver', async (req, res, next) => {
  try {
    const { observacion } = devolverSchema.parse(req.body);
    const tramite = await prisma.tramite.update({
      where: { id: req.params.id },
      data: { estado: 'DEVUELTO', revisorId: req.user.id, reviewedAt: new Date() },
      include: { user: true },
    });
    await prisma.observacion.create({
      data: { tramiteId: tramite.id, texto: observacion, autorId: req.user.id },
    });
    await prisma.auditLog.create({
      data: { tramiteId: tramite.id, accion: 'devuelto', meta: { observacion } },
    });
    notificarUsuarioDevuelto({ tramite, user: tramite.user, observacion }).catch(() => {});
    res.json({ tramite });
  } catch (e) { next(e); }
});

// dashboard counts
router.get('/dashboard', async (_req, res, next) => {
  try {
    const [pendientes, enRevision, aprobados, devueltos, total] = await Promise.all([
      prisma.tramite.count({ where: { estado: 'PENDIENTE' } }),
      prisma.tramite.count({ where: { estado: 'EN_REVISION' } }),
      prisma.tramite.count({ where: { estado: 'APROBADO' } }),
      prisma.tramite.count({ where: { estado: 'DEVUELTO' } }),
      prisma.tramite.count(),
    ]);
    res.json({ pendientes, enRevision, aprobados, devueltos, total });
  } catch (e) { next(e); }
});

module.exports = router;
