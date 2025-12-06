import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Créer les permissions
  const permissions = [
    {
      name: "read:sites",
      resource: "sites",
      action: "read",
      description: "Lire les articles",
    },
    {
      name: "create:sites",
      resource: "sites",
      action: "create",
      description: "Créer des articles",
    },
    {
      name: "update:sites",
      resource: "sites",
      action: "update",
      description: "Modifier des articles",
    },
    {
      name: "delete:sites",
      resource: "sites",
      action: "delete",
      description: "Supprimer des articles",
    },
    {
      name: "manage:users",
      resource: "users",
      action: "manage",
      description: "Gérer les utilisateurs",
    },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
  }

  // Créer les rôles
  const adminRole = await prisma.role.upsert({
    where: { name: "admin" },
    update: {},
    create: {
      name: "admin",
      description: "Administrateur avec tous les droits",
    },
  });

  const editorRole = await prisma.role.upsert({
    where: { name: "editor" },
    update: {},
    create: {
      name: "editor",
      description: "Éditeur pouvant gérer le contenu",
    },
  });

  // Assigner toutes les permissions à admin
  const allPermissions = await prisma.permission.findMany();
  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: perm.id,
      },
    });
  }

  // Assigner certaines permissions à editor
  const editorPerms = await prisma.permission.findMany({
    where: {
      name: { in: ["read:sites", "create:sites", "update:sites"] },
    },
  });

  for (const perm of editorPerms) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: editorRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: editorRole.id,
        permissionId: perm.id,
      },
    });
  }

  console.log("Seed completed!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
