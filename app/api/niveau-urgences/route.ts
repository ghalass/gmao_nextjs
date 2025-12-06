// app/api/niveau-urgences/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const niveauUrgences = await prisma.niveauUrgence.findMany({
      include: {
        _count: {
          select: {
            pannes: true,
          },
        },
      },
      orderBy: {
        level: "desc",
      },
    });

    return NextResponse.json(niveauUrgences);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des niveaux d'urgence:",
      error
    );
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, level, color } = body;

    if (!name || level === undefined) {
      return NextResponse.json(
        { error: "Le nom et le niveau sont obligatoires" },
        { status: 400 }
      );
    }

    // Vérifier si le niveau d'urgence existe déjà par nom
    const existingNiveauUrgenceByName = await prisma.niveauUrgence.findUnique({
      where: { name },
    });

    if (existingNiveauUrgenceByName) {
      return NextResponse.json(
        { error: "Un niveau d'urgence avec ce nom existe déjà" },
        { status: 409 }
      );
    }

    // Vérifier si le niveau d'urgence existe déjà par niveau
    const existingNiveauUrgenceByLevel = await prisma.niveauUrgence.findFirst({
      where: { level },
    });

    if (existingNiveauUrgenceByLevel) {
      return NextResponse.json(
        { error: "Un niveau d'urgence avec ce niveau existe déjà" },
        { status: 409 }
      );
    }

    const niveauUrgence = await prisma.niveauUrgence.create({
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

    return NextResponse.json(niveauUrgence, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création du niveau d'urgence:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
