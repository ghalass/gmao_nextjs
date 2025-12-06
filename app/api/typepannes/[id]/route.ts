// app/api/typepannes/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    // Attendre les params
    const { id } = await params;

    const typepanne = await prisma.typepanne.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            pannes: true,
            typepanneParc: true,
          },
        },
      },
    });

    if (!typepanne) {
      return NextResponse.json(
        { error: "Type de panne non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(typepanne);
  } catch (error) {
    console.error("Erreur lors de la récupération du type de panne:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    // Attendre les params en premier
    const { id } = await params;
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Le nom est obligatoire" },
        { status: 400 }
      );
    }

    // Vérifier si le type de panne existe
    const existingTypepanne = await prisma.typepanne.findUnique({
      where: { id },
    });

    if (!existingTypepanne) {
      return NextResponse.json(
        { error: "Type de panne non trouvé" },
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
        { error: "Un type de panne avec ce nom existe déjà" },
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
            typepanneParc: true,
          },
        },
      },
    });

    return NextResponse.json(typepanne);
  } catch (error) {
    console.error("Erreur lors de la modification du type de panne:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    // Attendre les params
    const { id } = await params;

    // Vérifier si le type de panne existe
    const existingTypepanne = await prisma.typepanne.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            pannes: true,
            typepanneParc: true,
          },
        },
      },
    });

    if (!existingTypepanne) {
      return NextResponse.json(
        { error: "Type de panne non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier s'il y a des dépendances
    if (
      existingTypepanne._count.pannes > 0 ||
      existingTypepanne._count.typepanneParc > 0
    ) {
      return NextResponse.json(
        {
          error:
            "Impossible de supprimer ce type de panne car il est utilisé par des pannes ou des parcs",
          details: {
            pannes: existingTypepanne._count.pannes,
            parcs: existingTypepanne._count.typepanneParc,
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
