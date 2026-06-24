import { PrismaClient, UserRole, UserStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@multiplusacademy.ao";

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const superAdmin = await prisma.user.create({
      data: {
        firstName: "Super",
        lastName: "Administrador",
        email: adminEmail,
        phone: "+244900000000",
        role: UserRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
    console.log(`Seed completo: Super Administrador criado com ID (${superAdmin.id}) e email (${superAdmin.email})`);
  } else {
    console.log(`Seed ignorado: O Super Administrador (${adminEmail}) já está presente.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
