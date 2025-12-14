// app/api/import/services/importService.ts
import { convertField, isValidFormat } from "@/lib/convertField";
import { prisma } from "@/lib/prisma";
import { log } from "console";
import { format } from "date-fns";

enum SourceAnomalie {
  VS = "VS",
  VJ = "VJ",
  INSPECTION = "INSPECTION",
  AUTRE = "AUTRE",
}
// VS;VJ;INSPECTION;AUTRE

enum Priorite {
  ELEVEE = "ELEVEE",
  MOYENNE = "MOYENNE",
  FAIBLE = "FAIBLE",
}

enum StatutAnomalie {
  ATTENTE_PDR = "ATTENTE_PDR",
  PDR_PRET = "PDR_PRET",
  NON_PROGRAMMEE = "NON_PROGRAMMEE",
  PROGRAMMEE = "PROGRAMMEE",
  EXECUTE = "EXECUTE",
}

// ATTENTE_PDR;PDR_PRET;NON_PROGRAMMEE;PROGRAMMEE;EXECUTE

export class ImportService {
  async importData(sheetName: string, data: any) {
    try {
      switch (sheetName.toLowerCase()) {
        case "sites":
          return await this.importSites(data);
        case "typeparcs":
          return await this.importTypeParcs(data);
        case "parcs":
          return await this.importParcs(data);
        case "engins":
          return await this.importEngins(data);
        case "typepannes":
          return await this.importTypePannes(data);
        case "pannes":
          return await this.importPannes(data);
        case "users":
          return await this.importUsers(data);
        case "anomalies":
          return await this.importAnomalies(data);
        case "saisie_hrm":
          return await this.importSaisieHrm(data);
        case "saisie_hims":
          return await this.importSaisieHims(data);

        default:
          throw new Error(`Onglet non supporté: ${sheetName}`);
      }
    } catch (error) {
      console.error(`Erreur lors de l'import ${sheetName}:`, error);
      throw error;
    }
  }

  async importSaisieHims(data: any) {
    try {
      // console.log("##### ", data.enginName);

      const du = convertField(data.du, "date");
      const him = convertField(data.him, "number") ?? 0;
      const ni = convertField(data.ni, "number") ?? 0;
      const obs = convertField(data.obs, "string") ?? "";

      const enginName = convertField(data.enginName, "string");
      const panneName = convertField(data.panneName, "string");

      const originData = {
        du,
        enginName,
        panneName,
        him,
        ni,
        obs,
      };
      // console.log("###################################################");
      // console.log(originData);

      // VALIDATIONS
      if (!du)
        return [{ success: false, data, message: `Le champ 'du' est requis` }];
      if (!enginName?.trim())
        return [
          { success: false, data, message: `Le champ 'enginName' est requis` },
        ];
      if (!panneName?.trim())
        return [
          { success: false, data, message: `Le champ 'panneName' est requis` },
        ];
      if (him < 0 || him > 24)
        return [
          {
            success: false,
            data,
            message: `Le champ 'him' doit être entre 0 et 24`,
          },
        ];
      if (ni < 0)
        return [
          {
            success: false,
            data,
            message: `Le champ 'ni' ne doit pas être négatif`,
          },
        ];

      // FETCH ENGINS & PANNE
      const engin = await prisma.engin.findUnique({
        where: { name: enginName },
        include: { parc: true },
      });
      if (!engin) {
        return [
          { success: false, data, message: `Engin "${enginName}" non trouvé` },
        ];
      }
      const panne = await prisma.panne.findFirst({
        where: {
          name: panneName,
          parcs: {
            some: { name: engin.parc.name },
          },
        },
      });
      if (!panne) {
        return [
          {
            success: false,
            data,
            message: `La panne "${panneName}" pour "${engin.parc.name}" non trouvé`,
          },
        ];
      }
      let saisiehrm = await prisma.saisiehrm.findFirst({
        where: { du: du, enginId: engin.id },
      });
      if (!saisiehrm) {
        return [
          {
            success: false,
            data,
            message: `La saisiehrm 'saisiehrm' non trouvé`,
          },
        ];
      }

      const upsertData = {
        him,
        ni,
        obs,
        panne: { connect: { id: panne.id } },
        saisiehrm: { connect: { id: saisiehrm.id } },
        engin: { connect: { id: engin.id } },
      };

      const saisie = await prisma.saisiehim.upsert({
        where: {
          panneId_saisiehrmId: {
            panneId: panne.id,
            saisiehrmId: saisiehrm.id,
          },
        },
        update: upsertData, // Même structure
        create: upsertData, // Même structure
      });

      return [
        {
          success: true,
          // data: saisie,
          message: `SaisieHim importé avec succès`,
        },
      ];
    } catch (error: any) {
      console.error(error);
      return [{ success: false, data, message: `Erreur: ${error.message}` }];
    }
  }

