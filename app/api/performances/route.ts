// app/api/performances/route.ts - Version corrigée selon le schéma
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const enginId = searchParams.get("enginId");
    const siteId = searchParams.get("siteId");
    const dateDebut = searchParams.get("dateDebut");
    const dateFin = searchParams.get("dateFin");

    const where: any = {};

    if (enginId) where.enginId = enginId;
    if (siteId) where.siteId = siteId;
    if (dateDebut || dateFin) {
      where.du = {};
      if (dateDebut) where.du.gte = new Date(dateDebut);
      if (dateFin) where.du.lte = new Date(dateFin);
    }

    const performances = await prisma.saisiehrm.findMany({
      where,
      include: {
        engin: {
          include: {
            parc: {
              include: {
                typeparc: true, // Note: Majuscule selon le schéma
              },
            },
            site: true,
          },
        },
        site: true,
        saisiehim: {
          // Note: Majuscule selon le schéma
          include: {
            panne: {
              // Note: Majuscule selon le schéma
              include: {
                typepanne: true, // Note: Majuscule selon le schéma
              },
            },
            saisielubrifiant: {
              // Note: Majuscule selon le schéma
              include: {
                lubrifiant: {
                  // Note: Majuscule selon le schéma
                  include: {
                    typelubrifiant: true, // Note: Majuscule selon le schéma
                  },
                },
                typeconsommationlub: true, // Note: Majuscule selon le schéma
              },
            },
            engin: true, // Relation optionnelle selon le schéma
          },
        },
      },
      orderBy: {
        du: "desc",
      },
    });

    // Formater la réponse pour maintenir la compatibilité
    const formattedPerformances = performances.map((performance) => ({
      ...performance,
      saisiehim: performance.saisiehim, // Renommer pour la compatibilité
      saisiehim: undefined, // Supprimer le champ original
    }));

    return NextResponse.json(formattedPerformances);
  } catch (error) {
    console.error("Erreur lors de la récupération des performances:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des performances" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { du, enginId, siteId, hrm, saisiehims } = body;

    // Vérifier si une saisie existe déjà pour cet engin à cette date
    const existingSaisie = await prisma.saisiehrm.findFirst({
      where: {
        du: new Date(du),
        enginId,
      },
    });

    if (existingSaisie) {
      return NextResponse.json(
        { error: "Une saisie existe déjà pour cet engin à cette date" },
        { status: 400 }
      );
    }

    // Vérifier que l'engin appartient au site spécifié
    const engin = await prisma.engin.findUnique({
      where: { id: enginId },
      include: { site: true },
    });

    if (!engin) {
      return NextResponse.json({ error: "engin non trouvé" }, { status: 404 });
    }

    if (engin.siteId !== siteId) {
      return NextResponse.json(
        { error: "L'engin n'appartient pas au site spécifié" },
        { status: 400 }
      );
    }

    // Créer la saisie HRM avec toutes les relations
    const performance = await prisma.saisiehrm.create({
      data: {
        du: new Date(du),
        enginId,
        siteId,
        hrm: parseFloat(hrm),
        saisiehim: {
          create:
            saisiehims?.map((him: any) => ({
              panneId: him.panneId,
              him: parseFloat(him.him),
              ni: parseInt(him.ni),
              obs: him.obs || null,
              enginId: enginId,
              saisielubrifiant: {
                create:
                  him.saisielubrifiants?.map((lub: any) => ({
                    lubrifiantId: lub.lubrifiantId,
                    qte: parseFloat(lub.qte),
                    obs: lub.obs || null,
                    typeconsommationlubId: lub.typeconsommationlubId || null,
                  })) || [],
              },
            })) || [],
        },
      },
      include: {
        engin: {
          include: {
            parc: {
              include: {
                typeparc: true,
              },
            },
            site: true,
          },
        },
        site: true,
        saisiehim: {
          include: {
            panne: {
              include: {
                typepanne: true,
              },
            },
            saisielubrifiant: {
              include: {
                lubrifiant: {
                  include: {
                    typelubrifiant: true,
                  },
                },
                typeconsommationlub: true,
              },
            },
            engin: true,
          },
        },
      },
    });

    // Formater la réponse pour maintenir la compatibilité
    const formattedPerformance = {
      ...performance,
      saisiehim: performance.saisiehim,
      saisiehim: undefined,
    };

    return NextResponse.json(formattedPerformance);
  } catch (error: any) {
    console.error("Erreur lors de la création de la performance:", error);

    // Gérer les erreurs de contrainte unique
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Une saisie existe déjà pour cet engin à cette date" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de la création de la performance" },
      { status: 500 }
    );
  }
}
