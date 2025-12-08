// app/api/hims/route.ts - Version corrigée
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const saisiehrmId = searchParams.get("saisiehrmId");

    const where: any = {};
    if (saisiehrmId) where.saisiehrmId = saisiehrmId;

    const hims = await prisma.saisiehim.findMany({
      where,
      include: {
        panne: {
          include: {
            typepanne: true,
          },
        },
        saisiehrm: {
          include: {
            engin: true,
          },
        },
        saisielubrifiant: {
          // ← SINGULIER comme dans votre schéma
          include: {
            lubrifiant: {
              include: {
                typelubrifiant: true,
              },
            },
            typeconsommationlub: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(hims);
  } catch (error) {
    console.error("Erreur lors de la récupération des HIM:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des HIM" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { panneId, him, ni, obs, saisiehrmId, enginId } = body;

    // Vérifier si la saisie HRM existe
    const saisiehrm = await prisma.saisiehrm.findUnique({
      where: { id: saisiehrmId },
    });

    if (!saisiehrm) {
      return NextResponse.json(
        { message: "Saisie HRM non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier si une saisie HIM existe déjà pour cette panne et cette saisie HRM
    const existingHim = await prisma.saisiehim.findFirst({
      where: {
        panneId,
        saisiehrmId,
      },
    });

    if (existingHim) {
      return NextResponse.json(
        {
          message: "Une saisie HIM existe déjà pour cette panne et cette date",
        },
        { status: 400 }
      );
    }

    // Créer la saisie HIM
    const newHim = await prisma.saisiehim.create({
      data: {
        panneId,
        him: parseFloat(him),
        ni: parseInt(ni),
        obs: obs || null,
        saisiehrmId,
        enginId: enginId || null,
      },
      include: {
        panne: {
          include: {
            typepanne: true,
          },
        },
        saisiehrm: {
          include: {
            engin: true,
          },
        },
        saisielubrifiant: {
          // ← SINGULIER comme dans votre schéma
          include: {
            lubrifiant: {
              include: {
                typelubrifiant: true,
              },
            },
            typeconsommationlub: true,
          },
        },
      },
    });

    return NextResponse.json(newHim);
  } catch (error) {
    console.error("Erreur lors de la création de la saisie HIM:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la saisie HIM" },
      { status: 500 }
    );
  }
}
