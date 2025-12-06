// app/api/saisielubrifiants/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
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

    // Filtrage par date via la relation Saisiehim -> Saisiehrm
    if (dateDebut || dateFin) {
      where.saisiehim = {
        saisiehrm: {},
      };

      if (dateDebut && dateFin) {
        where.saisiehim.saisiehrm.du = {
          gte: new Date(dateDebut),
          lte: new Date(dateFin),
        };
      } else if (dateDebut) {
        where.saisiehim.saisiehrm.du = {
          gte: new Date(dateDebut),
        };
      } else if (dateFin) {
        where.saisiehim.saisiehrm.du = {
          lte: new Date(dateFin),
        };
      }
    }

    if (engin) {
      where.OR = [
        { saisiehim: { enginId: engin } },
        { saisiehim: { saisiehrm: { enginId: engin } } },
      ];
    }

    if (site) {
      where.saisiehim = {
        saisiehrm: { siteId: site },
      };
    }

    if (origineSaisie) {
      where.origineSaisieId = origineSaisie;
    }

    const saisielubrifiants = await prisma.saisielubrifiant.findMany({
      where,
      include: {
        lubrifiant: true,
        saisiehim: {
          include: {
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
            panne: true,
          },
        },
        typeconsommationlub: true,
        origineSaisie: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(saisielubrifiants);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des saisies de lubrifiants:",
      error
    );
    return NextResponse.json(
      { error: "Erreur lors de la récupération des données" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const {
      lubrifiantId,
      qte,
      saisiehimId,
      typeconsommationlubId,
      origineSaisieId,
      obs,
    } = body;

    // Validation des données requises
    if (!lubrifiantId || !qte || !saisiehimId) {
      return NextResponse.json(
        {
          error:
            "Le lubrifiant, la quantité et la saisie HIM sont obligatoires",
        },
        { status: 400 }
      );
    }

    const saisielubrifiant = await prisma.saisielubrifiant.create({
      data: {
        lubrifiantId,
        qte: parseFloat(qte),
        saisiehimId,
        typeconsommationlubId: typeconsommationlubId || null,
        origineSaisieId: origineSaisieId || null,
        obs: obs || null,
      },
      include: {
        lubrifiant: true,
        saisiehim: {
          include: {
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
            panne: true,
          },
        },
        typeconsommationlub: true,
        origineSaisie: true,
      },
    });

    return NextResponse.json(saisielubrifiant, { status: 201 });
  } catch (error: any) {
    console.error(
      "Erreur lors de la création de la saisie de lubrifiant:",
      error
    );

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Une saisie similaire existe déjà" },
        { status: 400 }
      );
    }

    if (error.code === "P2003") {
      return NextResponse.json(
        {
          error:
            "Référence invalide (lubrifiant, saisie HIM ou type de consommation non trouvé)",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de la création de la saisie" },
      { status: 500 }
    );
  }
}
