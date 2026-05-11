# CONTIA

> Plataforma web de tramites contables y laborales asistidos por IA.
> Cliente: Dr. José — Venezuela.

## Módulos del MVP

1. **Certificación de Ingresos / Balance Personal**
2. **IVA (cálculo referencial)**
3. **Prestaciones Sociales** (LOTTT Venezuela)

Cada trámite generado pasa por un **flujo de revisión profesional**:
`Pendiente → En revisión → Aprobado / Devuelto con observaciones`

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 14 (App Router) + TailwindCSS + PWA |
| Backend | Node.js + Express |
| ORM / DB | Prisma + PostgreSQL (Neon) |
| IA | OpenAI GPT-4o-mini (redacción) + lógica programada (cálculos) |
| Email | Resend |
| PDF | Puppeteer / react-pdf |
| Auth | JWT + bcrypt |
| Hosting frontend | Vercel |
| Hosting backend | Render |
| Versionado | GitHub |

## Estructura

```
contia/
  frontend/    # Next.js 14 PWA
  backend/     # API Express + Prisma
  docs/        # Documentación técnica
```

## Setup local

```bash
# Backend
cd backend
cp .env.example .env   # configurar DATABASE_URL, JWT_SECRET, OPENAI_API_KEY
npm install
npx prisma migrate dev
npm run dev            # http://localhost:4000

# Frontend
cd frontend
cp .env.example .env.local   # configurar NEXT_PUBLIC_API_URL
npm install
npm run dev                  # http://localhost:3000
```

## Cronograma

- **Semana 1** — Setup + Módulo 1 (Certificación / Balance)
- **Semana 2 (1ª)** — Módulo 2 (IVA)
- **Semana 2 (2ª)** — Módulo 3 (Prestaciones LOTTT)
- **Semana 3** — Panel admin + notificaciones + ajustes finales

## Estado actual

- [x] Scaffold inicial creado
- [x] Estructura modular del backend
- [x] Estructura del frontend con páginas base
- [ ] Login funcional (en progreso)
- [ ] Módulo 1 (próximo)
