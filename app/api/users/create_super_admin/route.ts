// app/api/users/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

// POST - Créer un utilisateur
export async function GET() {
  try {
    const superAdminToCreate = {
      name: "ghalass",
      email: "ghalass@ghalass.com",
      password: "super@dmin",
      roles: ["super admin"],
      active: true,
    };

    // Étape 1: Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: superAdminToCreate.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Super admin est déjà créé" },
        { status: 200 }
      );
    }

    // Étape 2: Vérifier si le rôle "super admin" existe déjà, sinon le créer
    let superAdminRole = await prisma.role.findUnique({
      where: { name: "super admin" },
    });

    if (!superAdminRole) {
      superAdminRole = await prisma.role.create({
        data: {
          name: "super admin",
          description: "Super Admin du site, a le pouvoir global sur le site",
        },
      });
    }

    // Étape 3: Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(superAdminToCreate.password, 10);

    // Étape 4: Créer l'utilisateur avec la relation de rôle
    const newUser = await prisma.user.create({
      data: {
        email: superAdminToCreate.email.trim(),
        name: superAdminToCreate.name.trim(),
        password: hashedPassword,
        active: superAdminToCreate.active,
        roles: {
          connect: [{ id: superAdminRole.id }], // Correction ici: utiliser un tableau d'objets avec id
        },
      },
      include: {
        roles: true,
      },
    });

    return NextResponse.json(
      { message: "Super admin créé avec succès", user: newUser },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur dans GET /api/users:", error);

    // Gestion spécifique des erreurs Prisma
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { message: "Cet email est déjà utilisé" },
          { status: 400 }
        );
      }

      if (error.code === "P2025") {
        return NextResponse.json(
          { message: "Un ou plusieurs rôles spécifiés n'existent pas" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "Erreur lors de la création du super admin",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
