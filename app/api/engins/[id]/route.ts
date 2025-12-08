// app/api/engins/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enginSchema } from "@/lib/validations/enginSchema";
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

const the_resource = "engins";

export async function GET(request: NextRequest, context: Context) {
  try {
    // Vérifier la permission de lecture des sites (pas "users")
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { message: "ID de l'engin manquant" },
        { status: 400 }
      );
    }

    const engin = await prisma.engin.findUnique({
      where: { id },
      include: {
        parc: {
          include: {
            typeparc: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        site: {
          select: {
            id: true,
            name: true,
            active: true,
          },
        },
        // CORRECTION: Il n'y a pas de relation directe "pannes" dans Engin
        // Supprimez ou modifiez cette section
        saisiehim: {
          include: {
            panne: {
              include: {
                typepanne: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
        _count: {
          select: {
            // CORRECTION: Utilisez les bons noms
            saisiehrm: true,
            saisiehim: true,
            anomalies: true,
          },
        },
      },
    });

    if (!engin) {
      return NextResponse.json({ error: "Engin non trouvé" }, { status: 404 });
    }

    // Transformez les données pour inclure les pannes via saisiehim
    const enginWithPannes = {
      ...engin,
      // Créez une propriété pannes dérivée
      pannes: engin.saisiehim.map((sh) => sh.panne).filter(Boolean),
    };

    return NextResponse.json(enginWithPannes);
  } catch (error) {
    console.error("Error fetching engin:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'engin" },
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
        { message: "ID de l'engin manquant" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const validatedData = await enginSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true,
    });

    // Vérifier si l'engin existe
    const existingEngin = await prisma.engin.findUnique({
      where: { id },
    });

    if (!existingEngin) {
      return NextResponse.json({ error: "Engin non trouvé" }, { status: 404 });
    }

    // Vérifier si un autre engin a déjà ce nom
    const duplicateEngin = await prisma.engin.findFirst({
      where: {
        name: validatedData.name,
        id: { not: id },
      },
    });

    if (duplicateEngin) {
      return NextResponse.json(
        { message: "Un autre engin avec ce nom existe déjà" },
        { status: 409 }
      );
    }

    // Vérifier si le parc existe
    const parcExists = await prisma.parc.findUnique({
      where: { id: validatedData.parcId },
    });

    if (!parcExists) {
      return NextResponse.json(
        { message: "Le parc spécifié n'existe pas" },
        { status: 404 }
      );
    }

    // Vérifier si le site existe
    const siteExists = await prisma.site.findUnique({
      where: { id: validatedData.siteId },
    });

    if (!siteExists) {
      return NextResponse.json(
        { message: "Le site spécifié n'existe pas" },
        { status: 404 }
      );
    }

    const updatedEngin = await prisma.engin.update({
      where: { id },
      data: validatedData,
      include: {
        parc: {
          include: {
            typeparc: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        site: {
          select: {
            id: true,
            name: true,
            active: true,
          },
        },
        _count: {
          select: {
            // CORRECTION: Utilisez les bons noms
            saisiehrm: true,
            saisiehim: true,
            anomalies: true,
          },
        },
      },
    });

    return NextResponse.json(updatedEngin);
  } catch (error: any) {
    console.error("Error updating engin:", error);

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
      { error: "Erreur lors de la modification de l'engin" },
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
        { message: "ID de l'engin manquant" },
        { status: 400 }
      );
    }

    // Vérifier si l'engin existe
    const existingEngin = await prisma.engin.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            // CORRECTION: Ces noms sont corrects
            saisiehrm: true,
            saisiehim: true,
            anomalies: true,
          },
        },
      },
    });

    if (!existingEngin) {
      return NextResponse.json({ error: "Engin non trouvé" }, { status: 404 });
    }

    // Vérifier s'il y a des relations qui empêchent la suppression
    const relationsCount =
      (existingEngin._count.saisiehrm || 0) +
      (existingEngin._count.saisiehim || 0) +
      (existingEngin._count.anomalies || 0);

    if (relationsCount > 0) {
      return NextResponse.json(
        {
          error: `Impossible de supprimer cet engin car il est lié à ${relationsCount} élément(s) (saisies HRM, saisies HIM, anomalies, etc.)`,
          details: {
            saisiesHRM: existingEngin._count.saisiehrm,
            saisiesHIM: existingEngin._count.saisiehim,
            anomalies: existingEngin._count.anomalies,
          },
        },
        { status: 409 }
      );
    }

    await prisma.engin.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Engin supprimé avec succès",
      deletedEngin: {
        id: existingEngin.id,
        name: existingEngin.name,
      },
    });
  } catch (error) {
    console.error("Error deleting engin:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'engin" },
      { status: 500 }
    );
  }
}
