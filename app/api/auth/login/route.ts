// app/api/auth/login/route.ts

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
        { error: "Le corps de la requête ne doit pas être vide" },
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
        { error: "Erreur de validation", details: err.errors },
        { status: 400 }
      );
    }

    const { email, password } = parsedBody;

    // ⚡ Inclusion sécurisée des rôles et permissions
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect!" },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect!" },
        { status: 401 }
      );
    }

    // SESSION
    const session = await getSession();
    session.userId = user.id;
    session.email = user.email;
    session.roles = user.roles.map((r) => r.role.name);
    session.isLoggedIn = true;
    await session.save();

    // Supprimer le mot de passe avant de renvoyer l'utilisateur
    const { password: _, ...sanitizedUser } = user;

    return NextResponse.json({ user: sanitizedUser }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
