// app/api/pannes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const typepanneId = searchParams.get("typepanneId");
    const enginId = searchParams.get("enginId");

    const where: any = {};

    if (search) {
      where.OR = [{ name: { contains: search, mode: "insensitive" } }];
    }

    if (typepanneId) where.typepanneId = typepanneId;

    // Note: Dans votre schéma, Panne n'a pas de relation directe avec Engin
    // via un champ enginId. La relation est indirecte via Saisiehim.
    // Nous ne pouvons donc pas filtrer directement par enginId.
    // Si vous avez besoin de cette fonctionnalité, vous devrez ajuster la logique.

    const pannes = await prisma.panne.findMany({
      where,
      include: {
        typepanne: true,
        saisiehim: {
          include: {
            engin: {
              include: {
                site: true,
                parc: true,
              },
            },
            saisiehrm: {
              select: {
                du: true,
                hrm: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transformez les données pour les adapter à l'interface attendue
    const transformedPannes = pannes.map((panne) => ({
      ...panne,
      // Créez une propriété engin dérivée (prend le premier engin des saisiehim)
      engin: panne.saisiehim.length > 0 ? panne.saisiehim[0].engin : null,
      // Compter les saisiehim comme "interventions"
      interventionsCount: panne.saisiehim.length,
      // Calculer la dernière date de saisie
      derniereSaisie:
        panne.saisiehim.length > 0
          ? panne.saisiehim.reduce((latest, saisie) =>
              new Date(saisie.createdAt) > new Date(latest.createdAt)
                ? saisie
                : latest
            ).createdAt
          : null,
    }));

    return NextResponse.json(transformedPannes);
  } catch (error) {
    console.error("Erreur lors du chargement des pannes:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des pannes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation basique
    if (!body.name || !body.typepanneId) {
      return NextResponse.json(
        { error: "Le nom et le type de panne sont requis" },
        { status: 400 }
      );
    }

    // Vérifier si une panne avec ce nom existe déjà
    const existingPanne = await prisma.panne.findUnique({
      where: { name: body.name },
    });

    if (existingPanne) {
      return NextResponse.json(
        { error: "Une panne avec ce nom existe déjà" },
        { status: 409 }
      );
    }

    const panne = await prisma.panne.create({
      data: {
        name: body.name,
        typepanneId: body.typepanneId,
        // Ajoutez d'autres champs si nécessaire
      },
      include: {
        typepanne: true,
        saisiehim: {
          include: {
            engin: true,
          },
        },
      },
    });

    return NextResponse.json(panne, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création de la panne:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la panne" },
      { status: 500 }
    );
  }
}
