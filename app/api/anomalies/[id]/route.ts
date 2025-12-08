// app/api/anomalies/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  protectDeleteRoute,
  protectReadRoute,
  protectUpdateRoute,
} from "@/lib/rbac/middleware";

const the_resource = "anomalie";

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
        { message: "ID de l'anomalie requis" },
        { status: 400 }
      );
    }

    const anomalie = await prisma.anomalie.findUnique({
      where: { id },
      include: {
        engin: { select: { id: true, name: true } },
        site: { select: { id: true, name: true } },
        historiqueStatutAnomalies: {
          orderBy: { dateChangement: "desc" },
        },
      },
    });

    if (!anomalie) {
      return NextResponse.json(
        { message: "Anomalie non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(anomalie);
  } catch (error) {
    console.error("Error fetching anomalie:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération de l'anomalie" },
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
        { message: "ID de l'anomalie requis" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const existingAnomalie = await prisma.anomalie.findUnique({
      where: { id },
    });

    if (!existingAnomalie) {
      return NextResponse.json(
        { message: "Anomalie non trouvée" },
        { status: 404 }
      );
    }

    // Préparer les données pour la mise à jour
    const updateData: any = {};

    // Gérer les champs de date
    if (body.dateDetection) {
      updateData.dateDetection = new Date(body.dateDetection);
    }
    if (body.dateExecution !== undefined) {
      updateData.dateExecution = body.dateExecution
        ? new Date(body.dateExecution)
        : null;
    }

    // Gérer les autres champs
    const fields = [
      "description",
      "source",
      "priorite",
      "reference",
      "code",
      "stock",
      "numeroBS",
      "programmation",
      "sortiePDR",
      "equipe",
      "confirmation",
      "observations",
      "enginId",
      "siteId",
    ];

    fields.forEach((field) => {
      if (field in body) {
        updateData[field] = body[field]?.trim() || null;
      }
    });

    // Gérer les booléens
    if ("besoinPDR" in body) {
      updateData.besoinPDR = Boolean(body.besoinPDR);
    }

    // Gérer les nombres
    if ("quantite" in body) {
      updateData.quantite = body.quantite ? parseInt(body.quantite) : null;
    }

    // Gérer le changement de statut
    if (body.statut && body.statut !== existingAnomalie.statut) {
      updateData.statut = body.statut;
    }

    const anomalie = await prisma.anomalie.update({
      where: { id },
      data: updateData,
      include: {
        engin: { select: { id: true, name: true } },
        site: { select: { id: true, name: true } },
      },
    });

    // Créer un historique si le statut a changé
    if (body.statut && body.statut !== existingAnomalie.statut) {
      await prisma.historiqueStatutAnomalie.create({
        data: {
          anomalieId: id,
          ancienStatut: existingAnomalie.statut,
          nouveauStatut: body.statut,
          commentaire: body.commentaireChangementStatut || null,
        },
      });
    }

    return NextResponse.json(anomalie);
  } catch (error) {
    console.error("Error updating anomalie:", error);

    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return NextResponse.json(
          { message: "Une anomalie avec ce numéro de backlog existe déjà" },
          { status: 400 }
        );
      }
      if (error.message.includes("Record to update not found")) {
        return NextResponse.json(
          { message: "Anomalie non trouvée" },
          { status: 404 }
        );
      }
      if (error.message.includes("Foreign key constraint")) {
        return NextResponse.json(
          { message: "L'engin ou le site spécifié n'existe pas" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { message: "Erreur lors de la modification de l'anomalie" },
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
        { message: "ID de l'anomalie requis" },
        { status: 400 }
      );
    }

    const existingAnomalie = await prisma.anomalie.findUnique({
      where: { id },
    });

    if (!existingAnomalie) {
      return NextResponse.json(
        { message: "Anomalie non trouvée" },
        { status: 404 }
      );
    }

    // Supprimer d'abord l'historique
    await prisma.historiqueStatutAnomalie.deleteMany({
      where: { anomalieId: id },
    });

    // Puis supprimer l'anomalie
    await prisma.anomalie.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Anomalie supprimée avec succès",
    });
  } catch (error) {
    console.error("Error deleting anomalie:", error);

    if (error instanceof Error) {
      if (error.message.includes("Record to delete does not exist")) {
        return NextResponse.json(
          { message: "Anomalie non trouvée" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { message: "Erreur lors de la suppression de l'anomalie" },
      { status: 500 }
    );
  }
}