  async importSaisieHrm(data: any) {
    try {
      const du = convertField(data.du, "date");
      const hrm = convertField(data.hrm, "number") ?? 0;
      const compteur = convertField(data.compteur, "number") ?? 0;

      // Relations
      const enginName = convertField(data.enginName, "string");
      const siteName = convertField(data.siteName, "string");

      if (!du) {
        return [
          {
            success: false,
            data: data,
            message: `Erreur: Le champ 'du' est requis`,
          },
        ];
      }
      if (!enginName || enginName.trim() === "") {
        return [
          {
            success: false,
            data: data,
            message: `Erreur: Le champ 'enginName' est requis`,
          },
        ];
      }
      if (!siteName || siteName.trim() === "") {
        return [
          {
            success: false,
            data: data,
            message: `Erreur: Le champ 'siteName' est requis`,
          },
        ];
      }
      if (hrm === null) {
        return [
          {
            success: false,
            data: data,
            message: `Erreur: Le champ 'hrm' est requis`,
          },
        ];
      }
      if (hrm > 24) {
        return [
          {
            success: false,
            data: data,
            message: `Erreur: Le champ 'hrm' ne doit pas dépasser 24`,
          },
        ];
      }
      if (hrm < 0) {
        return [
          {
            success: false,
            data: data,
            message: `Erreur: Le champ 'hrm' ne doit pas être positif`,
          },
        ];
      }

      if (compteur < 0) {
        return [
          {
            success: false,
            data: data,
            message: `Erreur: Le champ 'compteur' ne doit pas être positif`,
          },
        ];
      }

      const [engin, site] = await Promise.all([
        prisma.engin.findUnique({ where: { name: enginName } }),
        prisma.site.findUnique({ where: { name: siteName } }),
      ]);

      if (!engin) {
        return [
          {
            success: false,
            data: data,
            message: `Engin "${enginName}" non trouvé`,
          },
        ];
      }
      if (!site) {
        return [
          {
            success: false,
            data: data,
            message: `Site "${siteName}" non trouvé`,
          },
        ];
      }

      const saisie = await prisma.saisiehrm.upsert({
        where: {
          du_enginId: {
            // Utilisez le nom de la contrainte unique composée
            du: du,
            enginId: engin.id,
          },
        },
        update: {
          du: du,
          enginId: engin.id,
          siteId: site.id,
          hrm,
          compteur,
        },
        create: {
          du: du,
          enginId: engin.id,
          siteId: site.id,
          hrm,
          compteur,
        },
      });

      return [
        {
          success: true,
          data: saisie,
          message: `Saisie importé avec succès`,
        },
      ];
    } catch (error: any) {
      return [
        {
          success: false,
          // data: data,
          message: `Erreur: ${error.message}`,
        },
      ];
    }
  }

  async importSites(data: any) {
    try {
      const name = convertField(data.name, "string");

      if (!name || name.trim() === "") {
        return [
          {
            success: false,
            data: data,
            message: `Erreur: Le champ 'name' est requis`,
          },
        ];
      }

      const site = await prisma.site.upsert({
        where: { name: name },
        update: {
          name: name,
          updatedAt: new Date(),
        },
        create: {
          name: name,
        },
      });

      return [
        {
          success: true,
          data: site,
          message: `Site ${name} importé avec succès`,
        },
      ];
    } catch (error: any) {
      return [
        {
          success: false,
          data: data,
          message: `Erreur: ${error.message}`,
        },
      ];
    }
  }

  async importTypeParcs(data: any) {
    try {
      const name = convertField(data.name, "string");

      if (!name || name.trim() === "") {
        return [
          {
            success: false,
            data: data,
            message: `Erreur: Le champ 'name' est requis`,
          },
        ];
      }

      const typeParc = await prisma.typeparc.upsert({
        where: { name: name },
        update: {
          name: name,
          updatedAt: new Date(),
        },
        create: {
          name: name,
        },
      });

      return [
        {
          success: true,
          data: typeParc,
          message: `TypeParc ${name} importé avec succès`,
        },
      ];
    } catch (error: any) {
      return [
        {
          success: false,
          data: data,
          message: `Erreur: ${error.message}`,
        },
      ];
    }
  }

