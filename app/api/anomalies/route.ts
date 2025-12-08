// app/api/anomalies/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectCreateRoute, protectReadRoute } from "@/lib/rbac/middleware";

const the_resource = "anomalie";

export async function GET(request: NextRequest) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { searchParams } = new URL(request.url);

    // Filtres
    const filters: any = {
      where: {},
      include: {
        engin: { select: { id: true, name: true } },
        site: { select: { id: true, name: true } },
        historiqueStatutAnomalies: {
          orderBy: { dateChangement: "desc" },
          take: 5,
        },
      },
      orderBy: { createdAt: "desc" },
    };

    const search = searchParams.get("search");
    const statut = searchParams.get("statut");
    const priorite = searchParams.get("priorite");
    const source = searchParams.get("source");
    const enginId = searchParams.get("enginId");
    const siteId = searchParams.get("siteId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    if (search) {
      filters.where.OR = [
        { numeroBacklog: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { reference: { contains: search, mode: "insensitive" } },
        { numeroBS: { contains: search, mode: "insensitive" } },
      ];
    }

    if (statut) filters.where.statut = statut;
    if (priorite) filters.where.priorite = priorite;
    if (source) filters.where.source = source;
    if (enginId) filters.where.enginId = enginId;
    if (siteId) filters.where.siteId = siteId;

    if (dateFrom || dateTo) {
      filters.where.dateDetection = {};
      if (dateFrom) filters.where.dateDetection.gte = new Date(dateFrom);
      if (dateTo) filters.where.dateDetection.lte = new Date(dateTo);
    }

    const anomalies = await prisma.anomalie.findMany(filters);

    return NextResponse.json(anomalies);
  } catch (error) {
    console.error("Error fetching anomalies:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération des anomalies" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const protectionError = await protectCreateRoute(request, the_resource);
    if (protectionError) return protectionError;

    const body = await request.json();

    // Validation basique
    if (!body.numeroBacklog || typeof body.numeroBacklog !== "string") {
      return NextResponse.json(
        { message: "Le numéro de backlog est requis" },
        { status: 400 }
      );
    }

    if (!body.description || typeof body.description !== "string") {
      return NextResponse.json(
        { message: "La description est requise" },
        { status: 400 }
      );
    }

    if (!body.enginId || typeof body.enginId !== "string") {
      return NextResponse.json(
        { message: "L'engin est requis" },
        { status: 400 }
      );
    }

    if (!body.siteId || typeof body.siteId !== "string") {
      return NextResponse.json(
        { message: "Le site est requis" },
        { status: 400 }
      );
    }

    // Vérifier si le numéro de backlog existe déjà
    const existingAnomalie = await prisma.anomalie.findUnique({
      where: { numeroBacklog: body.numeroBacklog },
    });

    if (existingAnomalie) {
      return NextResponse.json(
        { message: "Une anomalie avec ce numéro de backlog existe déjà" },
        { status: 400 }
      );
    }

    // Préparer les données
    const data: any = {
      ...body,
      dateDetection: new Date(body.dateDetection),
      dateExecution: body.dateExecution ? new Date(body.dateExecution) : null,
      besoinPDR: Boolean(body.besoinPDR),
      quantite: body.quantite ? parseInt(body.quantite) : null,
      // Assurer que les champs optionnels sont null si vides
      reference: body.reference?.trim() || null,
      code: body.code?.trim() || null,
      stock: body.stock?.trim() || null,
      numeroBS: body.numeroBS?.trim() || null,
      programmation: body.programmation?.trim() || null,
      sortiePDR: body.sortiePDR?.trim() || null,
      equipe: body.equipe?.trim() || null,
      confirmation: body.confirmation?.trim() || null,
      observations: body.observations?.trim() || null,
    };

    const anomalie = await prisma.anomalie.create({
      data,
      include: {
        engin: { select: { id: true, name: true } },
        site: { select: { id: true, name: true } },
      },
    });

    // Créer le premier historique de statut
    await prisma.historiqueStatutAnomalie.create({
      data: {
        anomalieId: anomalie.id,
        ancienStatut: "ATTENTE_PDR", // Statut initial par défaut
        nouveauStatut: anomalie.statut,
        commentaire: "Création de l'anomalie",
      },
    });

    return NextResponse.json(anomalie, { status: 201 });
  } catch (error) {
    console.error("Error creating anomalie:", error);

    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return NextResponse.json(
          { message: "Une anomalie avec ce numéro de backlog existe déjà" },
          { status: 400 }
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
      { message: "Erreur lors de la création de l'anomalie" },
      { status: 500 }
    );
  }
}
