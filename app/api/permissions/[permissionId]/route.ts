import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRouteParams } from "@/lib/routeParams";
import {
  protectDeleteRoute,
  protectReadRoute,
  protectUpdateRoute,
} from "@/lib/rbac/middleware";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

const the_resource = "permissions";

export async function GET(request: NextRequest) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    console.log("=== GET Permission Request ===");
    const { id } = await getRouteParams(request);
    console.log("GET request for permission ID:", id);

    if (!id) {
      return NextResponse.json(
        { message: "ID de la permission requis" },
        { status: 400 }
      );
    }

    const permission = await prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      return NextResponse.json(
        { message: "Permission non trouvée" },
        { status: 404 }
      );
    }

    console.log("✅ Permission found:", permission.id);
    return NextResponse.json(permission);
  } catch (error) {
    console.error("❌ Error fetching permission:", error);

    if (error instanceof Error && error.message.includes("ID non trouvé")) {
      return NextResponse.json(
        { message: "ID de la permission requis" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Erreur lors de la récupération de la permission" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const protectionError = await protectUpdateRoute(request, the_resource);
    if (protectionError) return protectionError;

    console.log("=== PUT Permission Request ===");
    const { id } = await getRouteParams(request);
    console.log("PUT request for permission ID:", id);

    if (!id) {
      return NextResponse.json(
        { message: "ID de la permission requis" },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log("Request body:", body);

    const { name, resourceId, action, description } = body;

    const existingPermission = await prisma.permission.findUnique({
      where: { id },
    });

    if (!existingPermission) {
      console.error("Permission not found for ID:", id);
      return NextResponse.json(
        { message: "Permission non trouvée" },
        { status: 404 }
      );
    }

    const permission = await prisma.permission.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(resourceId !== undefined && { resourceId }),
        ...(action !== undefined && { action }),
        ...(description !== undefined && { description }),
      },
    });

    console.log("✅ Permission updated successfully:", permission.id);
    return NextResponse.json(permission);
  } catch (error) {
    console.error("❌ Error updating permission:", error);

    if (error instanceof Error) {
      if (error.message.includes("ID non trouvé")) {
        return NextResponse.json(
          { message: "ID de la permission requis" },
          { status: 400 }
        );
      }

      if (error.message.includes("Unique constraint")) {
        return NextResponse.json(
          {
            message:
              "Une permission avec ce nom ou cette combinaison ressource/action existe déjà",
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { message: "Erreur lors de la modification de la permission" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const protectionError = await protectDeleteRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { id } = await getRouteParams(request);

    if (!id) {
      return NextResponse.json(
        { message: "ID de la permission requis" },
        { status: 400 }
      );
    }

    const existingPermission = await prisma.permission.findUnique({
      where: { id },
    });

    if (!existingPermission) {
      return NextResponse.json(
        { message: "Permission non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier si la permission est utilisée dans des rôles
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { permissionId: id },
      include: {
        role: {
          select: { name: true },
        },
      },
    });

    if (rolePermissions.length > 0) {
      const roleNames = rolePermissions.map((rp) => rp.role.name).join(", ");
      return NextResponse.json(
        {
          message: `Cette permission est utilisée dans le(s) rôle(s): ${roleNames}. Veuillez d'abord la retirer de ces rôles.`,
        },
        { status: 400 }
      );
    }

    await prisma.permission.delete({
      where: { id },
    });

    console.log("✅ Permission deleted successfully:", id);
    return NextResponse.json({ message: "Permission supprimée avec succès" });
  } catch (error) {
    console.error("❌ Error deleting permission:", error);

    if (error instanceof Error) {
      if (error.message.includes("ID non trouvé")) {
        return NextResponse.json(
          { message: "ID de la permission requis" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { message: "Erreur lors de la suppression de la permission" },
      { status: 500 }
    );
  }
}
