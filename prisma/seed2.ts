// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Début du seed...");

  // Créer des rôles de base
  const adminRole = await prisma.role.upsert({
    where: { name: "Admin" },
    update: {},
    create: {
      name: "Admin",
      description: "Administrateur avec tous les droits",
    },
  });

  const editorRole = await prisma.role.upsert({
    where: { name: "Éditeur" },
    update: {},
    create: {
      name: "Éditeur",
      description: "Peut créer et modifier du contenu",
    },
  });

  const viewerRole = await prisma.role.upsert({
    where: { name: "Lecteur" },
    update: {},
    create: {
      name: "Lecteur",
      description: "Peut uniquement consulter le contenu",
    },
  });

  console.log("✅ Rôles créés:", { adminRole, editorRole, viewerRole });
  console.log("✅ Seed terminé avec succès!");
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
