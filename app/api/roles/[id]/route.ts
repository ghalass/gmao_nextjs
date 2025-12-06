// app/api/roles/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  protectCreateRoute,
  protectDeleteRoute,
  protectReadRoute,
  protectUpdateRoute,
} from "@/lib/rbac/middleware";

function getIdFromUrl(url: string): string {
  const pathSegments = new URL(url).pathname.split("/");
  return pathSegments[pathSegments.length - 1];
}

const resource = "role";

// GET - Récupérer un rôle spécifique
export async function GET(request: NextRequest) {
  try {
    const protectionError = await protectReadRoute(request, resource);
    if (protectionError) return protectionError;

    const id = getIdFromUrl(request.url);
    if (!id || id === "roles") {
      return NextResponse.json(
        { message: "ID du rôle requis" },
        { status: 400 }
      );
    }

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      return NextResponse.json({ message: "Rôle non trouvé" }, { status: 404 });
    }

    return NextResponse.json(role);
  } catch (error) {
    console.error("Error fetching role:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération du rôle" },
      { status: 500 }
    );
  }
}

// PUT - Modifier un rôle
export async function PUT(request: NextRequest) {
  try {
    const protectionError = await protectUpdateRoute(request, resource);
    if (protectionError) return protectionError;

    const id = getIdFromUrl(request.url);

    if (!id || id === "roles") {
      return NextResponse.json(
        { message: "ID du rôle requis" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const { name, description, permissions } = body;

    const existingRole = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: true,
      },
    });

    if (!existingRole) {
      return NextResponse.json({ message: "Rôle non trouvé" }, { status: 404 });
    }

    // Mettre à jour le rôle et ses permissions
    const role = await prisma.role.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
      },
    });

    // Mettre à jour les permissions si elles sont fournies
    if (permissions !== undefined) {
      // Supprimer les permissions existantes
      await prisma.rolePermission.deleteMany({
        where: { roleId: id },
      });

      // Ajouter les nouvelles permissions
      if (permissions.length > 0) {
        await prisma.rolePermission.createMany({
          data: permissions.map((permissionId: string) => ({
            roleId: id,
            permissionId,
          })),
        });
      }

      // Récupérer le rôle avec les nouvelles permissions
      const updatedRole = await prisma.role.findUnique({
        where: { id },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      return NextResponse.json(updatedRole);
    }

    return NextResponse.json(role);
  } catch (error) {
    console.error("Error updating role:", error);

    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { message: "Un rôle avec ce nom existe déjà" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Erreur lors de la modification du rôle" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un rôle
export async function DELETE(request: NextRequest) {
  try {
    const protectionError = await protectDeleteRoute(request, resource);
    if (protectionError) return protectionError;

    const id = getIdFromUrl(request.url);

    if (!id || id === "roles") {
      return NextResponse.json(
        { message: "ID du rôle requis" },
        { status: 400 }
      );
    }

    const existingRole = await prisma.role.findUnique({
      where: { id },
      include: {
        users: true,
      },
    });

    if (!existingRole) {
      return NextResponse.json({ message: "Rôle non trouvé" }, { status: 404 });
    }

    // Vérifier si le rôle est utilisé par des utilisateurs
    if (existingRole.users && existingRole.users.length > 0) {
      return NextResponse.json(
        {
          message: `Ce rôle est utilisé par ${existingRole.users.length} utilisateur(s). Vous ne pouvez pas le supprimer.`,
        },
        { status: 400 }
      );
    }

    await prisma.role.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Rôle supprimé avec succès" });
  } catch (error) {
    console.error("Error deleting role:", error);

    if (
      error instanceof Error &&
      error.message.includes("Record to delete does not exist")
    ) {
      return NextResponse.json({ message: "Rôle non trouvé" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Erreur lors de la suppression du rôle" },
      { status: 500 }
    );
  }
}
