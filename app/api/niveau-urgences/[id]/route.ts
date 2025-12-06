// app/api/niveau-urgences/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    const niveauUrgence = await prisma.niveauUrgence.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            pannes: true,
          },
        },
      },
    });

    if (!niveauUrgence) {
      return NextResponse.json(
        { error: "Niveau d'urgence non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(niveauUrgence);
  } catch (error) {
    console.error("Erreur lors de la récupération du niveau d'urgence:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, level, color } = body;

    if (!name || level === undefined) {
      return NextResponse.json(
        { error: "Le nom et le niveau sont obligatoires" },
        { status: 400 }
      );
    }

    // Vérifier si le niveau d'urgence existe
    const existingNiveauUrgence = await prisma.niveauUrgence.findUnique({
      where: { id },
    });

    if (!existingNiveauUrgence) {
      return NextResponse.json(
        { error: "Niveau d'urgence non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier si un autre niveau d'urgence a déjà ce nom
    const duplicateNiveauUrgenceByName = await prisma.niveauUrgence.findFirst({
      where: {
        name,
        id: { not: id },
      },
    });

    if (duplicateNiveauUrgenceByName) {
      return NextResponse.json(
        { error: "Un niveau d'urgence avec ce nom existe déjà" },
        { status: 409 }
      );
    }

    // Vérifier si un autre niveau d'urgence a déjà ce niveau
    const duplicateNiveauUrgenceByLevel = await prisma.niveauUrgence.findFirst({
      where: {
        level,
        id: { not: id },
      },
    });

    if (duplicateNiveauUrgenceByLevel) {
      return NextResponse.json(
        { error: "Un niveau d'urgence avec ce niveau existe déjà" },
        { status: 409 }
      );
    }

    const niveauUrgence = await prisma.niveauUrgence.update({
      where: { id },
      data: {
        name,
        description: description || null,
        level,
        color: color || null,
      },
      include: {
        _count: {
          select: {
            pannes: true,
          },
        },
      },
    });

    return NextResponse.json(niveauUrgence);
  } catch (error) {
    console.error("Erreur lors de la modification du niveau d'urgence:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    // Vérifier si le niveau d'urgence existe
    const existingNiveauUrgence = await prisma.niveauUrgence.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            pannes: true,
          },
        },
      },
    });

    if (!existingNiveauUrgence) {
      return NextResponse.json(
        { error: "Niveau d'urgence non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier s'il y a des dépendances
    if (existingNiveauUrgence._count.pannes > 0) {
      return NextResponse.json(
        {
          error:
            "Impossible de supprimer ce niveau d'urgence car il est utilisé par des pannes",
          details: {
            pannes: existingNiveauUrgence._count.pannes,
          },
        },
        { status: 409 }
      );
    }

    await prisma.niveauUrgence.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la suppression du niveau d'urgence:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