  async importTypePannes(data: any) {
    try {
      const name = convertField(data.name, "string");
      const description = convertField(data.description, "string") ?? "";

      if (!name || name.trim() === "") {
        return [
          {
            success: false,
            data: data,
            message: `Erreur: Le champ 'name' est requis`,
          },
        ];
      }

      const newData = {
        name,
        description,
      };

      const typepanne = await prisma.typepanne.upsert({
        where: { name: name },
        update: newData,
        create: newData,
      });

      return [
        {
          success: true,
          data: typepanne,
          message: `typepanne ${name} importé avec succès`,
        },
      ];
    } catch (error: any) {
      return [
        {
          success: false,
          data: data,
          message: `Erreur: ${error.message}`,
        },
      ];
    }
  }

  async importParcs(data: any) {
    try {
      const name = convertField(data.name, "string");
      const typeparcName = convertField(data.typeparcName, "string");

      if (!name || name.trim() === "") {
        return [
          {
            success: false,
            data: data,
            message: `Erreur: Le champ 'name' est requis`,
          },
        ];
      }
      if (!typeparcName) {
        return [
          {
            success: false,
            data: data,
            message: `Erreur: Le champ 'typeparcName' est requis`,
          },
        ];
      }

      const typeParc = await prisma.typeparc.findUnique({
        where: { name: typeparcName },
      });

      if (!typeParc) {
        return [
          {
            success: false,
            data: data,
            message: `TypeParc "${typeparcName}" non trouvé`,
          },
        ];
      }

      const parc = await prisma.parc.upsert({
        where: { name: name },
        update: {
          name: name,
          typeparcId: typeParc.id,
          updatedAt: new Date(),
        },
        create: {
          name: name,
          typeparcId: typeParc.id,
        },
      });

      return [
        {
          success: true,
          data: parc,
          message: `Parc ${name} importé avec succès`,
        },
      ];
    } catch (error: any) {
      return [
        {
          success: false,
          data: data,
          message: `Erreur: ${error.message}`,
        },
      ];
    }
  }

  async importPannes(data: any) {
    try {
      const name = convertField(data.name, "string");
      const description = convertField(data.description, "string");
      const typepanneName = convertField(data.typepanneName, "string");
      const parcName = convertField(data.parcName, "string");

      if (!name || name.trim() === "") {
        return [
          {
            success: false,
            data: data,
            message: `Erreur: Le champ 'name' est requis`,
          },
        ];
      }
      if (!description || description.trim() === "") {
        return [
          {
            success: false,
            data: data,
            message: `Erreur: Le champ 'description' est requis`,
          },
        ];
      }
      if (!typepanneName) {
        return [
          {
            success: false,
            data: data,
            message: `Erreur: Le champ 'typepanneName' est requis`,
          },
        ];
      }
      if (!parcName) {
        return [
          {
            success: false,
            data: data,
            message: `Erreur: Le champ 'parcName' est requis`,
          },
        ];
      }

      const [typepanne, parc] = await Promise.all([
        prisma.typepanne.findUnique({ where: { name: typepanneName } }),
        prisma.parc.findUnique({ where: { name: parcName } }),
      ]);

      if (!typepanne) {
        return [
          {
            success: false,
            data: data,
            message: `typepanne "${typepanneName}" non trouvé`,
          },
        ];
      }

      if (!parc) {
        return [
          {
            success: false,
            data: data,
            message: `parc "${parcName}" non trouvé`,
          },
        ];
      }

      const newData = {
        name: name,
        typepanneId: typepanne.id,
        parcId: parc.id,
        description: description,
      };
      // console.log(newData);

      // Créer ou mettre à jour la panne avec relation implicite
      const panne = await prisma.panne.upsert({
        where: { name: name },
        update: {
          description: description,
          typepanneId: typepanne.id,
          // Mettre à jour la relation avec le parc
          parcs: {
            connect: { id: parc.id },
          },
        },
        create: {
          name: name,
          description: description,
          typepanneId: typepanne.id,
          // Créer avec relation au parc
          parcs: {
            connect: { id: parc.id },
          },
        },
        // Inclure les relations pour voir le résultat
        include: {
          typepanne: true,
          parcs: true,
        },
      });

      return [
        {
          success: true,
          data: panne,
          message: `panne ${name} importé avec succès`,
        },
      ];
    } catch (error: any) {
      return [
        {
          success: false,
          data: data,
          message: `Erreur: ${error.message}`,
        },
      ];
    }
  }

