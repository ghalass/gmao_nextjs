// app/api/resources/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  protectDeleteRoute,
  protectReadRoute,
  protectRoute,
  protectUpdateRoute,
} from "@/lib/rbac/middleware";

function getIdFromUrl(url: string): string {
  const pathSegments = new URL(url).pathname.split("/");
  return pathSegments[pathSegments.length - 1];
}

const the_resource = "resources";

// GET - Récupérer une ressource spécifique
export async function GET(request: NextRequest) {
  try {
    // Vérifier la permission de lecture des ressources
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const id = getIdFromUrl(request.url);

    if (!id || id === "resources") {
      return NextResponse.json(
        { message: "ID de la ressource requis" },
        { status: 400 }
      );
    }

    const resource = await prisma.resource.findUnique({
      where: { id },
      include: {
        permissions: {
          select: {
            id: true,
            name: true,
            action: true,
            description: true,
            createdAt: true,
          },
        },
      },
    });

    if (!resource) {
      return NextResponse.json(
        { message: "Ressource non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(resource);
  } catch (error) {
    console.error("Error fetching resource:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération de la ressource" },
      { status: 500 }
    );
  }
}

// PUT - Modifier une ressource
export async function PUT(request: NextRequest) {
  try {
    // Vérifier la permission de modification des ressources
    const protectionError = await protectUpdateRoute(request, the_resource);
    if (protectionError) return protectionError;
    const id = getIdFromUrl(request.url);

    if (!id || id === "resources") {
      return NextResponse.json(
        { message: "ID de la ressource requis" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, label } = body;

    // Vérifier si la ressource existe
    const existingResource = await prisma.resource.findUnique({
      where: { id },
    });

    if (!existingResource) {
      return NextResponse.json(
        { message: "Ressource non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier les conflits de nom
    if (name && name !== existingResource.name) {
      const nameConflict = await prisma.resource.findUnique({
        where: { name },
      });

      if (nameConflict) {
        return NextResponse.json(
          { message: "Une ressource avec ce nom existe déjà" },
          { status: 409 }
        );
      }
    }

    const resource = await prisma.resource.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(label !== undefined && { label: label.trim() }),
      },
      include: {
        permissions: {
          select: {
            id: true,
            name: true,
            action: true,
          },
        },
      },
    });

    return NextResponse.json(resource);
  } catch (error) {
    console.error("Error updating resource:", error);
    return NextResponse.json(
      { message: "Erreur lors de la modification de la ressource" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une ressource
export async function DELETE(request: NextRequest) {
  try {
    // Vérifier la permission de suppression des ressources
    const protectionError = await protectDeleteRoute(request, the_resource);
    if (protectionError) return protectionError;

    const id = getIdFromUrl(request.url);

    if (!id || id === "resources") {
      return NextResponse.json(
        { message: "ID de la ressource requis" },
        { status: 400 }
      );
    }

    const existingResource = await prisma.resource.findUnique({
      where: { id },
      include: {
        permissions: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!existingResource) {
      return NextResponse.json(
        { message: "Ressource non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier si la ressource est utilisée par des permissions
    if (existingResource.permissions.length > 0) {
      return NextResponse.json(
        {
          message: `Impossible de supprimer cette ressource car elle est utilisée par ${existingResource.permissions.length} permission(s)`,
        },
        { status: 400 }
      );
    }

    await prisma.resource.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Ressource supprimée avec succès" });
  } catch (error) {
    console.error("Error deleting resource:", error);
    return NextResponse.json(
      { message: "Erreur lors de la suppression de la ressource" },
      { status: 500 }
    );
  }
}
