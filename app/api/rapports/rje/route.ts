import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { HttpStatusCode } from "axios"; // ou remplace par ton enum perso

// Helpers de dates
const ONE_DAY = 24 * 60 * 60 * 1000;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { du } = body;

    if (!du) {
      return NextResponse.json(
        { message: "Paramètre 'du' obligatoire (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const dateCible = new Date(du);

    // ---------- CALCUL DES PÉRIODES ----------
    const debutMois = new Date(
      dateCible.getFullYear(),
      dateCible.getMonth(),
      1
    );
    const debutAnnee = new Date(dateCible.getFullYear(), 0, 1);

    const finJournee = new Date(dateCible.getTime() + ONE_DAY);

    const nho_j = 24;
    const nho_m = dateCible.getDate() * 24;

    const joursEcoules =
      Math.floor((dateCible.getTime() - debutAnnee.getTime()) / ONE_DAY) + 1;
    const nho_a = joursEcoules * 24;

    // ---------- FONCTION DE RÉCUPÉRATION DES AGRÉGATS ----------
    const getHimHrmNi = async (
      enginId: string,
      startDate: Date,
      endDate: Date
    ) => {
      const him = await prisma.saisiehim.aggregate({
        _sum: { him: true },
        where: {
          saisiehrm: {
            du: { gte: startDate, lte: endDate },
            enginId: enginId,
          },
        },
      });

      const hrm = await prisma.saisiehrm.aggregate({
        _sum: { hrm: true },
        where: {
          du: { gte: startDate, lte: endDate },
          enginId: enginId,
        },
      });

      const ni = await prisma.saisiehim.count({
        where: {
          saisiehrm: {
            du: { gte: startDate, lte: endDate },
            enginId: enginId,
          },
        },
      });

      return {
        him: him._sum.him || 0,
        hrm: hrm._sum.hrm || 0,
        ni: ni || 0,
      };
    };

    // ---------- FORMULES ----------
    const calculateIndicators = (
      him: number,
      hrm: number,
      ni: number,
      nho: number
    ) => {
      const dispo = ((1 - him / nho) * 100).toFixed(2);
      const mtbf = ni === 0 ? "0.00" : (hrm / ni).toFixed(2);
      const tdm = ((100 * hrm) / nho).toFixed(2);
      return { dispo, mtbf, tdm };
    };

    // ---------- LISTE DES ENGINS ----------
    const engins = await prisma.engin.findMany({
      where: {
        saisiehrm: { some: {} },
      },
      select: {
        id: true,
        name: true,
      },
      distinct: ["name"],
    });

    // ---------- CALCUL COMPLET ENGINE PAR ENGINE ----------
    const finalData = await Promise.all(
      engins.map(async (engin) => {
        const enginDetails = await prisma.engin.findUnique({
          where: { id: engin.id },
          select: {
            parcId: true,
            parc: { select: { name: true } },
          },
        });

        // Trouver le site basé sur la saisie du jour
        const saisieJour = await prisma.saisiehrm.findFirst({
          where: {
            enginId: engin.id,
            du: dateCible,
          },
          select: {
            siteId: true,
            site: { select: { name: true } },
          },
        });

        const siteId = saisieJour?.siteId ?? null;
        const siteName = saisieJour?.site?.name ?? null;
        const annee = dateCible.getFullYear();

        // Objectifs
        const objectif = siteId
          ? await prisma.objectif.findUnique({
              where: {
                annee_parcId_siteId: {
                  annee,
                  parcId: enginDetails?.parcId ?? "",
                  siteId: siteId,
                },
              },
              select: {
                dispo: true,
                mtbf: true,
                tdm: true,
              },
            })
          : null;

        const [dataJ, dataM, dataA] = await Promise.all([
          getHimHrmNi(engin.id, dateCible, finJournee),
          getHimHrmNi(engin.id, debutMois, dateCible),
          getHimHrmNi(engin.id, debutAnnee, dateCible),
        ]);

        const indicatorsJ = calculateIndicators(
          dataJ.him,
          dataJ.hrm,
          dataJ.ni,
          nho_j
        );
        const indicatorsM = calculateIndicators(
          dataM.him,
          dataM.hrm,
          dataM.ni,
          nho_m
        );
        const indicatorsA = calculateIndicators(
          dataA.him,
          dataA.hrm,
          dataA.ni,
          nho_a
        );

        return {
          engin: engin.name,
          parcId: enginDetails?.parcId,
          parcName: enginDetails?.parc?.name ?? null,
          siteId,
          siteName,
          annee,

          objectif_dispo: objectif?.dispo ?? null,
          objectif_mtbf: objectif?.mtbf ?? null,
          objectif_tdm: objectif?.tdm ?? null,

          // JOUR
          nho_j,
          dispo_j: indicatorsJ.dispo,
          mtbf_j: indicatorsJ.mtbf,
          tdm_j: indicatorsJ.tdm,
          him_j: dataJ.him,
          hrm_j: dataJ.hrm,
          ni_j: dataJ.ni,

          // MOIS
          nho_m,
          dispo_m: indicatorsM.dispo,
          mtbf_m: indicatorsM.mtbf,
          tdm_m: indicatorsM.tdm,
          him_m: dataM.him,
          hrm_m: dataM.hrm,
          ni_m: dataM.ni,

          // ANNEE
          nho_a,
          dispo_a: indicatorsA.dispo,
          mtbf_a: indicatorsA.mtbf,
          tdm_a: indicatorsA.tdm,
          him_a: dataA.him,
          hrm_a: dataA.hrm,
          ni_a: dataA.ni,
        };
      })
    );

    return NextResponse.json(finalData, { status: HttpStatusCode.Ok });
  } catch (error: any) {
    console.error("Erreur API rapport RJE :", error);
    return NextResponse.json(
      { message: "Erreur serveur", details: error.message },
      { status: 500 }
    );
  }
}
