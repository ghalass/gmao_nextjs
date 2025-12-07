// app/api/typepannes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";

const resource = "typepanne";

export async function GET(request: NextRequest) {
  try {
    // Vérifier la permission de lecture des sites (pas "users")
    const protectionError = await protectReadRoute(request, resource);
    if (protectionError) return protectionError;

    const typepannes = await prisma.typepanne.findMany({
      include: {
        _count: {
          select: {
            pannes: true,
            typepanneParc: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(typepannes);
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
    // Vérifier la permission de lecture des sites (pas "users")
    const protectionError = await protectCreateRoute(request, resource);
    if (protectionError) return protectionError;

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Le nom est obligatoire" },
        { status: 400 }
      );
    }

    // Vérifier si le type de panne existe déjà
    const existingTypepanne = await prisma.typepanne.findUnique({
      where: { name },
    });

    if (existingTypepanne) {
      return NextResponse.json(
        { error: "Un type de panne avec ce nom existe déjà" },
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
            typepanneParc: true,
          },
        },
      },
    });

    return NextResponse.json(typepanne, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création du type de panne:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
