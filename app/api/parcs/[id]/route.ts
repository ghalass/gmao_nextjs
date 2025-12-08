// app/api/parcs/[id]/route.ts - Version corrigée
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parcSchema } from "@/lib/validations/parcSchema";
import {
  protectDeleteRoute,
  protectReadRoute,
  protectUpdateRoute,
} from "@/lib/rbac/middleware";

interface Context {
  params: Promise<{
    id: string;
  }>;
}

const the_resource = "parc";

export async function GET(request: NextRequest, context: Context) {
  try {
    // Vérifier la permission de lecture des sites (pas "users")
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { message: "ID du parc manquant" },
        { status: 400 }
      );
    }

    const parc = await prisma.parc.findUnique({
      where: { id },
      include: {
        typeparc: {
          select: {
            id: true,
            name: true,
          },
        },
        engins: {
          select: {
            id: true,
            name: true,
            active: true,
            site: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            name: "asc",
          },
        },
        objectif: {
          // ← SINGULIER
          orderBy: {
            annee: "desc",
          },
        },
        _count: {
          select: {
            engins: true,
            objectif: true, // ← SINGULIER
            typesConsommationLub: true,
            typepanneParc: true,
            lubrifiantParc: true,
          },
        },
      },
    });

    if (!parc) {
      return NextResponse.json({ error: "Parc non trouvé" }, { status: 404 });
    }

    return NextResponse.json(parc);
  } catch (error) {
    console.error("Error fetching parc:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du parc" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: Context) {
  try {
    // Vérifier la permission de lecture des sites (pas "users")
    const protectionError = await protectUpdateRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { message: "ID du parc manquant" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validation avec Yup
    const validatedData = await parcSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true,
    });

    // Vérifier si le parc existe
    const existingParc = await prisma.parc.findUnique({
      where: { id },
    });

    if (!existingParc) {
      return NextResponse.json({ error: "Parc non trouvé" }, { status: 404 });
    }

    // Vérifier si un autre parc a déjà ce nom
    const duplicateParc = await prisma.parc.findFirst({
      where: {
        name: validatedData.name,
        id: { not: id },
      },
    });

    if (duplicateParc) {
      return NextResponse.json(
        { message: "Un autre parc avec ce nom existe déjà" },
        { status: 409 }
      );
    }

    // Vérifier si le type de parc existe
    const typeparcExists = await prisma.typeparc.findUnique({
      where: { id: validatedData.typeparcId },
    });

    if (!typeparcExists) {
      return NextResponse.json(
        { message: "Le type de parc spécifié n'existe pas" },
        { status: 404 }
      );
    }

    const updatedParc = await prisma.parc.update({
      where: { id },
      data: validatedData,
      include: {
        typeparc: {
          // ← SINGULIER, pas Typeparc
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            engins: true,
          },
        },
      },
    });

    return NextResponse.json(updatedParc);
  } catch (error: any) {
    console.error("Error updating parc:", error);

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
      { error: "Erreur lors de la modification du parc" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    // Vérifier la permission de lecture des sites (pas "users")
    const protectionError = await protectUpdateRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { message: "ID du parc manquant" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validation partielle avec Yup
    const validatedData = await parcSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true,
    });

    // Vérifier si le parc existe
    const existingParc = await prisma.parc.findUnique({
      where: { id },
    });

    if (!existingParc) {
      return NextResponse.json({ error: "Parc non trouvé" }, { status: 404 });
    }

    // Vérifier si un autre parc a déjà ce nom (seulement si le nom est modifié)
    if (validatedData.name && validatedData.name !== existingParc.name) {
      const duplicateParc = await prisma.parc.findFirst({
        where: {
          name: validatedData.name,
          id: { not: id },
        },
      });

      if (duplicateParc) {
        return NextResponse.json(
          { error: "Un autre parc avec ce nom existe déjà" },
          { status: 409 }
        );
      }
    }

    // Vérifier si le type de parc existe (seulement si modifié)
    if (
      validatedData.typeparcId &&
      validatedData.typeparcId !== existingParc.typeparcId
    ) {
      const typeparcExists = await prisma.typeparc.findUnique({
        where: { id: validatedData.typeparcId },
      });

      if (!typeparcExists) {
        return NextResponse.json(
          { error: "Le type de parc spécifié n'existe pas" },
          { status: 404 }
        );
      }
    }

    const updatedParc = await prisma.parc.update({
      where: { id },
      data: validatedData,
      include: {
        typeparc: {
          // ← SINGULIER, pas Typeparc
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            engins: true,
          },
        },
      },
    });

    return NextResponse.json(updatedParc);
  } catch (error: any) {
    console.error("Error updating parc with PATCH:", error);

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
      { error: "Erreur lors de la modification du parc" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    // Vérifier la permission de lecture des sites (pas "users")
    const protectionError = await protectDeleteRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { message: "ID du parc manquant" },
        { status: 400 }
      );
    }

    // Vérifier si le parc existe
    const existingParc = await prisma.parc.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            engins: true,
            objectif: true, // ← SINGULIER
            typesConsommationLub: true,
            typepanneParc: true,
            lubrifiantParc: true,
          },
        },
      },
    });

    if (!existingParc) {
      return NextResponse.json({ error: "Parc non trouvé" }, { status: 404 });
    }

    // Vérifier s'il y a des relations qui empêchent la suppression
    const relationsCount =
      (existingParc._count.engins || 0) +
      (existingParc._count.objectif || 0) + // ← SINGULIER
      (existingParc._count.typesConsommationLub || 0) +
      (existingParc._count.typepanneParc || 0) +
      (existingParc._count.lubrifiantParc || 0);

    if (relationsCount > 0) {
      return NextResponse.json(
        {
          error: `Impossible de supprimer ce parc car il est lié à ${relationsCount} élément(s) (engins, objectifs, etc.)`,
          details: {
            engins: existingParc._count.engins,
            objectif: existingParc._count.objectif, // ← SINGULIER
            typesConsommationLub: existingParc._count.typesConsommationLub,
            typepanneParc: existingParc._count.typepanneParc,
            lubrifiantParc: existingParc._count.lubrifiantParc,
          },
        },
        { status: 409 }
      );
    }

    await prisma.parc.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Parc supprimé avec succès",
      deletedParc: {
        id: existingParc.id,
        name: existingParc.name,
      },
    });
  } catch (error) {
    console.error("Error deleting parc:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du parc" },
      { status: 500 }
    );
  }
}
