const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { sign, authMiddleware } = require('../middlewares/auth');

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nombre: z.string().min(2),
  cedula: z.string().optional(),
  telefono: z.string().optional(),
});

router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) return res.status(409).json({ error: 'Email ya registrado' });

    const hash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: { ...data, password: hash },
      select: { id: true, email: true, nombre: true, role: true },
    });
    const token = sign({ id: user.id, email: user.email, role: user.role });
    res.json({ user, token });
  } catch (e) { next(e); }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Credenciales invalidas' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Credenciales invalidas' });
    const token = sign({ id: user.id, email: user.email, role: user.role });
    res.json({
      user: { id: user.id, email: user.email, nombre: user.nombre, role: user.role },
      token,
    });
  } catch (e) { next(e); }
});

router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, nombre: true, role: true, cedula: true, telefono: true },
    });
    res.json({ user });
  } catch (e) { next(e); }
});

module.exports = router;
