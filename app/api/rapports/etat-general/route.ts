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

    // Périodes
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

    // Récupérer tous les types de parcs avec leurs parcs et engins actifs
    const typeParcs = await prisma.typeparc.findMany({
      include: {
        parcs: {
          include: {
            engins: {
              where: { active: true },
              include: {
                site: true,
                saisiehrm: {
                  where: {
                    du: {
                      gte: debutMois,
                      lte: finMois,
                    },
                  },
                  select: {
                    hrm: true,
                    saisiehim: {
                      select: {
                        him: true,
                      },
                    },
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
        totalTypeParc: {
          nombreEngins: 0,
          totalHRMMois: 0,
          totalHeureChassisMois: 0,
        },
      };

      // Pour chaque parc
      for (const parc of typeParc.parcs) {
        if (parc.engins.length === 0) continue;

        const parcObj: any = {
          parcId: parc.id,
          parcName: parc.name,
          typeParcId: typeParc.id,
          typeParcName: typeParc.name,
          engins: [],
          totalParc: {
            nombreEngins: 0,
            totalHRMMois: 0,
            totalHeureChassisMois: 0,
          },
        };

        // Pour chaque engin dans le parc
        for (const engin of parc.engins) {
          // Calculer HRM du mois
          const hrmMois = engin.saisiehrm.reduce(
            (sum, saisie) => sum + safeNumber(saisie.hrm),
            0
          );

          // Calculer heures chassis du mois (somme des HIM)
          const heureChassisMois = engin.saisiehrm.reduce((sum, saisie) => {
            const himTotal = saisie.saisiehim.reduce(
              (himSum, him) => himSum + safeNumber(him.him),
              0
            );
            return sum + himTotal;
          }, 0);

          // Heures chassis total (initial + mois)
          const totalHeureChassis =
            safeNumber(engin.initialHeureChassis) + heureChassisMois;

          const enginData = {
            enginId: engin.id,
            enginName: engin.name,
            siteName: engin.site.name,
            parcName: parc.name,
            typeParcName: typeParc.name,
            initialHeureChassis: safeNumber(engin.initialHeureChassis),
            hrmMois,
            heureChassisMois,
            totalHeureChassis,
          };

          parcObj.engins.push(enginData);

          // Mettre à jour les totaux du parc
          parcObj.totalParc.nombreEngins += 1;
          parcObj.totalParc.totalHRMMois += hrmMois;
          parcObj.totalParc.totalHeureChassisMois += heureChassisMois;
        }

        // Ajouter le parc seulement s'il a des engins
        if (parcObj.engins.length > 0) {
          typeParcObj.parcs.push(parcObj);

          // Mettre à jour les totaux du type de parc
          typeParcObj.totalTypeParc.nombreEngins +=
            parcObj.totalParc.nombreEngins;
          typeParcObj.totalTypeParc.totalHRMMois +=
            parcObj.totalParc.totalHRMMois;
          typeParcObj.totalTypeParc.totalHeureChassisMois +=
            parcObj.totalParc.totalHeureChassisMois;
        }
      }

      // Ajouter le type de parc seulement s'il a des parcs avec engins
      if (typeParcObj.parcs.length > 0) {
        result.push(typeParcObj);
      }
    }

    // Extraire tous les noms de parcs uniques
    const allParcs = result.flatMap((typeParc) =>
      typeParc.parcs.map((parc: any) => parc.parcName)
    );

    return NextResponse.json(
      {
        data: result,
        sites: sites.map((s) => s.name),
        parcs: [...new Set(allParcs)],
      },
      { status: HttpStatusCode.Ok }
    );
  } catch (error: any) {
    console.error("Erreur API état-général :", error);
    return NextResponse.json(
      { message: "Erreur serveur", details: error.message },
      { status: 500 }
    );
  }
}
