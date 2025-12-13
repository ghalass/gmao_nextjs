import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { HttpStatusCode } from "axios";

const ONE_DAY = 24 * 60 * 60 * 1000;

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function safeNumber(v: any) {
  if (v == null) return 0;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

function calculateFormulas(
  him: number,
  hrm: number,
  ni: number,
  nho: number,
  tp = 0,
  vs = 0
) {
  const HRD = nho - (him + hrm);
  const MTTR = ni === 0 ? 0 : him / ni;
  const SW = him === 0 ? 0 : ((tp + vs) / him) * 100;
  const DISP = nho === 0 ? 0 : (1 - him / nho) * 100;
  const TDM = nho === 0 ? 0 : (hrm / nho) * 100;
  const MTBF = ni === 0 ? 0 : hrm / ni;
  const UTIL = hrm + HRD === 0 ? 0 : (hrm / (hrm + HRD)) * 100;

  return {
    HRD,
    MTTR,
    SW,
    DISP,
    TDM,
    MTBF,
    UTIL,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mois, annee } = body; // MODIFICATION : accepter mois et annee

    if (!mois || !annee) {
      return NextResponse.json(
        { message: "Paramètres 'mois' et 'année' obligatoires" },
        { status: 400 }
      );
    }

    const year = parseInt(annee);
    const monthIndex = parseInt(mois) - 1; // mois est 1-12, convertir en 0-11

    if (isNaN(year) || isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
      return NextResponse.json(
        { message: "Mois ou année invalide" },
        { status: 400 }
      );
    }

    // Créer une date du premier jour du mois pour les calculs
    const dateCible = new Date(year, monthIndex, 1);

    // périodes
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

    const nho_m = daysInMonth(year, monthIndex) * 24;
    // jours écoulés dans l'année jusqu'à la fin du mois
    const joursEcoules =
      Math.floor((finMois.getTime() - debutAnnee.getTime()) / ONE_DAY) + 1;
    const nho_a = joursEcoules * 24;

    // Récupérer typeparcs, parcs et engins actifs
    const typeparcs = await prisma.typeparc.findMany({
      include: {
        parcs: {
          include: {
            engins: {
              where: { active: true },
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    // Fonction pour agréger him/hrm/ni/tp/vs pour un ensemble d'engins
    async function aggregateForEngins(
      enginIds: string[],
      start: Date,
      end: Date
    ) {
      if (!enginIds.length) return { him: 0, hrm: 0, ni: 0, tp: 0, vs: 0 };

      const [himAgg, hrmAgg, niCount] = await Promise.all([
        prisma.saisiehim.aggregate({
          _sum: { him: true },
          where: {
            saisiehrm: {
              du: { gte: start, lte: end },
              enginId: { in: enginIds },
            },
          },
        }),
        prisma.saisiehrm.aggregate({
          _sum: { hrm: true },
          where: {
            du: { gte: start, lte: end },
            enginId: { in: enginIds },
          },
        }),
        prisma.saisiehim.count({
          where: {
            saisiehrm: {
              du: { gte: start, lte: end },
              enginId: { in: enginIds },
            },
          },
        }),
      ]);

      return {
        him: safeNumber(himAgg._sum.him),
        hrm: safeNumber(hrmAgg._sum.hrm),
        ni: niCount,
      };
    }

    const result = [];

    for (const tp of typeparcs) {
      const typeparcObj: any = {
        typeParcId: tp.id,
        typeParcName: tp.name,
        parcs: [],
        totalTypeParc: {
          nbreEngins: 0,
          nhoMois: 0,
          nhoAnnee: 0,
          aggregatesMois: {
            him: 0,
            hrm: 0,
            ni: 0,
            tp: 0,
            vs: 0,
            hrd: 0,
            mttr: 0,
            sw: "0.00",
            disp: "0.00",
            tdm: "0.00",
            mtbf: 0,
            util: "0.00",
          },
          aggregatesAnnee: {
            him: 0,
            hrm: 0,
            ni: 0,
            tp: 0,
            vs: 0,
            hrd: 0,
            mttr: 0,
            sw: "0.00",
            disp: "0.00",
            tdm: "0.00",
            mtbf: 0,
            util: "0.00",
          },
        },
      };

      for (const parc of tp.parcs) {
        const enginIds = parc.engins.map((e: any) => e.id);
        if (!enginIds.length) continue;

        // Objectifs pour le parc
        const objectif = await prisma.objectif.findFirst({
          where: { annee: year, parcId: parc.id },
          select: { dispo: true, tdm: true },
        });

        const [aggM, aggA] = await Promise.all([
          aggregateForEngins(enginIds, debutMois, finMois),
          aggregateForEngins(enginIds, debutAnnee, finAnnee),
        ]);

        // Calculs pour le mois
        const formulasM = calculateFormulas(
          aggM.him,
          aggM.hrm,
          aggM.ni,
          nho_m * enginIds.length,
          aggM.tp,
          aggM.vs
        );

        // Calculs pour l'année
        const formulasA = calculateFormulas(
          aggA.him,
          aggA.hrm,
          aggA.ni,
          nho_a * enginIds.length,
          aggA.tp,
          aggA.vs
        );

        const parcData = {
          parcId: parc.id,
          parcName: parc.name,
          nbreEngins: enginIds.length,
          nhoMois: nho_m * enginIds.length,
          nhoAnnee: nho_a * enginIds.length,
          aggregatesMois: {
            him: aggM.him,
            hrm: aggM.hrm,
            ni: aggM.ni,
            tp: aggM.tp,
            vs: aggM.vs,
            hrd: formulasM.HRD,
            mttr: formulasM.MTTR,
            sw: formulasM.SW.toFixed(2),
            disp: formulasM.DISP.toFixed(2),
            tdm: formulasM.TDM.toFixed(2),
            mtbf: formulasM.MTBF,
            util: formulasM.UTIL.toFixed(2),
          },
          aggregatesAnnee: {
            him: aggA.him,
            hrm: aggA.hrm,
            ni: aggA.ni,
            tp: aggA.tp,
            vs: aggA.vs,
            hrd: formulasA.HRD,
            mttr: formulasA.MTTR,
            sw: formulasA.SW.toFixed(2),
            disp: formulasA.DISP.toFixed(2),
            tdm: formulasA.TDM.toFixed(2),
            mtbf: formulasA.MTBF,
            util: formulasA.UTIL.toFixed(2),
          },
          objectifDispo: objectif?.dispo ?? null,
          objectifUtil: objectif?.tdm ?? null,
        };

        typeparcObj.parcs.push(parcData);

        // Mettre à jour les totaux du type de parc
        typeparcObj.totalTypeParc.nbreEngins += enginIds.length;
        typeparcObj.totalTypeParc.nhoMois += nho_m * enginIds.length;
        typeparcObj.totalTypeParc.nhoAnnee += nho_a * enginIds.length;

        // Ajouter les valeurs mensuelles
        typeparcObj.totalTypeParc.aggregatesMois.him += aggM.him;
        typeparcObj.totalTypeParc.aggregatesMois.hrm += aggM.hrm;
        typeparcObj.totalTypeParc.aggregatesMois.ni += aggM.ni;
        typeparcObj.totalTypeParc.aggregatesMois.tp += aggM.tp;
        typeparcObj.totalTypeParc.aggregatesMois.vs += aggM.vs;

        // Ajouter les valeurs annuelles
        typeparcObj.totalTypeParc.aggregatesAnnee.him += aggA.him;
        typeparcObj.totalTypeParc.aggregatesAnnee.hrm += aggA.hrm;
        typeparcObj.totalTypeParc.aggregatesAnnee.ni += aggA.ni;
        typeparcObj.totalTypeParc.aggregatesAnnee.tp += aggA.tp;
        typeparcObj.totalTypeParc.aggregatesAnnee.vs += aggA.vs;
      }

      // Recalculer les indicateurs pour les totaux du type de parc
      if (typeparcObj.totalTypeParc.nbreEngins > 0) {
        const totalNhoMois = typeparcObj.totalTypeParc.nhoMois;
        const totalNhoAnnee = typeparcObj.totalTypeParc.nhoAnnee;

        const totalMois = typeparcObj.totalTypeParc.aggregatesMois;
        const totalAnnee = typeparcObj.totalTypeParc.aggregatesAnnee;

        const totalFormulasM = calculateFormulas(
          totalMois.him,
          totalMois.hrm,
          totalMois.ni,
          totalNhoMois,
          totalMois.tp,
          totalMois.vs
        );

        const totalFormulasA = calculateFormulas(
          totalAnnee.him,
          totalAnnee.hrm,
          totalAnnee.ni,
          totalNhoAnnee,
          totalAnnee.tp,
          totalAnnee.vs
        );

        // Mettre à jour les indicateurs calculés
        typeparcObj.totalTypeParc.aggregatesMois.hrd = totalFormulasM.HRD;
        typeparcObj.totalTypeParc.aggregatesMois.mttr = totalFormulasM.MTTR;
        typeparcObj.totalTypeParc.aggregatesMois.sw =
          totalFormulasM.SW.toFixed(2);
        typeparcObj.totalTypeParc.aggregatesMois.disp =
          totalFormulasM.DISP.toFixed(2);
        typeparcObj.totalTypeParc.aggregatesMois.tdm =
          totalFormulasM.TDM.toFixed(2);
        typeparcObj.totalTypeParc.aggregatesMois.mtbf = totalFormulasM.MTBF;
        typeparcObj.totalTypeParc.aggregatesMois.util =
          totalFormulasM.UTIL.toFixed(2);

        typeparcObj.totalTypeParc.aggregatesAnnee.hrd = totalFormulasA.HRD;
        typeparcObj.totalTypeParc.aggregatesAnnee.mttr = totalFormulasA.MTTR;
        typeparcObj.totalTypeParc.aggregatesAnnee.sw =
          totalFormulasA.SW.toFixed(2);
        typeparcObj.totalTypeParc.aggregatesAnnee.disp =
          totalFormulasA.DISP.toFixed(2);
        typeparcObj.totalTypeParc.aggregatesAnnee.tdm =
          totalFormulasA.TDM.toFixed(2);
        typeparcObj.totalTypeParc.aggregatesAnnee.mtbf = totalFormulasA.MTBF;
        typeparcObj.totalTypeParc.aggregatesAnnee.util =
          totalFormulasA.UTIL.toFixed(2);
      }

      result.push(typeparcObj);
    }

    return NextResponse.json(result, { status: HttpStatusCode.Ok });
  } catch (error: any) {
    console.error("Erreur API etat-mensuel :", error);
    return NextResponse.json(
      { message: "Erreur serveur", details: error.message },
      { status: 500 }
    );
  }
}
