// app/api/saisiehims/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
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
      where.saisiehrm = {
        du: {
          gte: new Date(dateDebut),
          lte: new Date(dateFin),
        },
      };
    } else if (dateDebut) {
      where.saisiehrm = {
        du: {
          gte: new Date(dateDebut),
        },
      };
    } else if (dateFin) {
      where.saisiehrm = {
        du: {
          lte: new Date(dateFin),
        },
      };
    }

    if (engin) {
      where.OR = [{ enginId: engin }, { saisiehrm: { enginId: engin } }];
    }

    if (site) {
      where.OR = [{ saisiehrm: { siteId: site } }];
    }

    if (origineSaisie) {
      where.origineSaisieId = origineSaisie;
    }

    const saisiehims = await prisma.saisiehim.findMany({
      where,
      include: {
        panne: true,
        saisiehrm: {
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
        },
        engin: {
          include: {
            parc: {
              include: {
                typeparc: true,
              },
            },
          },
        },
        saisielubrifiants: {
          include: {
            lubrifiant: true,
            typeconsommationlub: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(saisiehims);
  } catch (error) {
    console.error("Erreur lors de la récupération des saisies HIM:", error);
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
    const { panneId, him, ni, saisiehrmId, enginId, obs, origineSaisieId } =
      body;

    const saisiehim = await prisma.saisiehim.create({
      data: {
        panneId,
        him: parseFloat(him),
        ni: parseInt(ni),
        saisiehrmId,
        enginId: enginId || null,
        obs: obs || null,
      },
      include: {
        panne: true,
        saisiehrm: {
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
        },
        engin: {
          include: {
            parc: {
              include: {
                typeparc: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(saisiehim);
  } catch (error) {
    console.error("Erreur lors de la création de la saisie HIM:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la saisie" },
      { status: 500 }
    );
  }
}
