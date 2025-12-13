// app/api/typepannes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";

const the_resource = "typepanne";

export async function GET(request: NextRequest) {
  try {
    // Vérifier la permission de lecture des types de panne
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const typepannes = await prisma.typepanne.findMany({
      include: {
        _count: {
          select: {
            pannes: true,
          },
        },
        // Inclure les pannes avec leurs parcs pour calculer le total
        pannes: {
          include: {
            _count: {
              select: {
                parcs: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Calculer le nombre de parcs pour chaque type de panne
    const typepannesWithCounts = typepannes.map((typepanne) => {
      const totalParcs = typepanne.pannes.reduce(
        (sum, panne) => sum + panne._count.parcs,
        0
      );

      return {
        ...typepanne,
        _count: {
          ...typepanne._count,
          parcs: totalParcs, // Ajouter le compte calculé
        },
      };
    });

    return NextResponse.json(typepannesWithCounts);
  } catch (error) {
    console.error("Erreur lors de la récupération des types de panne:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier la permission de création des types de panne
    const protectionError = await protectCreateRoute(request, the_resource);
    if (protectionError) return protectionError;

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { message: "Le nom est obligatoire" },
        { status: 400 }
      );
    }

    // Vérifier si le type de panne existe déjà
    const existingTypepanne = await prisma.typepanne.findUnique({
      where: { name },
    });

    if (existingTypepanne) {
      return NextResponse.json(
        { message: "Un type de panne avec ce nom existe déjà" },
        { status: 409 }
      );
    }

    const typepanne = await prisma.typepanne.create({
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
        // Inclure la structure vide des pannes pour la cohérence
        pannes: {
          include: {
            _count: {
              select: {
                parcs: true,
              },
            },
          },
        },
      },
    });

    // Ajouter le count des parcs (toujours 0 pour un nouvel enregistrement)
    const typepanneWithFullCount = {
      ...typepanne,
      _count: {
        ...typepanne._count,
        parcs: 0, // Pas de parcs pour un nouveau type de panne
      },
    };

    return NextResponse.json(typepanneWithFullCount, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création du type de panne:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
