// app/api/pannes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectReadRoute, protectUpdateRoute } from "@/lib/rbac/middleware";

const the_resource = "panne";

export async function GET(request: NextRequest) {
  try {
    // Vérifier la permission de lecture des sites (pas "users")
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const pannes = await prisma.panne.findMany({
      include: {
        typepanne: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(pannes);
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
    // Vérifier la permission de lecture des sites (pas "users")
    const protectionError = await protectUpdateRoute(request, the_resource);
    if (protectionError) return protectionError;

    const body = await request.json();

    // Validation basique
    if (!body.name || !body.typepanneId) {
      return NextResponse.json(
        { message: "Le nom et le type de panne sont requis" },
        { status: 400 }
      );
    }

    // Vérifier si une panne avec ce nom existe déjà
    const existingPanne = await prisma.panne.findUnique({
      where: { name: body.name },
    });

    if (existingPanne) {
      return NextResponse.json(
        { message: "Une panne avec ce nom existe déjà" },
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
