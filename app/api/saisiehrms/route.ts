// app/api/saisiehrms/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const dateDebut = searchParams.get("dateDebut");
    const dateFin = searchParams.get("dateFin");
    const engin = searchParams.get("engin");
    const site = searchParams.get("site");
    const origineSaisie = searchParams.get("origineSaisie");

    const where: any = {};

    if (dateDebut && dateFin) {
      where.du = {
        gte: new Date(dateDebut),
        lte: new Date(dateFin),
      };
    } else if (dateDebut) {
      where.du = {
        gte: new Date(dateDebut),
      };
    } else if (dateFin) {
      where.du = {
        lte: new Date(dateFin),
      };
    }

    if (engin) {
      where.enginId = engin;
    }

    if (site) {
      where.siteId = site;
    }

    if (origineSaisie) {
      where.origineSaisieId = origineSaisie;
    }

    const saisiehrms = await prisma.saisiehrm.findMany({
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
            panne: true,
          },
        },
      },
      orderBy: {
        du: "desc",
      },
    });

    return NextResponse.json(saisiehrms);
  } catch (error) {
    console.error("Erreur lors de la récupération des saisies HRM:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des données" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { du, enginId, siteId, hrm, origineSaisieId } = body;

    // Vérifier si une saisie existe déjà pour cette date et cet engin
    const existingSaisie = await prisma.saisiehrm.findFirst({
      where: {
        du: new Date(du),
        enginId,
      },
    });

    if (existingSaisie) {
      return NextResponse.json(
        { error: "Une saisie existe déjà pour cette date et cet engin" },
        { status: 400 }
      );
    }

    const saisiehrm: any = await prisma.saisiehrm.create({
      data: {
        du: new Date(du),
        enginId,
        siteId,
        hrm: parseFloat(hrm),
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
      },
    });

    return NextResponse.json(saisiehrm);
  } catch (error) {
    console.error("Erreur lors de la création de la saisie HRM:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la saisie" },
      { status: 500 }
    );
  }
}
