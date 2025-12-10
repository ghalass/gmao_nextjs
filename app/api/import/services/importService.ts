// app/api/import/services/importService.ts
import { convertField, isValidFormat } from "@/lib/convertField";
import { prisma } from "@/lib/prisma";

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
        // return await this.importTypePannes(data);
        case "pannes":
        // return await this.importPannes(data);
        case "typelubrifiants":
        // return await this.importTypeLubrifiants(data);
        case "lubrifiants":
        // return await this.importLubrifiants(data);
        case "typeconsommationlub":
        // return await this.importTypeConsommationLub(data);
        case "saisiehrm":
        // return await this.importSaisieHRM(data);
        case "saisiehim":
        // return await this.importSaisieHIM(data);
        case "saisielubrifiant":
        // return await this.importSaisieLubrifiant(data);
        case "objectifs":
        // return await this.importObjectifs(data);
        case "roles":
        // return await this.importRoles(data);
        case "users":
          return await this.importUsers(data);
        case "anomalies":
          return await this.importAnomalies(data);
        default:
          throw new Error(`Onglet non supporté: ${sheetName}`);
      }
    } catch (error) {
      console.error(`Erreur lors de l'import ${sheetName}:`, error);
      throw error;
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

  // ... Ajouter les autres méthodes similaires (typepannes, pannes, etc.)

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
      const besoinPDR = convertField(data.besoinPDR, "boolean") || false;
      const quantite = convertField(data.quantite, "int") || 0; // optionnel
      const reference = convertField(data.reference, "string") || ""; // optionnel
      const code = convertField(data.code, "string") || ""; // optionnel
      const stock = convertField(data.stock, "string") || ""; // optionnel
      const numeroBS = convertField(data.numeroBS, "string") || ""; // optionnel
      const programmation = convertField(data.programmation, "string") || ""; // optionnel
      const sortiePDR = convertField(data.sortiePDR, "string") || ""; // optionnel
      const equipe = convertField(data.equipe, "string") || ""; // optionnel
      const statut: StatutAnomalie = convertField(data.statut, "string");
      const dateExecution = convertField(data.dateExecution, "date"); // optionnel
      const confirmation = convertField(data.confirmation, "string") || ""; // optionnel
      const observations = convertField(data.observations, "string") || ""; // optionnel
      // Relations
      const enginName = convertField(data.enginName, "string");
      const siteName = convertField(data.siteName, "string");

      // if (data.numeroBacklog === "TO14-25-374") {
      //   console.log(`data.equipe:`, data.equipe);
      //   console.log(`equipe:`, equipe);
      // }

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

      await prisma.anomalie.upsert({
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
          data: engin,
          message: `Engin ${numeroBacklog} importé avec succès`,
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
