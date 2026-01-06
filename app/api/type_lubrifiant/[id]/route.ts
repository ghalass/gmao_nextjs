// app/api/type_lubrifiant/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  protectDeleteRoute,
  protectReadRoute,
  protectUpdateRoute,
} from "@/lib/rbac/middleware";

const the_resource = "type_lubrifiant";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { message: "ID du type de lubrifiant requis" },
        { status: 400 }
      );
    }

    const typeLubrifiant = await prisma.typelubrifiant.findUnique({
      where: { id },
      include: {
        _count: {
          select: { lubrifiants: true },
        },
      },
    });

    if (!typeLubrifiant) {
      return NextResponse.json(
        { message: "Type de lubrifiant non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(typeLubrifiant);
  } catch (error) {
    console.error("Error fetching type lubrifiant:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération du type de lubrifiant" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const protectionError = await protectUpdateRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { message: "ID du type de lubrifiant requis" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name } = body;

    // Validation des données
    if (name && typeof name !== "string") {
      return NextResponse.json(
        { message: "Le nom doit être une chaîne de caractères" },
        { status: 400 }
      );
    }

    const existingTypeLubrifiant = await prisma.typelubrifiant.findUnique({
      where: { id },
    });

    if (!existingTypeLubrifiant) {
      return NextResponse.json(
        { message: "Type de lubrifiant non trouvé" },
        { status: 404 }
      );
    }

    const typeLubrifiant = await prisma.typelubrifiant.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
      },
    });

    return NextResponse.json(typeLubrifiant);
  } catch (error) {
    console.error("Error updating type lubrifiant:", error);

    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return NextResponse.json(
          { message: "Un type de lubrifiant avec ce nom existe déjà" },
          { status: 400 }
        );
      }
      if (error.message.includes("Record to update not found")) {
        return NextResponse.json(
          { message: "Type de lubrifiant non trouvé" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { message: "Erreur lors de la modification du type de lubrifiant" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const protectionError = await protectDeleteRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { message: "ID du type de lubrifiant requis" },
        { status: 400 }
      );
    }

    // Vérifier s'il y a des lubrifiants associés
    const lubrifiantsCount = await prisma.lubrifiant.count({
      where: { typelubrifiantId: id },
    });

    if (lubrifiantsCount > 0) {
      return NextResponse.json(
        {
          message: `Impossible de supprimer ce type de lubrifiant car il est utilisé par ${lubrifiantsCount} lubrifiant(s)`,
        },
        { status: 400 }
      );
    }

    const existingTypeLubrifiant = await prisma.typelubrifiant.findUnique({
      where: { id },
    });

    if (!existingTypeLubrifiant) {
      return NextResponse.json(
        { message: "Type de lubrifiant non trouvé" },
        { status: 404 }
      );
    }

    await prisma.typelubrifiant.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Type de lubrifiant supprimé avec succès",
    });
  } catch (error) {
    console.error("Error deleting type lubrifiant:", error);

    if (
      error instanceof Error &&
      error.message.includes("Record to delete does not exist")
    ) {
      return NextResponse.json(
        { message: "Type de lubrifiant non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Erreur lors de la suppression du type de lubrifiant" },
      { status: 500 }
    );
  }
}
