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

    // Périodes de calcul
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
    const debutAnnee = new Date(year, 0, 1);
    const finAnnee = new Date(year, 11, 31, 23, 59, 59, 999);

    // Récupérer tous les typeparcs avec leurs parcs
    const typeparcs = await prisma.typeparc.findMany({
      include: {
        parcs: {
          include: {
            engins: {
              where: { active: true },
              select: { id: true, name: true },
            },
            pannes: {
              include: {
                typepanne: true,
              },
            },
          },
        },
      },
    });

    const result = [];

    // Récupérer toutes les saisiehim pour la période du mois
    const saisiehimMois = await prisma.saisiehim.findMany({
      where: {
        saisiehrm: {
          du: {
            gte: debutMois,
            lte: finMois,
          },
        },
        engin: {
          active: true,
        },
      },
      include: {
        panne: true,
        engin: true,
        saisiehrm: true,
      },
    });

    // Récupérer toutes les saisiehim pour la période de l'année
    const saisiehimAnnee = await prisma.saisiehim.findMany({
      where: {
        saisiehrm: {
          du: {
            gte: debutAnnee,
            lte: finAnnee,
          },
        },
        engin: {
          active: true,
        },
      },
      include: {
        panne: true,
        engin: true,
        saisiehrm: true,
      },
    });

    // Calculer les totaux globaux pour les pourcentages
    let totalNIGlobalMois = 0;
    let totalHIMGlobalMois = 0;
    let totalNIGlobalAnnee = 0;
    let totalHIMGlobalAnnee = 0;

    // Première passe pour calculer les totaux globaux
    for (const sh of saisiehimMois) {
      totalNIGlobalMois += sh.ni || 0;
      totalHIMGlobalMois += sh.him || 0;
    }

    for (const sh of saisiehimAnnee) {
      totalNIGlobalAnnee += sh.ni || 0;
      totalHIMGlobalAnnee += sh.him || 0;
    }

    // Deuxième passe pour construire le résultat
    for (const tp of typeparcs) {
      const typeparcObj: any = {
        typeParcId: tp.id,
        typeParcName: tp.name,
        parcs: [],
        totalTypeParc: {
          niMois: 0,
          niAnnee: 0,
          himMois: 0,
          himAnnee: 0,
          coeffNiMois: 0,
          coeffNiAnnee: 0,
          coeffHimMois: 0,
          coeffHimAnnee: 0,
        },
      };

      // Récupérer les IDs d'engins par parc pour ce typeparc
      const parcEnginIds = new Map();
      const parcEnginCounts = new Map();

      for (const parc of tp.parcs) {
        const enginIds = parc.engins.map((e) => e.id);
        if (enginIds.length === 0) continue;

        parcEnginIds.set(parc.id, enginIds);
        parcEnginCounts.set(parc.id, enginIds.length);
      }

      // Pour chaque parc du typeparc
      for (const parc of tp.parcs) {
        const enginIds = parcEnginIds.get(parc.id) || [];
        if (enginIds.length === 0) continue;

        const parcData: any = {
          parcId: parc.id,
          parcName: parc.name,
          nbreEngins: enginIds.length,
          pannes: [],
          totalParc: {
            niMois: 0,
            niAnnee: 0,
            himMois: 0,
            himAnnee: 0,
            coeffNiMois: 0,
            coeffNiAnnee: 0,
            coeffHimMois: 0,
            coeffHimAnnee: 0,
          },
        };

        // Grouper les pannes par typepanne
        const pannesByType = new Map();

        // Collecter toutes les pannes associées à ce parc
        for (const panne of parc.pannes) {
          const typepanneId = panne.typepanneId;
          const typepanneName = panne.typepanne?.name || "Sans type";

          if (!pannesByType.has(typepanneId)) {
            pannesByType.set(typepanneId, {
              typepanneId,
              typepanneName,
              pannes: [],
            });
          }

          pannesByType.get(typepanneId).pannes.push(panne);
        }

        // Traiter chaque type de panne
        for (const [typepanneId, typepanneData] of pannesByType) {
          const typepanneObj: any = {
            typepanneId,
            typepanneName: typepanneData.typepanneName,
            pannes: [],
            totalTypePanne: {
              niMois: 0,
              niAnnee: 0,
              himMois: 0,
              himAnnee: 0,
              coeffNiMois: 0,
              coeffNiAnnee: 0,
              coeffHimMois: 0,
              coeffHimAnnee: 0,
            },
          };

          // Pour chaque panne dans ce type
          for (const panne of typepanneData.pannes) {
            // Filtrer les saisiehim pour cette panne et ce parc (engins du parc)
            const saisiehimForPanneMois = saisiehimMois.filter(
              (sh) => sh.panneId === panne.id && enginIds.includes(sh.enginId)
            );

            const saisiehimForPanneAnnee = saisiehimAnnee.filter(
              (sh) => sh.panneId === panne.id && enginIds.includes(sh.enginId)
            );

            const niMois = saisiehimForPanneMois.reduce(
              (sum, sh) => sum + (sh.ni || 0),
              0
            );
            const himMois = saisiehimForPanneMois.reduce(
              (sum, sh) => sum + (sh.him || 0),
              0
            );

            const niAnnee = saisiehimForPanneAnnee.reduce(
              (sum, sh) => sum + (sh.ni || 0),
              0
            );
            const himAnnee = saisiehimForPanneAnnee.reduce(
              (sum, sh) => sum + (sh.him || 0),
              0
            );

            // Calcul des coefficients
            const coeffNiMois =
              totalNIGlobalMois > 0 ? (niMois / totalNIGlobalMois) * 100 : 0;
            const coeffHimMois =
              totalHIMGlobalMois > 0 ? (himMois / totalHIMGlobalMois) * 100 : 0;
            const coeffNiAnnee =
              totalNIGlobalAnnee > 0 ? (niAnnee / totalNIGlobalAnnee) * 100 : 0;
            const coeffHimAnnee =
              totalHIMGlobalAnnee > 0
                ? (himAnnee / totalHIMGlobalAnnee) * 100
                : 0;

            const panneData = {
              panneId: panne.id,
              panneName: panne.name,
              niMois,
              niAnnee,
              himMois,
              himAnnee,
              coeffNiMois,
              coeffNiAnnee,
              coeffHimMois,
              coeffHimAnnee,
            };

            typepanneObj.pannes.push(panneData);

            // Ajouter aux totaux du type de panne
            typepanneObj.totalTypePanne.niMois += niMois;
            typepanneObj.totalTypePanne.niAnnee += niAnnee;
            typepanneObj.totalTypePanne.himMois += himMois;
            typepanneObj.totalTypePanne.himAnnee += himAnnee;
            typepanneObj.totalTypePanne.coeffNiMois += coeffNiMois;
            typepanneObj.totalTypePanne.coeffNiAnnee += coeffNiAnnee;
            typepanneObj.totalTypePanne.coeffHimMois += coeffHimMois;
            typepanneObj.totalTypePanne.coeffHimAnnee += coeffHimAnnee;
          }

          // Ajouter les totaux du type de panne au parc
          parcData.totalParc.niMois += typepanneObj.totalTypePanne.niMois;
          parcData.totalParc.niAnnee += typepanneObj.totalTypePanne.niAnnee;
          parcData.totalParc.himMois += typepanneObj.totalTypePanne.himMois;
          parcData.totalParc.himAnnee += typepanneObj.totalTypePanne.himAnnee;
          parcData.totalParc.coeffNiMois +=
            typepanneObj.totalTypePanne.coeffNiMois;
          parcData.totalParc.coeffNiAnnee +=
            typepanneObj.totalTypePanne.coeffNiAnnee;
          parcData.totalParc.coeffHimMois +=
            typepanneObj.totalTypePanne.coeffHimMois;
          parcData.totalParc.coeffHimAnnee +=
            typepanneObj.totalTypePanne.coeffHimAnnee;

          parcData.pannes.push(typepanneObj);
        }

        typeparcObj.parcs.push(parcData);

        // Ajouter aux totaux du type de parc
        typeparcObj.totalTypeParc.niMois += parcData.totalParc.niMois;
        typeparcObj.totalTypeParc.niAnnee += parcData.totalParc.niAnnee;
        typeparcObj.totalTypeParc.himMois += parcData.totalParc.himMois;
        typeparcObj.totalTypeParc.himAnnee += parcData.totalParc.himAnnee;
        typeparcObj.totalTypeParc.coeffNiMois += parcData.totalParc.coeffNiMois;
        typeparcObj.totalTypeParc.coeffNiAnnee +=
          parcData.totalParc.coeffNiAnnee;
        typeparcObj.totalTypeParc.coeffHimMois +=
          parcData.totalParc.coeffHimMois;
        typeparcObj.totalTypeParc.coeffHimAnnee +=
          parcData.totalParc.coeffHimAnnee;
      }

      result.push(typeparcObj);
    }

    return NextResponse.json(result, { status: HttpStatusCode.Ok });
  } catch (error: any) {
    console.error("Erreur API analyse-indisponibilite :", error);
    return NextResponse.json(
      { message: "Erreur serveur", details: error.message },
      { status: 500 }
    );
  }
}
