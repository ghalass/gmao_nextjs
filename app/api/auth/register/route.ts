// POST /api/auth/register/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { userCreateSchema } from "@/lib/validations/userSchema";
import { hashPassword } from "@/lib/auth";

// POST - Créer un utilisateur
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // vérifier si le 1er utilisateur qui s'inscrit doit être admin
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      // un role admin doit exister dans la table des rôles
      // si ce n'est pas le cas, il faut le créer manuellement avant de créer le 1er utilisateur
      const adminRole = await prisma.role.findUnique({
        where: { name: "admin" },
      });

      if (!adminRole) {
        const admin = await prisma.role.create({
          data: {
            name: "admin",
          },
        });
        body.role = [admin.id];
      } else {
        // sinon, attribuer le rôle "user" par défaut
        const userRole = await prisma.role.findUnique({
          where: { name: "user" },
        });

        // si le rôle "user" n'existe pas, le créer
        if (!userRole) {
          const role = await prisma.role.create({
            data: {
              name: "user",
            },
          });
          body.role = [role.id];
        } else {
          body.role = [userRole.id];
        }
      }
    } else {
      // sinon, attribuer le rôle "user" par défaut
      const userRole = await prisma.role.findUnique({
        where: { name: "user" },
      });

      // si le rôle "user" n'existe pas, le créer
      if (!userRole) {
        const role = await prisma.role.create({
          data: {
            name: "user",
          },
        });
        body.role = [role.id];
      } else {
        body.role = [userRole.id];
      }
    }

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
    const { email, name, password } = body;

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Cet email est déjà utilisé" },
        { status: 400 }
      );
    }

    // Hasher le mot de passe
    const hashedPassword = await hashPassword(password);

    const { role } = body;
    // Créer l'utilisateur avec les rôles
    await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        active: false,
        // Assigner le rôle (utiliser l'ID directement)
        roles: {
          connect: [{ id: role[0] }],
        },
      },
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
      },
    });

    return NextResponse.json({ status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/users:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'utilisateur" },
      { status: 500 }
    );
  }
}
