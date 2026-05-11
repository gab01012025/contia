-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "TramiteTipo" AS ENUM ('CERTIFICACION_INGRESOS', 'BALANCE_PERSONAL', 'IVA', 'PRESTACIONES_SOCIALES');

-- CreateEnum
CREATE TYPE "TramiteEstado" AS ENUM ('PENDIENTE', 'EN_REVISION', 'APROBADO', 'DEVUELTO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cedula" TEXT,
    "telefono" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tramite" (
    "id" TEXT NOT NULL,
    "tipo" "TramiteTipo" NOT NULL,
    "estado" "TramiteEstado" NOT NULL DEFAULT 'PENDIENTE',
    "datos" JSONB NOT NULL,
    "calculos" JSONB,
    "contenidoIA" TEXT,
    "pdfUrl" TEXT,
    "userId" TEXT NOT NULL,
    "revisorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "Tramite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Observacion" (
    "id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "tramiteId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Observacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "tramiteId" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Tramite_userId_idx" ON "Tramite"("userId");

-- CreateIndex
CREATE INDEX "Tramite_estado_idx" ON "Tramite"("estado");

-- CreateIndex
CREATE INDEX "Tramite_tipo_idx" ON "Tramite"("tipo");

-- CreateIndex
CREATE INDEX "Observacion_tramiteId_idx" ON "Observacion"("tramiteId");

-- CreateIndex
CREATE INDEX "AuditLog_tramiteId_idx" ON "AuditLog"("tramiteId");

-- AddForeignKey
ALTER TABLE "Tramite" ADD CONSTRAINT "Tramite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tramite" ADD CONSTRAINT "Tramite_revisorId_fkey" FOREIGN KEY ("revisorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observacion" ADD CONSTRAINT "Observacion_tramiteId_fkey" FOREIGN KEY ("tramiteId") REFERENCES "Tramite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observacion" ADD CONSTRAINT "Observacion_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tramiteId_fkey" FOREIGN KEY ("tramiteId") REFERENCES "Tramite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
