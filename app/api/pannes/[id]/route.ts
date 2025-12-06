// app/api/pannes/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "ID de la panne manquant" },
        { status: 400 }
      );
    }

    // Selon votre schéma, Panne n'a que les relations suivantes :
    // - typepanne
    // - saisiehim (notez le nom correct : saisiehim, pas saisiehims)
    const panne = await prisma.panne.findUnique({
      where: { id },
      include: {
        typepanne: true,
        // CORRECTION : Utiliser le nom correct de la relation
        saisiehim: {
          include: {
            engin: {
              include: {
                site: true,
                parc: true,
              },
            },
            saisiehrm: {
              select: {
                id: true,
                du: true,
                hrm: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!panne) {
      return NextResponse.json({ error: "Panne non trouvée" }, { status: 404 });
    }

    return NextResponse.json(panne);
  } catch (error) {
    console.error("Erreur lors du chargement de la panne:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement de la panne" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "ID de la panne manquant" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Vérifier si la panne existe
    const existingPanne = await prisma.panne.findUnique({
      where: { id },
    });

    if (!existingPanne) {
      return NextResponse.json({ error: "Panne non trouvée" }, { status: 404 });
    }

    // Valider les données
    if (!body.name || body.name.trim().length < 2) {
      return NextResponse.json(
        { error: "Le nom doit contenir au moins 2 caractères" },
        { status: 400 }
      );
    }

    if (!body.typepanneId) {
      return NextResponse.json(
        { error: "Le type de panne est requis" },
        { status: 400 }
      );
    }

    // Vérifier si le type de panne existe
    const typepanneExists = await prisma.typepanne.findUnique({
      where: { id: body.typepanneId },
    });

    if (!typepanneExists) {
      return NextResponse.json(
        { error: "Le type de panne spécifié n'existe pas" },
        { status: 404 }
      );
    }

    // Vérifier si un autre enregistrement a déjà ce nom (sauf celui-ci)
    if (body.name !== existingPanne.name) {
      const duplicatePanne = await prisma.panne.findFirst({
        where: {
          name: body.name,
          id: { not: id },
        },
      });

      if (duplicatePanne) {
        return NextResponse.json(
          { error: "Une autre panne avec ce nom existe déjà" },
          { status: 409 }
        );
      }
    }

    // Mettre à jour la panne
    const panne = await prisma.panne.update({
      where: { id },
      data: {
        name: body.name,
        typepanneId: body.typepanneId,
      },
      include: {
        typepanne: true,
        saisiehim: {
          include: {
            engin: {
              include: {
                site: true,
                parc: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(panne);
  } catch (error) {
    console.error("Erreur lors de la modification de la panne:", error);

    // Gérer les erreurs spécifiques de Prisma
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "Une panne avec ce nom existe déjà" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de la modification de la panne" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "ID de la panne manquant" },
        { status: 400 }
      );
    }

    // Vérifier si la panne existe
    const existingPanne = await prisma.panne.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            saisiehim: true,
          },
        },
      },
    });

    if (!existingPanne) {
      return NextResponse.json({ error: "Panne non trouvée" }, { status: 404 });
    }

    // Vérifier s'il y a des saisiehim liées
    if (existingPanne._count.saisiehim > 0) {
      return NextResponse.json(
        {
          error: "Impossible de supprimer cette panne",
          message: `Cette panne est liée à ${existingPanne._count.saisiehim} saisie(s) HIM. Veuillez d'abord supprimer ou modifier les saisies associées.`,
          count: existingPanne._count.saisiehim,
        },
        { status: 409 }
      );
    }

    await prisma.panne.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Panne supprimée avec succès",
      deletedPanne: {
        id: existingPanne.id,
        name: existingPanne.name,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de la panne:", error);

    // Gérer les erreurs de contrainte de clé étrangère
    if (
      error instanceof Error &&
      (error.message.includes("foreign key constraint") ||
        error.message.includes("P2003")) // Code d'erreur Prisma pour les contraintes FK
    ) {
      return NextResponse.json(
        {
          error: "Impossible de supprimer la panne",
          message:
            "Cette panne est liée à d'autres éléments. Veuillez d'abord supprimer les relations associées.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de la suppression de la panne" },
      { status: 500 }
    );
  }
}
