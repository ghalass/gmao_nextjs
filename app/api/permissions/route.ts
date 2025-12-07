import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";

const the_resource = "permissions";

export async function GET(request: NextRequest) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const permissions = await prisma.permission.findMany({
      // Pas de include car il n'y a pas de relation resource
    });

    return NextResponse.json(permissions);
  } catch (error) {
    console.error("❌ Error fetching permissions:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération des permissions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const protectionError = await protectCreateRoute(request, the_resource);
    if (protectionError) return protectionError;

    const body = await request.json();
    const { resource, action } = body; // ← Changez resourceId en resource

    // Validation des données
    if (!resource || !action) {
      // ← resource, pas resourceId
      return NextResponse.json(
        { message: "Le nom, la ressource et l'action sont requis" },
        { status: 400 }
      );
    }

    const permission = await prisma.permission.create({
      data: {
        resource, // ← C'est un string, pas un ID
        action,
      },
    });

    console.log("✅ Permission created successfully:", permission.id);
    return NextResponse.json(permission, { status: 201 });
  } catch (error) {
    console.error("❌ Error creating permission:", error);

    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        if (error.message.includes("name")) {
          return NextResponse.json(
            { message: "Une permission avec ce nom existe déjà" },
            { status: 400 }
          );
        }
        if (error.message.includes("resource_action")) {
          return NextResponse.json(
            {
              message:
                "Une permission avec cette combinaison ressource/action existe déjà",
            },
            { status: 400 }
          );
        }
      }
    }

    return NextResponse.json(
      { message: "Erreur lors de la création de la permission" },
      { status: 500 }
    );
  }
}
