// app/api/engins/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enginSchema } from "@/lib/validations/enginSchema";

export async function GET() {
  try {
    const engins = await prisma.engin.findMany({
      include: {
        parc: {
          include: {
            typeparc: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        site: {
          select: {
            id: true,
            name: true,
            active: true,
          },
        },
        _count: {
          select: {
            // CORRECTION: Utilisez les noms exacts des champs dans votre modèle
            saisiehrm: true, // minuscule (comme dans le schéma)
            saisiehim: true, // minuscule (comme dans le schéma)
            anomalies: true, // minuscule (comme dans le schéma)
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(engins);
  } catch (error) {
    console.error("Error fetching engins:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des engins" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validatedData = await enginSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true,
    });

    // Vérifier si l'engin existe déjà
    const existingEngin = await prisma.engin.findUnique({
      where: { name: validatedData.name },
    });

    if (existingEngin) {
      return NextResponse.json(
        { error: "Un engin avec ce nom existe déjà" },
        { status: 409 }
      );
    }

    // Vérifier si le parc existe
    const parcExists = await prisma.parc.findUnique({
      where: { id: validatedData.parcId },
    });

    if (!parcExists) {
      return NextResponse.json(
        { error: "Le parc spécifié n'existe pas" },
        { status: 404 }
      );
    }

    // Vérifier si le site existe
    const siteExists = await prisma.site.findUnique({
      where: { id: validatedData.siteId },
    });

    if (!siteExists) {
      return NextResponse.json(
        { error: "Le site spécifié n'existe pas" },
        { status: 404 }
      );
    }

    const engin = await prisma.engin.create({
      data: validatedData,
      include: {
        parc: {
          include: {
            typeparc: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        site: {
          select: {
            id: true,
            name: true,
            active: true,
          },
        },
        _count: {
          select: {
            // CORRECTION: Utilisez les bonnes relations
            saisiehrm: true,
            saisiehim: true,
            anomalies: true,
            // Supprimez "pannes: true" car cette relation n'existe pas directement
          },
        },
      },
    });

    return NextResponse.json(engin, { status: 201 });
  } catch (error: any) {
    console.error("Error creating engin:", error);

    if (error.name === "ValidationError") {
      return NextResponse.json(
        {
          error: "Données invalides",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de la création de l'engin" },
      { status: 500 }
    );
  }
}
