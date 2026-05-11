// Seed inicial: crea usuario admin
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@contia.io';
  const passwordHash = await bcrypt.hash('admin1234', 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: passwordHash,
      nombre: 'Administrador CONTIA',
      role: 'ADMIN',
    },
  });

  console.log(`Admin creado: ${adminEmail} / admin1234`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
