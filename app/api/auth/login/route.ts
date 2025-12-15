// app/api/auth/login/route.ts - Version corrigée avec relations implicites

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, verifyPassword } from "@/lib/auth";
import yup from "@/lib/yupFr";

// Validation schema
const loginSchema = yup.object({
  email: yup.string().email().required().label("Email"),
  password: yup.string().min(6).required().label("Mot de passe"),
});

interface LoginBody {
  email: string;
  password: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();

    if (!body) {
      return NextResponse.json(
        { message: "Le corps de la requête ne doit pas être vide" },
        { status: 400 }
      );
    }

    let parsedBody: LoginBody;
    try {
      parsedBody = JSON.parse(body);
    } catch {
      return NextResponse.json({ error: "JSON mal formé" }, { status: 400 });
    }

    try {
      await loginSchema.validate(parsedBody, { abortEarly: false });
    } catch (err: any) {
      return NextResponse.json(
        { message: "Erreur de validation", details: err.errors },
        { status: 400 }
      );
    }

    const { email, password } = parsedBody;

    // Rechercher l'utilisateur avec ses rôles et permissions
    // Dans votre schéma, User a une relation directe avec Role
    // Role a une relation implicite many-to-many avec Permission
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      include: {
        // Relation directe User -> Role[]
        roles: {
          include: {
            // Relation implicite Role -> Permission[]
            permissions: true, // Pas besoin de `include: { permission: true }` car c'est direct
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Email ou mot de passe incorrect!" },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { message: "Email ou mot de passe incorrect!" },
        { status: 401 }
      );
    }

    if (!user.active) {
      return NextResponse.json(
        {
          message:
            "Votre compte n'est pas encore activé, veuillez contacter un admin pour l'activation.",
        },
        { status: 401 }
      );
    }

    // Préparer les données de session
    const userRoles = user.roles.map((role) => role.name);

    // Extraire toutes les permissions des rôles de l'utilisateur
    // Avec la relation implicite, permissions est un tableau direct
    const userPermissions = user.roles.flatMap((role) =>
      role.permissions.map((permission) => ({
        id: permission.id,
        resource: permission.resource,
        action: permission.action,
        roleId: role.id,
        roleName: role.name,
      }))
    );

    // SESSION
    const session = await getSession();
    session.userId = user.id;
    session.email = user.email;
    session.name = user.name; // Ajout du nom dans la session
    session.roles = userRoles;
    session.permissions = userPermissions; // Stocker les permissions dans la session
    session.isLoggedIn = true;
    await session.save();

    // Supprimer le mot de passe avant de renvoyer l'utilisateur
    const { password: _, ...sanitizedUser } = user;

    // Formater la réponse avec les données structurées
    const userResponse = {
      ...sanitizedUser,
      // Ajouter les permissions dans la réponse pour le frontend
      permissions: userPermissions,
      // Liste des noms de rôles pour faciliter les vérifications
      roleNames: userRoles,
    };

    return NextResponse.json({ user: userResponse }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
