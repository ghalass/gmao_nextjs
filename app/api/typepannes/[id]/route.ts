// app/api/typepannes/[id]/route.ts - Version corrigée
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  protectDeleteRoute,
  protectReadRoute,
  protectUpdateRoute,
} from "@/lib/rbac/middleware";

const the_resource = "typepanne";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Vérifier la permission de lecture des types de panne
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    // Attendre les params
    const { id } = await context.params;

    const typepanne = await prisma.typepanne.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            pannes: true,
          },
        },
        // Inclure les pannes avec leurs parcs pour compter
        pannes: {
          include: {
            _count: {
              select: {
                panneParcs: true,
              },
            },
          },
        },
      },
    });

    if (!typepanne) {
      return NextResponse.json(
        { message: "Type de panne non trouvé" },
        { status: 404 }
      );
    }

    // Calculer le nombre total de parcs
    const totalParcs = typepanne.pannes.reduce(
      (sum, panne) => sum + panne._count.panneParcs,
      0
    );

    // Retourner les données avec le compte calculé
    const responseData = {
      ...typepanne,
      _count: {
        ...typepanne._count,
        panneParcs: totalParcs, // Ajouter le compte calculé
      },
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Erreur lors de la récupération du type de panne:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Vérifier la permission de modification
    const protectionError = await protectUpdateRoute(request, the_resource);
    if (protectionError) return protectionError;

    // Attendre les params en premier
    const { id } = await context.params;
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { message: "Le nom est obligatoire" },
        { status: 400 }
      );
    }

    // Vérifier si le type de panne existe
    const existingTypepanne = await prisma.typepanne.findUnique({
      where: { id },
    });

    if (!existingTypepanne) {
      return NextResponse.json(
        { message: "Type de panne non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier si un autre type de panne a déjà ce nom
    const duplicateTypepanne = await prisma.typepanne.findFirst({
      where: {
        name,
        id: { not: id },
      },
    });

    if (duplicateTypepanne) {
      return NextResponse.json(
        { message: "Un type de panne avec ce nom existe déjà" },
        { status: 409 }
      );
    }

    const typepanne = await prisma.typepanne.update({
      where: { id },
      data: {
        name,
        description: description || null,
      },
      include: {
        _count: {
          select: {
            pannes: true,
          },
        },
        pannes: {
          include: {
            _count: {
              select: {
                panneParcs: true,
              },
            },
          },
        },
      },
    });

    // Calculer le nombre total de parcs
    const totalParcs = typepanne.pannes.reduce(
      (sum, panne) => sum + panne._count.panneParcs,
      0
    );

    const responseData = {
      ...typepanne,
      _count: {
        ...typepanne._count,
        panneParcs: totalParcs,
      },
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Erreur lors de la modification du type de panne:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Vérifier la permission de suppression
    const protectionError = await protectDeleteRoute(request, the_resource);
    if (protectionError) return protectionError;

    // Attendre les params
    const { id } = await context.params;

    // Vérifier si le type de panne existe avec toutes les dépendances
    const existingTypepanne = await prisma.typepanne.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            pannes: true,
          },
        },
        pannes: {
          include: {
            _count: {
              select: {
                panneParcs: true,
                saisiehim: true, // Vérifier aussi les saisies HIM
              },
            },
          },
        },
      },
    });

    if (!existingTypepanne) {
      return NextResponse.json(
        { message: "Type de panne non trouvé" },
        { status: 404 }
      );
    }

    // Calculer le nombre total de parcs et saisies HIM
    const totalParcs = existingTypepanne.pannes.reduce(
      (sum, panne) => sum + panne._count.panneParcs,
      0
    );

    const totalSaisiehim = existingTypepanne.pannes.reduce(
      (sum, panne) => sum + panne._count.saisiehim,
      0
    );

    // Vérifier s'il y a des dépendances
    if (
      existingTypepanne._count.pannes > 0 ||
      totalParcs > 0 ||
      totalSaisiehim > 0
    ) {
      return NextResponse.json(
        {
          error: "Impossible de supprimer ce type de panne car il est utilisé",
          details: {
            pannes: existingTypepanne._count.pannes,
            parcs: totalParcs,
            saisiesHIM: totalSaisiehim,
          },
        },
        { status: 409 }
      );
    }

    await prisma.typepanne.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la suppression du type de panne:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
