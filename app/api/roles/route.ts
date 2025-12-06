// app/api/roles/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { roleCreateSchema } from "@/lib/validations/roleSchema";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";

const resource = "role";

// GET - Récupérer tous les rôles
export async function GET(request: NextRequest) {
  try {
    const protectionError = await protectReadRoute(request, resource);
    if (protectionError) return protectionError;

    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(roles);
  } catch (error) {
    console.error("Erreur GET /api/roles:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des rôles" },
      { status: 500 }
    );
  }
}

// POST - Créer un rôle
export async function POST(request: NextRequest) {
  try {
    const protectionError = await protectCreateRoute(request, resource);
    if (protectionError) return protectionError;

    const body = await request.json();

    // Validation avec Yup
    try {
      await roleCreateSchema.validate(body, { abortEarly: false });
    } catch (validationError: any) {
      return NextResponse.json(
        {
          error: "Erreur de validation",
          details: validationError.errors,
        },
        { status: 400 }
      );
    }

    const { name, description, permissions } = body;

    // Vérifier si le nom existe déjà
    const existingRole = await prisma.role.findUnique({
      where: { name },
    });

    if (existingRole) {
      return NextResponse.json(
        { error: "Ce nom de rôle est déjà utilisé" },
        { status: 409 }
      );
    }

    // Créer le rôle avec les permissions
    const role = await prisma.role.create({
      data: {
        name,
        description: description || null,
        permissions: {
          create: permissions.map((permissionId: string) => ({
            permissionId,
          })),
        },
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return NextResponse.json(role, { status: 201 });
  } catch (error: any) {
    console.error("Erreur POST /api/roles:", error);
    return NextResponse.json(
      {
        error: error.message || "Erreur lors de la création du rôle",
      },
      { status: 500 }
    );
  }
}
