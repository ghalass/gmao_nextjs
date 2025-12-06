// app/api/typeparcs/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { typeparcSchema } from "@/lib/validations/typeparcSchema";

interface Context {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;

    const typeparc = await prisma.typeparc.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            parcs: true,
          },
        },
      },
    });

    if (!typeparc) {
      return NextResponse.json(
        { error: "Type de parc non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(typeparc);
  } catch (error) {
    console.error("Error fetching typeparc:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du type de parc" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    // Validation avec Yup
    const validatedData = await typeparcSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true,
    });

    // Vérifier si le type de parc existe
    const existingTypeparc = await prisma.typeparc.findUnique({
      where: { id },
    });

    if (!existingTypeparc) {
      return NextResponse.json(
        { error: "Type de parc non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier si un autre type de parc a déjà ce nom
    const duplicateTypeparc = await prisma.typeparc.findFirst({
      where: {
        name: validatedData.name,
        id: { not: id },
      },
    });

    if (duplicateTypeparc) {
      return NextResponse.json(
        { error: "Un autre type de parc avec ce nom existe déjà" },
        { status: 409 }
      );
    }

    const updatedTypeparc = await prisma.typeparc.update({
      where: { id },
      data: validatedData,
      include: {
        _count: {
          select: {
            parcs: true,
          },
        },
      },
    });

    return NextResponse.json(updatedTypeparc);
  } catch (error: any) {
    console.error("Error updating typeparc:", error);

    // Gestion des erreurs de validation Yup
    if (error.name === "ValidationError") {
      return NextResponse.json(
        {
          error: "Données invalides",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de la modification du type de parc" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    // Validation avec Yup (validation partielle pour PATCH)
    const validatedData = await typeparcSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true,
    });

    // Vérifier si le type de parc existe
    const existingTypeparc = await prisma.typeparc.findUnique({
      where: { id },
    });

    if (!existingTypeparc) {
      return NextResponse.json(
        { error: "Type de parc non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier si un autre type de parc a déjà ce nom
    if (validatedData.name) {
      const duplicateTypeparc = await prisma.typeparc.findFirst({
        where: {
          name: validatedData.name,
          id: { not: id },
        },
      });

      if (duplicateTypeparc) {
        return NextResponse.json(
          { error: "Un autre type de parc avec ce nom existe déjà" },
          { status: 409 }
        );
      }
    }

    const updatedTypeparc = await prisma.typeparc.update({
      where: { id },
      data: validatedData,
      include: {
        _count: {
          select: {
            parcs: true,
          },
        },
      },
    });

    return NextResponse.json(updatedTypeparc);
  } catch (error: any) {
    console.error("Error updating typeparc:", error);

    // Gestion des erreurs de validation Yup
    if (error.name === "ValidationError") {
      return NextResponse.json(
        {
          error: "Données invalides",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de la modification du type de parc" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;

    // Vérifier si le type de parc existe
    const existingTypeparc = await prisma.typeparc.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            parcs: true,
          },
        },
      },
    });

    if (!existingTypeparc) {
      return NextResponse.json(
        { error: "Type de parc non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier s'il y a des parcs associés
    if (existingTypeparc._count.parcs > 0) {
      return NextResponse.json(
        {
          error: "Impossible de supprimer un type de parc associé à des parcs",
        },
        { status: 409 }
      );
    }

    await prisma.typeparc.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Type de parc supprimé avec succès" });
  } catch (error) {
    console.error("Error deleting typeparc:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du type de parc" },
      { status: 500 }
    );
  }
}
