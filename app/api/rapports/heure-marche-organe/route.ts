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

    // Récupérer tous les engins actifs avec leurs sites et parcs
    const engins = await prisma.engin.findMany({
      where: { active: true },
      include: {
        site: {
          select: {
            id: true,
            name: true,
          },
        },
        parc: {
          include: {
            typeparc: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        MvtOrganes: {
          where: {
            organe: {
              active: true,
            },
          },
          include: {
            organe: {
              include: {
                type_organe: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            date_mvt: "desc",
          },
        },
      },
      orderBy: [
        { parc: { typeparc: { name: "asc" } } },
        { parc: { name: "asc" } },
        { name: "asc" },
      ],
    });

    const result: any[] = [];

    // Grouper par type de parc
    const enginsParTypeParc = engins.reduce((acc, engin) => {
      const typeParcId = engin.parc.typeparc.id;
      if (!acc[typeParcId]) {
        acc[typeParcId] = {
          typeParcId: typeParcId,
          typeParcName: engin.parc.typeparc.name,
          engins: [],
        };
      }
      acc[typeParcId].engins.push(engin);
      return acc;
    }, {} as Record<string, any>);

    // Pour chaque type de parc
    for (const typeParcId in enginsParTypeParc) {
      const typeParcData = enginsParTypeParc[typeParcId];
      const typeParcObj: any = {
        typeParcId: typeParcData.typeParcId,
        typeParcName: typeParcData.typeParcName,
        engins: [],
      };

      // Pour chaque engin dans ce type de parc
      for (const engin of typeParcData.engins) {
        // Récupérer tous les organes actifs associés à cet engin
        const mouvementsOrganes = await prisma.mvtOrgane.findMany({
          where: {
            enginId: engin.id,
            organe: {
              active: true,
            },
          },
          include: {
            organe: {
              include: {
                type_organe: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            date_mvt: "asc",
          },
        });

        // Grouper les mouvements par organe
        const mouvementsParOrgane = mouvementsOrganes.reduce((acc, mvt) => {
          if (!acc[mvt.organeId]) {
            acc[mvt.organeId] = [];
          }
          acc[mvt.organeId].push(mvt);
          return acc;
        }, {} as Record<string, any[]>);

        const enginObj: any = {
          enginId: engin.id,
          enginName: engin.name,
          siteName: engin.site.name,
          parcName: engin.parc.name,
          typeParcName: engin.parc.typeparc.name,
          organes: [],
        };

        // Pour chaque organe, calculer les HRM
        for (const organeId in mouvementsParOrgane) {
          const mouvements = mouvementsParOrgane[organeId];
          const dernierMouvement = mouvements[mouvements.length - 1];
          const organe = dernierMouvement.organe;

          // Trouver la dernière pose
          const dernieresPoses = mouvements.filter(
            (m: any) => m.type_mvt === "POSE"
          );
          const dernierePose = dernieresPoses[dernieresPoses.length - 1];

          if (!dernierePose) {
            // L'organe n'a jamais été posé sur cet engin
            continue;
          }

          // Trouver la dépose après la dernière pose (si elle existe)
          const deposesApresPose = mouvements.filter(
            (m: any) =>
              m.type_mvt === "DEPOSE" && m.date_mvt > dernierePose.date_mvt
          );
          const premiereDeposeApresPose = deposesApresPose[0];

          // Calculer la date de fin pour les calculs
          const dateFinCalcul = premiereDeposeApresPose?.date_mvt || finMois;

          // 1. Calcul HRM Mensuel (depuis dernière pose jusqu'à fin du mois)
          let hrmMensuel = 0;
          if (dernierePose.date_mvt <= finMois) {
            const dateDebutMensuel = dernierePose.date_mvt;
            const dateFinMensuel = premiereDeposeApresPose?.date_mvt || finMois;

            if (dateDebutMensuel <= dateFinMensuel) {
              const hrmPeriodes = await prisma.saisiehrm.findMany({
                where: {
                  enginId: engin.id,
                  du: {
                    gte: dateDebutMensuel,
                    lte: dateFinMensuel,
                  },
                },
                select: {
                  hrm: true,
                },
              });

              hrmMensuel = hrmPeriodes.reduce(
                (sum, saisie) => sum + safeNumber(saisie.hrm),
                0
              );
            }
          }

          // 2. Calcul HRM Cumul (depuis début du mois jusqu'à date de fin)
          let hrmCumul = 0;
          const dateDebutCumul = debutMois;
          const dateFinCumul = dateFinCalcul;

          if (dateDebutCumul <= dateFinCumul) {
            const hrmPeriodesCumul = await prisma.saisiehrm.findMany({
              where: {
                enginId: engin.id,
                du: {
                  gte: dateDebutCumul,
                  lte: dateFinCumul,
                },
              },
              select: {
                hrm: true,
              },
            });

            hrmCumul = hrmPeriodesCumul.reduce(
              (sum, saisie) => sum + safeNumber(saisie.hrm),
              0
            );
          }

          enginObj.organes.push({
            organeId: organe.id,
            organeName: organe.name,
            typeOrganeName: organe.type_organe.name,
            hrmMensuel: Math.round(hrmMensuel),
            hrmCumul: Math.round(hrmCumul),
            dateDernierePose: dernierePose.date_mvt.toISOString().split("T")[0],
            dateDepose:
              premiereDeposeApresPose?.date_mvt.toISOString().split("T")[0] ||
              "",
            estSurEngin: !premiereDeposeApresPose,
          });
        }

        // Ajouter l'engin seulement s'il a des organes
        if (enginObj.organes.length > 0) {
          typeParcObj.engins.push(enginObj);
        }
      }

      // Ajouter le type de parc seulement s'il a des engins avec organes
      if (typeParcObj.engins.length > 0) {
        result.push(typeParcObj);
      }
    }

    // Extraire toutes les listes uniques pour les filtres
    const allSites = [...new Set(engins.map((e: any) => e.site.name))];
    const allParcs = [...new Set(engins.map((e: any) => e.parc.name))];
    const allTypeOrganes = Array.from(
      new Set(
        result.flatMap((tp: any) =>
          tp.engins.flatMap((e: any) =>
            e.organes.map((o: any) => o.typeOrganeName)
          )
        )
      )
    ).sort();

    return NextResponse.json(
      {
        data: result,
        sites: allSites,
        parcs: allParcs,
        typeOrganes: allTypeOrganes,
        mois: mois,
        annee: annee,
      },
      { status: HttpStatusCode.Ok }
    );
  } catch (error: any) {
    console.error("Erreur API heure-marche-organe :", error);
    return NextResponse.json(
      { message: "Erreur serveur", details: error.message },
      { status: 500 }
    );
  }
}
