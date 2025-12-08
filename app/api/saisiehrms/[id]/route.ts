// app/api/saisiehrms/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { protectDeleteRoute, protectUpdateRoute } from "@/lib/rbac/middleware";

const the_resource = "site";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Vérifier la permission de lecture des sites (pas "users")
    const protectionError = await protectUpdateRoute(request, the_resource);
    if (protectionError) return protectionError;

    const session = await getSession();
    if (!session.userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { du, enginId, siteId, hrm } = body;

    // Vérifier si une autre saisie existe déjà pour cette date et cet engin
    const existingSaisie = await prisma.saisiehrm.findFirst({
      where: {
        du: new Date(du),
        enginId,
        NOT: {
          id,
        },
      },
    });

    if (existingSaisie) {
      return NextResponse.json(
        {
          message: "Une autre saisie existe déjà pour cette date et cet engin",
        },
        { status: 400 }
      );
    }

    const saisiehrm = await prisma.saisiehrm.update({
      where: { id },
      data: {
        du: new Date(du),
        enginId,
        siteId,
        hrm: parseFloat(hrm),
      },
      include: {
        engin: {
          include: {
            parc: {
              include: {
                typeparc: true,
              },
            },
          },
        },
        site: true,
      },
    });

    return NextResponse.json(saisiehrm);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la saisie HRM:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la saisie" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Vérifier la permission de lecture des sites (pas "users")
    const protectionError = await protectDeleteRoute(request, the_resource);
    if (protectionError) return protectionError;

    const session = await getSession();
    if (!session.userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await context.params;

    // Vérifier s'il existe des saisies HIM liées
    const relatedHim = await prisma.saisiehim.findFirst({
      where: { saisiehrmId: id },
    });

    if (relatedHim) {
      return NextResponse.json(
        {
          error:
            "Impossible de supprimer cette saisie car des saisies HIM y sont liées",
        },
        { status: 400 }
      );
    }

    await prisma.saisiehrm.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la suppression de la saisie HRM:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la saisie" },
      { status: 500 }
    );
  }
}
