// app/api/performances/[id]/route.ts - Version corrigée
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const performance = await prisma.saisiehrm.findUnique({
      where: { id },
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
            panne: {
              include: {
                typepanne: true, // ← CORRECTION: seulement typepanne
              },
            },
            // Vous pouvez aussi inclure l'engin via saisiehim si nécessaire
            engin: true,
            saisielubrifiant: {
              // ← CORRECTION: singulier comme dans votre schéma
              include: {
                lubrifiant: {
                  include: {
                    typelubrifiant: true,
                  },
                },
                typeconsommationlub: true,
              },
            },
          },
        },
      },
    });

    if (!performance) {
      return NextResponse.json(
        { error: "Performance non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(performance);
  } catch (error) {
    console.error("Erreur lors de la récupération de la performance:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la performance" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { du, enginId, siteId, hrm, saisiehims } = body;

    // Vérifier si la performance existe
    const existingPerformance = await prisma.saisiehrm.findUnique({
      where: { id },
      include: {
        saisiehim: {
          include: {
            saisielubrifiant: true, // ← CORRECTION: singulier
          },
        },
      },
    });

    if (!existingPerformance) {
      return NextResponse.json(
        { error: "Performance non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier si une autre saisie existe déjà pour cet engin à cette date
    const duplicateSaisie = await prisma.saisiehrm.findFirst({
      where: {
        du: new Date(du),
        enginId,
        id: { not: id },
      },
    });

    if (duplicateSaisie) {
      return NextResponse.json(
        { error: "Une autre saisie existe déjà pour cet engin à cette date" },
        { status: 400 }
      );
    }

    // Commencer une transaction pour gérer toutes les opérations
    const result = await prisma.$transaction(async (tx) => {
      // Mettre à jour la saisie HRM
      const updatedPerformance = await tx.saisiehrm.update({
        where: { id },
        data: {
          du: new Date(du),
          enginId,
          siteId,
          hrm: parseFloat(hrm),
        },
      });

      // Supprimer les anciennes saisies HIM et leurs lubrifiants
      if (existingPerformance.saisiehim.length > 0) {
        const himIds = existingPerformance.saisiehim.map((him) => him.id);

        // Supprimer d'abord les lubrifiants
        await tx.saisielubrifiant.deleteMany({
          where: {
            saisiehimId: { in: himIds },
          },
        });

        // Puis les HIM
        await tx.saisiehim.deleteMany({
          where: {
            saisiehrmId: id,
          },
        });
      }

      // Créer les nouvelles saisies HIM
      if (saisiehims && saisiehims.length > 0) {
        for (const him of saisiehims) {
          await tx.saisiehim.create({
            data: {
              panneId: him.panneId,
              him: parseFloat(him.him),
              ni: parseInt(him.ni),
              obs: him.obs,
              saisiehrmId: id,
              enginId: enginId,
              saisielubrifiant: {
                // ← CORRECTION: singulier
                create:
                  him.saisielubrifiants?.map((lub: any) => ({
                    lubrifiantId: lub.lubrifiantId,
                    qte: parseFloat(lub.qte),
                    obs: lub.obs,
                    typeconsommationlubId: lub.typeconsommationlubId || null,
                  })) || [],
              },
            },
          });
        }
      }

      // Récupérer la performance mise à jour avec toutes les relations
      return await tx.saisiehrm.findUnique({
        where: { id },
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
              panne: {
                include: {
                  typepanne: true, // ← CORRECTION: seulement typepanne
                },
              },
              // Vous pouvez aussi inclure l'engin via saisiehim si nécessaire
              engin: true,
              saisielubrifiant: {
                // ← CORRECTION: singulier
                include: {
                  lubrifiant: {
                    include: {
                      typelubrifiant: true,
                    },
                  },
                  typeconsommationlub: true,
                },
              },
            },
          },
        },
      });
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la performance:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la performance" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    // Vérifier si la performance existe
    const existingPerformance = await prisma.saisiehrm.findUnique({
      where: { id },
      include: {
        saisiehim: {
          include: {
            saisielubrifiant: true, // ← CORRECTION: singulier
          },
        },
      },
    });

    if (!existingPerformance) {
      return NextResponse.json(
        { error: "Performance non trouvée" },
        { status: 404 }
      );
    }

    // Supprimer la performance (les relations seront supprimées en cascade grâce à Prisma)
    await prisma.saisiehrm.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Performance supprimée avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de la performance:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la performance" },
      { status: 500 }
    );
  }
}
