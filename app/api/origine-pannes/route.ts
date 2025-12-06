// app/api/origine-pannes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const originePannes = await prisma.originePanne.findMany({
      include: {
        _count: {
          select: {
            pannes: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(originePannes);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des origines de panne:",
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
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Le nom est obligatoire" },
        { status: 400 }
      );
    }

    // Vérifier si l'origine de panne existe déjà
    const existingOriginePanne = await prisma.originePanne.findUnique({
      where: { name },
    });

    if (existingOriginePanne) {
      return NextResponse.json(
        { error: "Une origine de panne avec ce nom existe déjà" },
        { status: 409 }
      );
    }

    const originePanne = await prisma.originePanne.create({
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
      },
    });

    return NextResponse.json(originePanne, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création de l'origine de panne:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