  async importEngins(data: any) {
    try {
      const name = convertField(data.name, "string");
      const active = convertField(data.active, "boolean") ?? true;
      const initialHeureChassis =
        convertField(data.initialHeureChassis, "number") ?? 0;
      const parcName = convertField(data.parcName, "string");
      const siteName = convertField(data.siteName, "string");

      if (!name || name.trim() === "") {
        return [
          {
            success: false,
            data: data,
            message: `Erreur: Le champ 'name' est requis`,
          },
        ];
      }
      if (!parcName) {
        return [
          {
            success: false,
            data: data,
            message: `Erreur: Le champ 'parcName' est requis`,
          },
        ];
      }
      if (!siteName) {
        return [
          {
            success: false,
            data: data,
            message: `Erreur: Le champ 'siteName' est requis`,
          },
        ];
      }

      const [parc, site] = await Promise.all([
        prisma.parc.findUnique({ where: { name: parcName } }),
        prisma.site.findUnique({ where: { name: siteName } }),
      ]);

      if (!parc) {
        return [
          {
            success: false,
            data: data,
            message: `Parc "${parcName}" non trouvé`,
          },
        ];
      }
      if (!site) {
        return [
          {
            success: false,
            data: data,
            message: `Site "${siteName}" non trouvé`,
          },
        ];
      }

      const engin = await prisma.engin.upsert({
        where: { name: name },
        update: {
          name: name,
          active: active,
          parcId: parc.id,
          siteId: site.id,
          initialHeureChassis: initialHeureChassis,
          updatedAt: new Date(),
        },
        create: {
          name: name,
          active: active,
          parcId: parc.id,
          siteId: site.id,
          initialHeureChassis: initialHeureChassis,
        },
      });

      return [
        {
          success: true,
          data: engin,
          message: `Engin ${name} importé avec succès`,
        },
      ];
    } catch (error: any) {
      return [
        {
          success: false,
          data: data,
          message: `Erreur: ${error.message}`,
        },
      ];
    }
  }

  async importUsers(data: any) {
    try {
      const name = convertField(data.name, "string");
      const email = convertField(data.email, "string");
      const password = convertField(data.password, "string");
      const active = convertField(data.active, "boolean") ?? true;

      const requiredFields = {
        name: name,
        email: email,
        password: password,
      };

      for (const [field, value] of Object.entries(requiredFields)) {
        if (!value || value.trim() === "") {
          return [
            {
              success: false,
              data: data,
              message: `Erreur: Le champ '${field}' est requis`,
            },
          ];
        }
      }

      // Note: En production, hash le mot de passe
      const hashedPassword = password; // À remplacer par bcrypt.hash

      const user = await prisma.user.upsert({
        where: { email: email },
        update: {
          name: name,
          password: hashedPassword,
          active: active,
          updatedAt: new Date(),
        },
        create: {
          name: name,
          email: email,
          password: hashedPassword,
          active: active,
        },
      });

      return [
        {
          success: true,
          data: user,
          message: `User ${name} importé avec succès`,
        },
      ];
    } catch (error: any) {
      return [
        {
          success: false,
          data: data,
          message: `Erreur: ${error.message}`,
        },
      ];
    }
  }

