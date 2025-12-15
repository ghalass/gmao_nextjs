import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { HttpStatusCode } from "axios";

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function safeNumber(v: any) {
  if (v == null) return 0;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mois, annee } = body;

    if (!mois || !annee) {
      return NextResponse.json(
        { message: "Paramètres 'mois' et 'année' obligatoires" },
        { status: 400 }
      );
    }

    const year = parseInt(annee);
    const monthIndex = parseInt(mois) - 1;

    if (isNaN(year) || isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
      return NextResponse.json(
        { message: "Mois ou année invalide" },
        { status: 400 }
      );
    }

    // Période du mois
    const debutMois = new Date(year, monthIndex, 1);
    const finMois = new Date(
      year,
      monthIndex,
      daysInMonth(year, monthIndex),
      23,
      59,
      59,
      999
    );

    // Récupérer tous les sites actifs
    const sites = await prisma.site.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    // Récupérer tous les types de parcs avec leurs parcs
    const typeParcs = await prisma.typeparc.findMany({
      include: {
        parcs: {
          include: {
            typeparc: true,
            engins: {
              where: { active: true },
              include: {
                site: true,
                parc: true,
                MvtOrganes: {
                  where: {
                    date_mvt: {
                      gte: debutMois,
                      lte: finMois,
                    },
                    type_mvt: "DEPOSE", // Seulement les déposes du mois
                  },
                  include: {
                    organe: {
                      include: {
                        type_organe: true,
                      },
                    },
                    engin: {
                      include: {
                        saisiehrm: {
                          where: {
                            du: {
                              gte: debutMois,
                              lte: finMois,
                            },
                          },
                          select: {
                            du: true,
                            hrm: true,
                          },
                        },
                      },
                    },
                  },
                  orderBy: {
                    date_mvt: "asc",
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const result: any[] = [];

    for (const typeParc of typeParcs) {
      const typeParcObj: any = {
        typeParcId: typeParc.id,
        typeParcName: typeParc.name,
        parcs: [],
      };

      for (const parc of typeParc.parcs) {
        const parcObj: any = {
          parcId: parc.id,
          parcName: parc.name,
          typeParcId: typeParc.id,
          typeParcName: typeParc.name,
          mouvements: [],
        };

        // Pour chaque engin du parc
        for (const engin of parc.engins) {
          // Regrouper les mouvements par organe et date
          const mouvementsParOrgane = new Map();

          for (const mvt of engin.MvtOrganes) {
            const key = `${mvt.organeId}-${
              mvt.date_mvt.toISOString().split("T")[0]
            }`;

            if (!mouvementsParOrgane.has(key)) {
              mouvementsParOrgane.set(key, {
                depose: null,
                pose: null,
              });
            }

            if (mvt.type_mvt === "DEPOSE") {
              mouvementsParOrgane.get(key).depose = mvt;
            }
          }

          // Maintenant, pour chaque dépose, chercher la pose correspondante
          for (const [key, mouvements] of mouvementsParOrgane.entries()) {
            if (mouvements.depose) {
              const depose = mouvements.depose;

              // Trouver la pose correspondante (même organe, même jour ou après)
              const poseCorrespondante = await prisma.mvtOrgane.findFirst({
                where: {
                  organeId: depose.organeId,
                  enginId: depose.enginId,
                  date_mvt: {
                    gte: depose.date_mvt,
                    lte: finMois,
                  },
                  type_mvt: "POSE",
                },
                include: {
                  organe: {
                    include: {
                      type_organe: true,
                    },
                  },
                },
                orderBy: {
                  date_mvt: "asc",
                },
              });

              // Calculer HRM entre la dernière pose et cette dépose
              let hrmDepose = 0;

              // Trouver la dernière pose avant cette dépose
              const dernierePose = await prisma.mvtOrgane.findFirst({
                where: {
                  organeId: depose.organeId,
                  enginId: depose.enginId,
                  date_mvt: {
                    lt: depose.date_mvt,
                  },
                  type_mvt: "POSE",
                },
                orderBy: {
                  date_mvt: "desc",
                },
              });

              // Calculer HRM entre dernière pose et dépose
              if (dernierePose) {
                const dateDebutHRM = dernierePose.date_mvt;
                const dateFinHRM = depose.date_mvt;

                // Récupérer les HRM de l'engin entre ces dates
                const hrmPeriodes = await prisma.saisiehrm.findMany({
                  where: {
                    enginId: engin.id,
                    du: {
                      gte: dateDebutHRM,
                      lte: dateFinHRM,
                    },
                  },
                  select: {
                    hrm: true,
                  },
                });

                hrmDepose = hrmPeriodes.reduce(
                  (sum, saisie) => sum + safeNumber(saisie.hrm),
                  0
                );
              }

              const mouvementData = {
                enginId: engin.id,
                enginName: engin.name,
                siteName: engin.site.name,
                parcName: parc.name,
                typeParcName: typeParc.name,
                typeOrganeName: depose.organe.type_organe.name,
                dateDepose: depose.date_mvt.toISOString().split("T")[0],
                organeDepose: depose.organe.name,
                hrmDepose: Math.round(hrmDepose),
                datePose:
                  poseCorrespondante?.date_mvt.toISOString().split("T")[0] ||
                  "",
                organePose: poseCorrespondante?.organe.name || "",
                causeDepose: depose.cause,
                typeCause: depose.type_cause || "",
                observations: depose.obs || "",
              };

              parcObj.mouvements.push(mouvementData);
            }
          }
        }

        // Ajouter le parc seulement s'il a des mouvements
        if (parcObj.mouvements.length > 0) {
          typeParcObj.parcs.push(parcObj);
        }
      }

      // Ajouter le type de parc seulement s'il a des parcs avec mouvements
      if (typeParcObj.parcs.length > 0) {
        result.push(typeParcObj);
      }
    }

    // Extraire toutes les listes uniques
    const allParcs = result.flatMap((typeParc) =>
      typeParc.parcs.map((parc: any) => parc.parcName)
    );

    const allTypeOrganes = Array.from(
      new Set(
        result.flatMap((typeParc) =>
          typeParc.parcs.flatMap((parc: any) =>
            parc.mouvements.map((mvt: any) => mvt.typeOrganeName)
          )
        )
      )
    );

    return NextResponse.json(
      {
        data: result,
        sites: sites.map((s) => s.name),
        parcs: [...new Set(allParcs)],
        typeOrganes: allTypeOrganes.sort(),
      },
      { status: HttpStatusCode.Ok }
    );
  } catch (error: any) {
    console.error("Erreur API mvt-organe :", error);
    return NextResponse.json(
      { message: "Erreur serveur", details: error.message },
      { status: 500 }
    );
  }
}
