// app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { userCreateSchema } from "@/lib/validations/userSchema";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";

const resource = "user";

// GET - Récupérer tous les utilisateurs
export async function GET(request: NextRequest) {
  try {
    const protectionError = await protectReadRoute(request, resource);
    if (protectionError) return protectionError;

    const users = await prisma.user.findMany({
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Exclure le password de chaque utilisateur
    const usersWithoutPassword = users.map((user) => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return NextResponse.json(usersWithoutPassword);
  } catch (error) {
    console.error("Erreur GET /api/users:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des utilisateurs" },
      { status: 500 }
    );
  }
}
// POST - Créer un utilisateur
export async function POST(request: NextRequest) {
  try {
    const protectionError = await protectCreateRoute(request, resource);
    if (protectionError) return protectionError;

    const body = await request.json();

    // Validation avec Yup
    try {
      await userCreateSchema.validate(body, { abortEarly: false });
    } catch (validationError: any) {
      return NextResponse.json(
        {
          error: "Erreur de validation",
          details: validationError.errors,
        },
        { status: 400 }
      );
    }

    const { email, name, password, role } = body;

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 400 }
      );
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur avec les rôles
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        roles: {
          create: role.map((roleId: string) => ({
            roleId,
          })),
        },
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/users:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'utilisateur" },
      { status: 500 }
    );
  }
}
