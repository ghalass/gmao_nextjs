// app/api/saisiehrm/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectDeleteRoute, protectReadRoute } from "@/lib/rbac/middleware";

const the_resource = "saisiehrm";

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
        { message: "ID de la saisie HRM requis" },
        { status: 400 }
      );
    }

    const saisiehrm = await prisma.saisiehrm.findUnique({
      where: { id },
      include: {
        engin: {
          select: {
            id: true,
            name: true,
          },
        },
        site: {
          select: {
            id: true,
            name: true,
          },
        },
        saisiehim: {
          include: {
            panne: {
              include: {
                typepanne: true,
              },
            },
            engin: true,
          },
        },
      },
    });

    if (!saisiehrm) {
      return NextResponse.json(
        { message: "Saisie HRM non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(saisiehrm);
  } catch (error) {
    console.error("Error fetching saisiehrm:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération de la saisie HRM" },
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
        { message: "ID de la saisie HRM requis" },
        { status: 400 }
      );
    }

    // Vérifier si la saisie existe
    const existingSaisiehrm = await prisma.saisiehrm.findUnique({
      where: { id },
      include: {
        saisiehim: true,
      },
    });

    if (!existingSaisiehrm) {
      return NextResponse.json(
        { message: "Saisie HRM non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier s'il y a des saisies HIM associées
    if (existingSaisiehrm.saisiehim.length > 0) {
      return NextResponse.json(
        {
          message: `Cette saisie HRM a ${existingSaisiehrm.saisiehim.length} saisie(s) HIM associée(s). Supprimez-les d'abord.`,
        },
        { status: 400 }
      );
    }

    await prisma.saisiehrm.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Saisie HRM supprimée avec succès",
    });
  } catch (error) {
    console.error("Error deleting saisiehrm:", error);
    return NextResponse.json(
      { message: "Erreur lors de la suppression de la saisie HRM" },
      { status: 500 }
    );
  }
}
