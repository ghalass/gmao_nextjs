// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { userUpdateSchema } from "@/lib/validations/userSchema";
import { protectDeleteRoute, protectUpdateRoute } from "@/lib/rbac/middleware";

const resource = "user";

// PATCH - Mettre à jour un utilisateur
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const protectionError = await protectUpdateRoute(request, resource);
    if (protectionError) return protectionError;

    const { id } = await params;
    const body = await request.json();

    // Validation avec Yup
    try {
      await userUpdateSchema.validate(body, { abortEarly: false });
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

    // Vérifier si l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: "Cet email est déjà utilisé" },
          { status: 400 }
        );
      }
    }

    // Préparer les données de mise à jour
    const updateData: any = {
      email,
      name,
    };

    // Hasher le nouveau mot de passe si fourni
    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Supprimer les anciens rôles et ajouter les nouveaux
    await prisma.userRole.deleteMany({
      where: { userId: id },
    });

    // Mettre à jour l'utilisateur
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...updateData,
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

    return NextResponse.json(user);
  } catch (error) {
    console.error("Erreur PATCH /api/users/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'utilisateur" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un utilisateur
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const protectionError = await protectDeleteRoute(request, resource);
    if (protectionError) return protectionError;

    const { id } = await params;

    // Vérifier si l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    // Supprimer l'utilisateur (les rôles seront supprimés en cascade)
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Utilisateur supprimé avec succès" });
  } catch (error) {
    console.error("Erreur DELETE /api/users/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'utilisateur" },
      { status: 500 }
    );
  }
}
