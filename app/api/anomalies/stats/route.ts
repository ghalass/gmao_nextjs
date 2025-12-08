// app/api/anomalies/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectReadRoute } from "@/lib/rbac/middleware";

const the_resource = "anomalie";

export async function GET(request: NextRequest) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const { searchParams } = new URL(request.url);
    const where: any = {};

    // Appliquer les mêmes filtres que la liste principale
    const siteId = searchParams.get("siteId");
    const enginId = searchParams.get("enginId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    if (siteId) where.siteId = siteId;
    if (enginId) where.enginId = enginId;
    if (dateFrom || dateTo) {
      where.dateDetection = {};
      if (dateFrom) where.dateDetection.gte = new Date(dateFrom);
      if (dateTo) where.dateDetection.lte = new Date(dateTo);
    }

    // Obtenir les statistiques par statut
    const statuts = await prisma.anomalie.groupBy({
      by: ["statut"],
      where,
      _count: true,
    });

    // Obtenir les statistiques par priorité
    const priorities = await prisma.anomalie.groupBy({
      by: ["priorite"],
      where,
      _count: true,
    });

    // Obtenir les statistiques par source
    const sources = await prisma.anomalie.groupBy({
      by: ["source"],
      where,
      _count: true,
    });

    // Total
    const total = await prisma.anomalie.count({ where });

    // Transformer les données
    const parStatut = statuts.reduce((acc, item) => {
      acc[item.statut] = item._count;
      return acc;
    }, {} as Record<string, number>);

    const parPriorite = priorities.reduce((acc, item) => {
      acc[item.priorite] = item._count;
      return acc;
    }, {} as Record<string, number>);

    const parSource = sources.reduce((acc, item) => {
      acc[item.source] = item._count;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      total,
      parStatut,
      parPriorite,
      parSource,
    });
  } catch (error) {
    console.error("Error fetching anomaly stats:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    );
  }
}
