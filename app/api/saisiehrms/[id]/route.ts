// app/api/saisiehrms/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session.userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { du, enginId, siteId, hrm, origineSaisieId } = body;

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
        { error: "Une autre saisie existe déjà pour cette date et cet engin" },
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session.userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = params;

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