  async importAnomalies(data: any) {
    try {
      const numeroBacklog = convertField(data.numeroBacklog, "string");
      const dateDetection = convertField(data.dateDetection, "date");
      const description = convertField(data.description, "string");
      const source: SourceAnomalie = convertField(data.source, "string");
      const priorite: Priorite = convertField(data.priorite, "string");
      const besoinPDR = convertField(data.besoinPDR, "boolean") ?? false;
      const quantite = convertField(data.quantite, "int") ?? 0; // optionnel
      const reference = convertField(data.reference, "string") ?? ""; // optionnel
      const code = convertField(data.code, "string") ?? ""; // optionnel
      const stock = convertField(data.stock, "string") ?? ""; // optionnel
      const numeroBS = convertField(data.numeroBS, "string") ?? ""; // optionnel
      const programmation = convertField(data.programmation, "string") ?? ""; // optionnel
      const sortiePDR = convertField(data.sortiePDR, "string") ?? ""; // optionnel
      const equipe = convertField(data.equipe, "string") ?? ""; // optionnel
      const statut: StatutAnomalie = convertField(data.statut, "string");
      const dateExecution = convertField(data.dateExecution, "date"); // optionnel
      const confirmation = convertField(data.confirmation, "string") ?? ""; // optionnel
      const observations = convertField(data.observations, "string") ?? ""; // optionnel
      // Relations
      const enginName = convertField(data.enginName, "string");
      const siteName = convertField(data.siteName, "string");

      if (!numeroBacklog || numeroBacklog.trim() === "") {
        return [
          {
            success: false,
            data: data,
            message: `Erreur: Le champ 'numeroBacklog' est requis`,
          },
        ];
      }
      // exemple: TO14-25-001
      if (!isValidFormat(numeroBacklog)) {
        return [
          {
            success: false,
            data: data,
            message: `Le numéro de backlog "${numeroBacklog}" ne respecte pas le format attendu. Format: XXXX-XX-XXXX... (1-10 lettres, 2 chiffres, 1+ chiffres), exemple TO14-25-001`,
          },
        ];
      }
      if (!dateDetection) {
        return [
          {
            success: false,
            data: data,
            message: `Erreur: Le champ 'dateDetection' est requis`,
          },
        ];
      }
      if (!description || description.trim() === "") {
        return [
          {
            success: false,
            data: data,
            message: `Erreur: Le champ 'description' est requis`,
          },
        ];
      }
      if (!enginName || enginName.trim() === "") {
        return [
          {
            success: false,
            data: data,
            message: `Erreur: Le champ 'enginName' est requis`,
          },
        ];
      }
      if (!siteName || siteName.trim() === "") {
        return [
          {
            success: false,
            data: data,
            message: `Erreur: Le champ 'siteName' est requis`,
          },
        ];
      }
      //
      if (
        !source ||
        !Object.values(SourceAnomalie).includes(source as SourceAnomalie)
      ) {
        return [
          {
            success: false,
            data: data,
            message: `Erreur: Le champ 'source' est requis et doit être une valeur valide (VS, VJ, INSPECTION, AUTRE)`,
          },
        ];
      }
      if (
        !priorite ||
        !Object.values(Priorite).includes(priorite as Priorite)
      ) {
        return [
          {
            success: false,
            data: data,
            message: `Erreur: Le champ 'priorite' est requis et doit être une valeur valide (ELEVEE, MOYENNE, FAIBLE)`,
          },
        ];
      }
      if (
        !statut ||
        !Object.values(StatutAnomalie).includes(statut as StatutAnomalie)
      ) {
        return [
          {
            success: false,
            data: data,
            message: `Erreur: Le champ 'statut' est requis et doit être une valeur valide (ATTENTE_PDR, PDR_PRET, NON_PROGRAMMEE, PROGRAMMEE, EXECUTE)`,
          },
        ];
      }

      const [engin, site] = await Promise.all([
        prisma.engin.findUnique({ where: { name: enginName } }),
        prisma.site.findUnique({ where: { name: siteName } }),
      ]);

      if (!engin) {
        return [
          {
            success: false,
            data: data,
            message: `Engin "${enginName}" non trouvé`,
          },
        ];
      }
      if (!site) {
        return [
          {
            success: false,
            data: data,
            message: `Site "${siteName}" non trouvé`,
          },
        ];
      }

      const backlog = await prisma.anomalie.upsert({
        where: { numeroBacklog: numeroBacklog },
        update: {
          numeroBacklog: numeroBacklog,
          dateDetection: dateDetection,
          description: description,
          source: source,
          priorite: priorite,
          besoinPDR: besoinPDR,
          quantite: quantite,
          reference: reference,
          code: code,
          stock: stock,
          numeroBS: numeroBS,
          programmation: programmation,
          sortiePDR: sortiePDR,
          equipe: equipe,
          statut: statut,
          dateExecution: dateExecution,
          confirmation: confirmation,
          observations: observations,
          enginId: engin.id,
          siteId: site.id,
        },
        create: {
          numeroBacklog: numeroBacklog,
          dateDetection: dateDetection,
          description: description,
          source: source,
          priorite: priorite,
          besoinPDR: besoinPDR,
          quantite: quantite,
          reference: reference,
          code: code,
          stock: stock,
          numeroBS: numeroBS,
          programmation: programmation,
          sortiePDR: sortiePDR,
          equipe: equipe,
          statut: statut,
          dateExecution: dateExecution,
          confirmation: confirmation,
          observations: observations,
          enginId: engin.id,
          siteId: site.id,
        },
      });

      return [
        {
          success: true,
          data: backlog,
          message: `Backlog ${numeroBacklog} importé avec succès`,
        },
      ];
    } catch (error: any) {
      return [
        {
          success: false,
          data: data,
          message: `Erreur: ${error.message}`,
        },
      ];
    }
  }
}
