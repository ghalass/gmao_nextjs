// app/api/performances/route.ts - Version corrigée
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
                typeparc: true,
              },
            },
          },
        },
        site: true,
        saisiehim: {
          include: {
            panne: {
              include: {
                typepanne: true, // ← CORRECTION: seulement typepanne
              },
            },
            saisielubrifiant: {
              // ← CORRECTION: singulier
              include: {
                lubrifiant: {
                  include: {
                    typelubrifiant: true,
                  },
                },
                typeconsommationlub: true,
              },
            },
          },
        },
      },
      orderBy: {
        du: "desc",
      },
    });

    return NextResponse.json(performances);
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
              obs: him.obs,
              enginId: enginId,
              saisielubrifiant: {
                // ← CORRECTION: singulier
                create:
                  him.saisielubrifiants?.map((lub: any) => ({
                    lubrifiantId: lub.lubrifiantId,
                    qte: parseFloat(lub.qte),
                    obs: lub.obs,
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
          },
        },
        site: true,
        saisiehim: {
          include: {
            panne: {
              include: {
                typepanne: true, // ← CORRECTION: seulement typepanne
              },
            },
            saisielubrifiant: {
              // ← CORRECTION: singulier
              include: {
                lubrifiant: {
                  include: {
                    typelubrifiant: true,
                  },
                },
                typeconsommationlub: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(performance);
  } catch (error) {
    console.error("Erreur lors de la création de la performance:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la performance" },
      { status: 500 }
    );
  }
}
