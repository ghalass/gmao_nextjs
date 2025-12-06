// app/api/resources/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";

const the_resource = "resources";

interface TableInfo {
  table_name: string;
}

// GET - Récupérer toutes les ressources
export async function GET(request: NextRequest) {
  try {
    // Vérifier la permission de lecture des ressources
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const resources = await prisma.resource.findMany({
      orderBy: {
        label: "asc",
      },
      include: {
        permissions: {
          select: {
            id: true,
            name: true,
            action: true,
          },
        },
      },
    });

    return NextResponse.json(resources);
  } catch (error) {
    console.error("Error fetching resources:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération des ressources" },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle ressource
export async function POST(request: NextRequest) {
  try {
    // Vérifier la permission de création des ressources
    const protectionError = await protectCreateRoute(request, the_resource);
    if (protectionError) return protectionError;

    const body = await request.json();
    const { name, label } = body;

    // Validation
    if (!name || !label) {
      return NextResponse.json(
        { message: "Le nom et le label sont requis" },
        { status: 400 }
      );
    }

    if (typeof name !== "string" || typeof label !== "string") {
      return NextResponse.json(
        {
          message: "Le nom et le label doivent être des chaînes de caractères",
        },
        { status: 400 }
      );
    }

    // Vérifier si la ressource existe déjà
    const existingResource = await prisma.resource.findUnique({
      where: { name },
    });

    if (existingResource) {
      return NextResponse.json(
        { message: "Une ressource avec ce nom existe déjà" },
        { status: 409 }
      );
    }

    const resource = await prisma.resource.create({
      data: {
        name: name.trim(),
        label: label.trim(),
      },
      include: {
        permissions: {
          select: {
            id: true,
            name: true,
            action: true,
          },
        },
      },
    });

    return NextResponse.json(resource, { status: 201 });
  } catch (error) {
    console.error("Error creating resource:", error);
    return NextResponse.json(
      { message: "Erreur lors de la création de la ressource" },
      { status: 500 }
    );
  }
}
