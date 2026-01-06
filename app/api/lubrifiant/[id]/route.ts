// app/api/lubrifiant/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  protectDeleteRoute,
  protectReadRoute,
  protectUpdateRoute,
} from "@/lib/rbac/middleware";

const the_resource = "lubrifiant";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { message: "ID du lubrifiant requis" },
        { status: 400 }
      );
    }

    const lubrifiant = await prisma.lubrifiant.findUnique({
      where: { id },
      include: {
        typelubrifiant: true,
        _count: {
          select: {
            saisielubrifiant: true,
            lubrifiantParc: true,
          },
        },
      },
    });

    if (!lubrifiant) {
      return NextResponse.json(
        { message: "Lubrifiant non trouvé" },
        { status: 404 }
      );
    }

    // Récupérer les parcs associés
    const lubrifiantParcs = await prisma.lubrifiantParc.findMany({
      where: { lubrifiantId: id },
      include: {
        parc: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const lubrifiantWithParcs = {
      ...lubrifiant,
      parcs: lubrifiantParcs.map((lp) => lp.parc),
    };

    return NextResponse.json(lubrifiantWithParcs);
  } catch (error) {
    console.error("Error fetching lubrifiant:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération du lubrifiant" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const protectionError = await protectUpdateRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { message: "ID du lubrifiant requis" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, typelubrifiantId, parcIds } = body;

    // Validation des données
    if (name && typeof name !== "string") {
      return NextResponse.json(
        { message: "Le nom doit être une chaîne de caractères" },
        { status: 400 }
      );
    }

    if (typelubrifiantId && typeof typelubrifiantId !== "string") {
      return NextResponse.json(
        { message: "Le type de lubrifiant doit être une chaîne de caractères" },
        { status: 400 }
      );
    }

    if (parcIds && (!Array.isArray(parcIds) || parcIds.length === 0)) {
      return NextResponse.json(
        { message: "Au moins un parc doit être sélectionné" },
        { status: 400 }
      );
    }

    const existingLubrifiant = await prisma.lubrifiant.findUnique({
      where: { id },
    });

    if (!existingLubrifiant) {
      return NextResponse.json(
        { message: "Lubrifiant non trouvé" },
        { status: 404 }
      );
    }

    // Si typelubrifiantId est fourni, vérifier qu'il existe
    if (typelubrifiantId) {
      const typeLubrifiantExists = await prisma.typelubrifiant.findUnique({
        where: { id: typelubrifiantId },
      });

      if (!typeLubrifiantExists) {
        return NextResponse.json(
          { message: "Le type de lubrifiant spécifié n'existe pas" },
          { status: 400 }
        );
      }
    }

    // Si parcIds est fourni, vérifier que tous les parcs existent
    if (parcIds) {
      const parcs = await prisma.parc.findMany({
        where: { id: { in: parcIds } },
      });

      if (parcs.length !== parcIds.length) {
        return NextResponse.json(
          { message: "Un ou plusieurs parcs spécifiés n'existent pas" },
          { status: 400 }
        );
      }
    }

    // Mettre à jour le lubrifiant et ses associations avec les parcs
    const result = await prisma.$transaction(async (tx) => {
      const lubrifiant = await tx.lubrifiant.update({
        where: { id },
        data: {
          ...(name !== undefined && { name: name.trim() }),
          ...(typelubrifiantId !== undefined && { typelubrifiantId }),
        },
        include: {
          typelubrifiant: true,
        },
      });

      // Si parcIds est fourni, mettre à jour les associations
      if (parcIds !== undefined) {
        // Supprimer toutes les associations existantes
        await tx.lubrifiantParc.deleteMany({
          where: { lubrifiantId: id },
        });

        // Créer les nouvelles associations
        const lubrifiantParcs = parcIds.map((parcId: string) => ({
          parcId,
          lubrifiantId: lubrifiant.id,
        }));

        await tx.lubrifiantParc.createMany({
          data: lubrifiantParcs,
        });
      }

      return lubrifiant;
    });

    // Récupérer les parcs associés pour la réponse
    const lubrifiantParcs = await prisma.lubrifiantParc.findMany({
      where: { lubrifiantId: result.id },
      include: {
        parc: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const resultWithParcs = {
      ...result,
      parcs: lubrifiantParcs.map((lp) => lp.parc),
    };

    return NextResponse.json(resultWithParcs);
  } catch (error) {
    console.error("Error updating lubrifiant:", error);

    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return NextResponse.json(
          { message: "Un lubrifiant avec ce nom existe déjà" },
          { status: 400 }
        );
      }
      if (error.message.includes("Record to update not found")) {
        return NextResponse.json(
          { message: "Lubrifiant non trouvé" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { message: "Erreur lors de la modification du lubrifiant" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const protectionError = await protectDeleteRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { message: "ID du lubrifiant requis" },
        { status: 400 }
      );
    }

    // Vérifier s'il y a des saisies de lubrifiant associées
    const saisiesCount = await prisma.saisielubrifiant.count({
      where: { lubrifiantId: id },
    });

    if (saisiesCount > 0) {
      return NextResponse.json(
        {
          message: `Impossible de supprimer ce lubrifiant car il est utilisé dans ${saisiesCount} saisie(s) de lubrifiant`,
        },
        { status: 400 }
      );
    }

    // Vérifier s'il y a des parcs associés
    const parcsCount = await prisma.lubrifiantParc.count({
      where: { lubrifiantId: id },
    });

    if (parcsCount > 0) {
      return NextResponse.json(
        {
          message: `Impossible de supprimer ce lubrifiant car il est associé à ${parcsCount} parc(s)`,
        },
        { status: 400 }
      );
    }

    const existingLubrifiant = await prisma.lubrifiant.findUnique({
      where: { id },
    });

    if (!existingLubrifiant) {
      return NextResponse.json(
        { message: "Lubrifiant non trouvé" },
        { status: 404 }
      );
    }

    await prisma.lubrifiant.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Lubrifiant supprimé avec succès" });
  } catch (error) {
    console.error("Error deleting lubrifiant:", error);

    if (
      error instanceof Error &&
      error.message.includes("Record to delete does not exist")
    ) {
      return NextResponse.json(
        { message: "Lubrifiant non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Erreur lors de la suppression du lubrifiant" },
      { status: 500 }
    );
  }
}
