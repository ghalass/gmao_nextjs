import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { HttpStatusCode } from "axios";

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

// Fonction pour calculer le NHO avec TOUS les engins du parc
function calculateNHO(
  enginsCount: number,
  startDate: Date,
  endDate: Date
): number {
  if (enginsCount === 0) return 0;

  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

  console.log(`NHO calcul: engins=${enginsCount}, jours=${diffDays}`);
  const nho = 24 * enginsCount * diffDays;
  console.log(`NHO résultat: ${nho} heures`);
  return nho;
}

// Fonction pour arrondir avec précision
function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
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
    const finAnneeCumul = finMois; // Cumul jusqu'à la fin du mois sélectionné

    const joursDansMois = daysInMonth(year, monthIndex);
    console.log(`Mois: ${mois}/${year}, Jours: ${joursDansMois}`);

    // Récupérer tous les typeparcs avec leurs parcs et engins
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

    // Récupérer les saisiehim pour les périodes
    const [saisiehimMois, saisiehimAnneeCumul] = await Promise.all([
      prisma.saisiehim.findMany({
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
          engin: {
            include: {
              parc: true,
            },
          },
          saisiehrm: true,
        },
      }),
      prisma.saisiehim.findMany({
        where: {
          saisiehrm: {
            du: {
              gte: debutAnnee,
              lte: finAnneeCumul,
            },
          },
          engin: {
            active: true,
          },
        },
        include: {
          panne: true,
          engin: {
            include: {
              parc: true,
            },
          },
          saisiehrm: true,
        },
      }),
    ]);

    const result = [];

    // Pour chaque type de parc
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
          nhoMois: 0,
          nhoAnnee: 0,
          indispMois: 0,
          indispAnnee: 0,
          coeffNiMois: 0,
          coeffNiAnnee: 0,
          coeffHimMois: 0,
          coeffHimAnnee: 0,
        },
      };

      // Pour chaque parc dans ce type
      for (const parc of tp.parcs) {
        const enginIds = parc.engins.map((e) => e.id);
        if (enginIds.length === 0) continue;

        // Calculer le NHO pour chaque période avec TOUS les engins
        const nbreEngins = enginIds.length;
        const nhoMois = calculateNHO(nbreEngins, debutMois, finMois);
        const nhoAnnee = calculateNHO(nbreEngins, debutAnnee, finAnneeCumul);

        console.log(`Parc ${parc.name}:`);
        console.log(`- Total engins: ${nbreEngins}`);
        console.log(`- NHO mois: ${nhoMois} heures`);
        console.log(`- Jours dans mois: ${joursDansMois}`);
        console.log(
          `- Calcul: 24h × ${nbreEngins} engins × ${joursDansMois} jours = ${nhoMois}`
        );

        const parcData: any = {
          parcId: parc.id,
          parcName: parc.name,
          nbreEnginsTotal: nbreEngins,
          nhoMois,
          nhoAnnee,
          pannes: [],
          totalParc: {
            niMois: 0,
            niAnnee: 0,
            himMois: 0,
            himAnnee: 0,
            indispMois: 0,
            indispAnnee: 0,
            coeffNiMois: 0,
            coeffNiAnnee: 0,
            coeffHimMois: 0,
            coeffHimAnnee: 0,
          },
        };

        // Grouper les pannes par typepanne
        const pannesByType = new Map();
        for (const panne of parc.pannes) {
          const typepanneId = panne.typepanneId;
          if (!pannesByType.has(typepanneId)) {
            pannesByType.set(typepanneId, {
              typepanneId,
              typepanneName: panne.typepanne?.name || "Sans type",
              pannes: [],
            });
          }
          pannesByType.get(typepanneId).pannes.push(panne);
        }

        // Variables pour les totaux du parc
        let totalNiMoisParc = 0;
        let totalHimMoisParc = 0;
        let totalNiAnneeParc = 0;
        let totalHimAnneeParc = 0;

        // Première passe : calculer les totaux du parc
        for (const [typepanneId, typepanneData] of pannesByType) {
          for (const panne of typepanneData.pannes) {
            // Totaux pour ce parc
            const himMoisParc = saisiehimMois
              .filter(
                (sh) => sh.panneId === panne.id && sh.engin.parcId === parc.id
              )
              .reduce((sum, sh) => sum + (sh.him || 0), 0);

            const himAnneeParc = saisiehimAnneeCumul
              .filter(
                (sh) => sh.panneId === panne.id && sh.engin.parcId === parc.id
              )
              .reduce((sum, sh) => sum + (sh.him || 0), 0);

            const niMoisParc = saisiehimMois
              .filter(
                (sh) => sh.panneId === panne.id && sh.engin.parcId === parc.id
              )
              .reduce((sum, sh) => sum + (sh.ni || 0), 0);

            const niAnneeParc = saisiehimAnneeCumul
              .filter(
                (sh) => sh.panneId === panne.id && sh.engin.parcId === parc.id
              )
              .reduce((sum, sh) => sum + (sh.ni || 0), 0);

            totalNiMoisParc += niMoisParc;
            totalHimMoisParc += himMoisParc;
            totalNiAnneeParc += niAnneeParc;
            totalHimAnneeParc += himAnneeParc;
          }
        }

        // Calculer l'indisponibilité du parc
        const indispMoisParc =
          nhoMois > 0 ? (totalHimMoisParc / nhoMois) * 100 : 0;
        const indispAnneeParc =
          nhoAnnee > 0 ? (totalHimAnneeParc / nhoAnnee) * 100 : 0;

        console.log(`- HIM total mois: ${totalHimMoisParc} heures`);
        console.log(`- Indisponibilité mois: ${indispMoisParc}%`);
        console.log(
          `- Vérification: (${totalHimMoisParc} / ${nhoMois}) * 100 = ${indispMoisParc}%`
        );

        // Deuxième passe : calculer les coefficients pour chaque panne
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

          for (const panne of typepanneData.pannes) {
            // Calculer les valeurs pour cette panne
            const himMoisPanne = saisiehimMois
              .filter(
                (sh) => sh.panneId === panne.id && sh.engin.parcId === parc.id
              )
              .reduce((sum, sh) => sum + (sh.him || 0), 0);

            const himAnneePanne = saisiehimAnneeCumul
              .filter(
                (sh) => sh.panneId === panne.id && sh.engin.parcId === parc.id
              )
              .reduce((sum, sh) => sum + (sh.him || 0), 0);

            const niMoisPanne = saisiehimMois
              .filter(
                (sh) => sh.panneId === panne.id && sh.engin.parcId === parc.id
              )
              .reduce((sum, sh) => sum + (sh.ni || 0), 0);

            const niAnneePanne = saisiehimAnneeCumul
              .filter(
                (sh) => sh.panneId === panne.id && sh.engin.parcId === parc.id
              )
              .reduce((sum, sh) => sum + (sh.ni || 0), 0);

            // Calculer les coefficients selon la formule
            // coeffNiMois = (NI_M_PANNE * INDISP_M_PARC) / NI_M_PARC
            const coeffNiMois =
              totalNiMoisParc > 0
                ? (niMoisPanne * indispMoisParc) / totalNiMoisParc
                : 0;

            // coeffHimMois = (HIM_M_PANNE * INDISP_M_PARC) / HIM_M_PARC
            const coeffHimMois =
              totalHimMoisParc > 0
                ? (himMoisPanne * indispMoisParc) / totalHimMoisParc
                : 0;

            // Pour le TOTAL du parc, vérifier que le coefficient égale l'indisponibilité
            if (
              panne.name.toUpperCase().includes("TOTAL") ||
              typepanneData.typepanneName.toUpperCase().includes("TOTAL")
            ) {
              console.log(`- Pour panne TOTAL ${panne.name}:`);
              console.log(
                `  HIM_PANNE=${himMoisPanne}, HIM_PARC=${totalHimMoisParc}`
              );
              console.log(
                `  coeffHimMois = (${himMoisPanne} × ${indispMoisParc}) / ${totalHimMoisParc}`
              );
              console.log(`  coeffHimMois calculé = ${coeffHimMois}%`);
              console.log(
                `  Vérification: coeffHimMois devrait égaler INDISP = ${indispMoisParc}%`
              );
            }

            const coeffNiAnnee =
              totalNiAnneeParc > 0
                ? (niAnneePanne * indispAnneeParc) / totalNiAnneeParc
                : 0;

            const coeffHimAnnee =
              totalHimAnneeParc > 0
                ? (himAnneePanne * indispAnneeParc) / totalHimAnneeParc
                : 0;

            const panneData = {
              panneId: panne.id,
              panneName: panne.name,
              niMois: roundToTwoDecimals(niMoisPanne),
              niAnnee: roundToTwoDecimals(niAnneePanne),
              himMois: roundToTwoDecimals(himMoisPanne),
              himAnnee: roundToTwoDecimals(himAnneePanne),
              coeffNiMois: roundToTwoDecimals(coeffNiMois),
              coeffNiAnnee: roundToTwoDecimals(coeffNiAnnee),
              coeffHimMois: roundToTwoDecimals(coeffHimMois),
              coeffHimAnnee: roundToTwoDecimals(coeffHimAnnee),
            };

            typepanneObj.pannes.push(panneData);

            // Mettre à jour les totaux du type de panne
            typepanneObj.totalTypePanne.niMois += niMoisPanne;
            typepanneObj.totalTypePanne.niAnnee += niAnneePanne;
            typepanneObj.totalTypePanne.himMois += himMoisPanne;
            typepanneObj.totalTypePanne.himAnnee += himAnneePanne;
            typepanneObj.totalTypePanne.coeffNiMois += coeffNiMois;
            typepanneObj.totalTypePanne.coeffNiAnnee += coeffNiAnnee;
            typepanneObj.totalTypePanne.coeffHimMois += coeffHimMois;
            typepanneObj.totalTypePanne.coeffHimAnnee += coeffHimAnnee;
          }

          // Arrondir les totaux du type de panne
          typepanneObj.totalTypePanne.niMois = roundToTwoDecimals(
            typepanneObj.totalTypePanne.niMois
          );
          typepanneObj.totalTypePanne.niAnnee = roundToTwoDecimals(
            typepanneObj.totalTypePanne.niAnnee
          );
          typepanneObj.totalTypePanne.himMois = roundToTwoDecimals(
            typepanneObj.totalTypePanne.himMois
          );
          typepanneObj.totalTypePanne.himAnnee = roundToTwoDecimals(
            typepanneObj.totalTypePanne.himAnnee
          );
          typepanneObj.totalTypePanne.coeffNiMois = roundToTwoDecimals(
            typepanneObj.totalTypePanne.coeffNiMois
          );
          typepanneObj.totalTypePanne.coeffNiAnnee = roundToTwoDecimals(
            typepanneObj.totalTypePanne.coeffNiAnnee
          );
          typepanneObj.totalTypePanne.coeffHimMois = roundToTwoDecimals(
            typepanneObj.totalTypePanne.coeffHimMois
          );
          typepanneObj.totalTypePanne.coeffHimAnnee = roundToTwoDecimals(
            typepanneObj.totalTypePanne.coeffHimAnnee
          );

          parcData.pannes.push(typepanneObj);
        }

        // Mettre à jour les totaux du parc
        parcData.totalParc.niMois = roundToTwoDecimals(totalNiMoisParc);
        parcData.totalParc.niAnnee = roundToTwoDecimals(totalNiAnneeParc);
        parcData.totalParc.himMois = roundToTwoDecimals(totalHimMoisParc);
        parcData.totalParc.himAnnee = roundToTwoDecimals(totalHimAnneeParc);
        parcData.totalParc.indispMois = roundToTwoDecimals(indispMoisParc);
        parcData.totalParc.indispAnnee = roundToTwoDecimals(indispAnneeParc);

        // Pour le TOTAL du parc, les coefficients doivent égaler l'indisponibilité
        parcData.totalParc.coeffNiMois = roundToTwoDecimals(indispMoisParc);
        parcData.totalParc.coeffHimMois = roundToTwoDecimals(indispMoisParc);
        parcData.totalParc.coeffNiAnnee = roundToTwoDecimals(indispAnneeParc);
        parcData.totalParc.coeffHimAnnee = roundToTwoDecimals(indispAnneeParc);

        console.log(
          `- TOTAL parc coeffHimMois: ${parcData.totalParc.coeffHimMois}% (doit être ${indispMoisParc}%)`
        );
        console.log(
          `- Vérification final: NHO=${nhoMois}, HIM=${totalHimMoisParc}, INDISP=${indispMoisParc}%`
        );

        // Créer une entrée "TOTAL" dans les pannes si elle n'existe pas
        const hasTotalPanne = parcData.pannes.some(
          (tp: any) =>
            tp.typepanneName.toUpperCase().includes("TOTAL") ||
            tp.pannes.some((p: any) =>
              p.panneName.toUpperCase().includes("TOTAL")
            )
        );

        if (!hasTotalPanne) {
          const totalPanneObj = {
            typepanneId: "total",
            typepanneName: "TOTAL",
            pannes: [
              {
                panneId: "total",
                panneName: "TOTAL",
                niMois: parcData.totalParc.niMois,
                niAnnee: parcData.totalParc.niAnnee,
                himMois: parcData.totalParc.himMois,
                himAnnee: parcData.totalParc.himAnnee,
                coeffNiMois: parcData.totalParc.coeffNiMois,
                coeffNiAnnee: parcData.totalParc.coeffNiAnnee,
                coeffHimMois: parcData.totalParc.coeffHimMois,
                coeffHimAnnee: parcData.totalParc.coeffHimAnnee,
              },
            ],
            totalTypePanne: {
              niMois: parcData.totalParc.niMois,
              niAnnee: parcData.totalParc.niAnnee,
              himMois: parcData.totalParc.himMois,
              himAnnee: parcData.totalParc.himAnnee,
              coeffNiMois: parcData.totalParc.coeffNiMois,
              coeffNiAnnee: parcData.totalParc.coeffNiAnnee,
              coeffHimMois: parcData.totalParc.coeffHimMois,
              coeffHimAnnee: parcData.totalParc.coeffHimAnnee,
            },
          };
          parcData.pannes.unshift(totalPanneObj);
        }

        typeparcObj.parcs.push(parcData);

        // Mettre à jour les totaux du type de parc
        typeparcObj.totalTypeParc.niMois += totalNiMoisParc;
        typeparcObj.totalTypeParc.niAnnee += totalNiAnneeParc;
        typeparcObj.totalTypeParc.himMois += totalHimMoisParc;
        typeparcObj.totalTypeParc.himAnnee += totalHimAnneeParc;
        typeparcObj.totalTypeParc.nhoMois += nhoMois;
        typeparcObj.totalTypeParc.nhoAnnee += nhoAnnee;
        typeparcObj.totalTypeParc.indispMois += indispMoisParc;
        typeparcObj.totalTypeParc.indispAnnee += indispAnneeParc;
      }

      // Arrondir les totaux du type de parc
      typeparcObj.totalTypeParc.niMois = roundToTwoDecimals(
        typeparcObj.totalTypeParc.niMois
      );
      typeparcObj.totalTypeParc.niAnnee = roundToTwoDecimals(
        typeparcObj.totalTypeParc.niAnnee
      );
      typeparcObj.totalTypeParc.himMois = roundToTwoDecimals(
        typeparcObj.totalTypeParc.himMois
      );
      typeparcObj.totalTypeParc.himAnnee = roundToTwoDecimals(
        typeparcObj.totalTypeParc.himAnnee
      );
      typeparcObj.totalTypeParc.nhoMois = roundToTwoDecimals(
        typeparcObj.totalTypeParc.nhoMois
      );
      typeparcObj.totalTypeParc.nhoAnnee = roundToTwoDecimals(
        typeparcObj.totalTypeParc.nhoAnnee
      );
      typeparcObj.totalTypeParc.indispMois = roundToTwoDecimals(
        typeparcObj.totalTypeParc.indispMois
      );
      typeparcObj.totalTypeParc.indispAnnee = roundToTwoDecimals(
        typeparcObj.totalTypeParc.indispAnnee
      );
      typeparcObj.totalTypeParc.coeffNiMois = roundToTwoDecimals(
        typeparcObj.totalTypeParc.indispMois
      );
      typeparcObj.totalTypeParc.coeffHimMois = roundToTwoDecimals(
        typeparcObj.totalTypeParc.indispMois
      );
      typeparcObj.totalTypeParc.coeffNiAnnee = roundToTwoDecimals(
        typeparcObj.totalTypeParc.indispAnnee
      );
      typeparcObj.totalTypeParc.coeffHimAnnee = roundToTwoDecimals(
        typeparcObj.totalTypeParc.indispAnnee
      );

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
