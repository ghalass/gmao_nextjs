// app/api/import/services/importService.ts
import { convertField, isValidFormat } from "@/lib/convertField";
import { ACTION } from "@/lib/enums";
import { prisma } from "@/lib/prisma";

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

        // GESTION DES USERS & ROLES
        case "users":
          return await this.importUsers(data);
        case "permissions":
          return await this.importPermissions(data);
        case "roles":
          return await this.importRoles(data);

        // GESTION DES ANOMALIES
        case "anomalies":
          return await this.importAnomalies(data);

        // SAISIE HRM & HIMS
        case "saisie_hrm":
          return await this.importSaisieHrm(data);
        case "saisie_hims":
          return await this.importSaisieHims(data);

        // GESTION DES ORGANEs & MOUVEMENTS
        case "type_organe":
          return await this.importTypeOrganes(data);
        case "organe":
          return await this.importOrganes(data);
        case "mvt_organe":
          return await this.importMvtOrgane(data);

        //
        default:
          throw new Error(`Onglet non supporté: ${sheetName}`);
      }
    } catch (error) {
      console.error(`Erreur lors de l'import ${sheetName}:`, error);
      throw error;
    }
  }

  // LES FONCTIONS D'IMPORTS SPÉCIFIQUES
  //
  async importMvtOrgane(data: any) {
    try {
      const organeName = convertField(data.organe, "string");
      const enginName = convertField(data.engin, "string");
      const date_mvt = convertField(data.date_mvt, "date");
      const type_mvt: TypeMouvementOrgane = convertField(
        data.type_mvt,
        "string"
      );
      const cause = convertField(data.cause, "string");
      const type_cause: TypeCauseMouvementOrgane = convertField(
        data.type_cause,
        "string"
      );
      const obs = convertField(data.obs, "string");

      const requiredFields = {
        organe: organeName,
        enginName: enginName,
        type_mvt: type_mvt,
        cause: cause,
        type_cause: type_cause,
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

      if (
        !type_mvt ||
        !Object.values(TypeMouvementOrgane).includes(
          type_mvt as TypeMouvementOrgane
        )
      ) {
        return [
          {
            success: false,
            data: data,
            message: `Erreur: Le champ 'type_mvt' est requis et doit être une valeur valide (POSE, DEPOSE)`,
          },
        ];
      }
      if (
        !type_cause ||
        !Object.values(TypeCauseMouvementOrgane).includes(
          type_cause as TypeCauseMouvementOrgane
        )
      ) {
        return [
          {
            success: false,
            data: data,
            message: `Erreur: Le champ 'type_cause' est requis et doit être une valeur valide (PREVENTIF, INCIDENT)`,
          },
        ];
      }

      if (!date_mvt) {
        return [
          {
            success: false,
            data: data,
            message: `Erreur: Le champ 'date_mvt' est requis`,
          },
        ];
      }

      const engin = await prisma.engin.findUnique({
        where: { name: enginName },
      });

      const organe = await prisma.organe.findFirst({
        where: {
          name: organeName, // Cherche par nom d'organe (pas engin)
          type_organe: {
            parcs: {
              some: {
                id: engin?.parcId, // Vérifie que le type d'organe est associé à ce parc
              },
            },
          },
        },
        include: {
          type_organe: true,
        },
      });

      if (!organe) {
        return [
          {
            success: false,
            data: data,
            message: `organe "${organeName}" non trouvé`,
          },
        ];
      }

      const newData = {
        organeId: organe.id,
        enginId: engin?.id!,
        date_mvt,
        type_mvt,
        cause,
        type_cause,
        obs,
      };

      const saisie = await prisma.mvtOrgane.upsert({
        where: {
          organeId_enginId_date_mvt_type_mvt: {
            organeId: organe.id,
            enginId: engin?.id!,
            date_mvt: date_mvt,
            type_mvt: type_mvt,
          },
        },
        update: newData,
        create: newData,
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
          data: data,
          message: `Erreur: ${error.message}`,
        },
      ];
    }
  }

  async importOrganes(data: any) {
    try {
      const name = convertField(data.name, "string");
      const type_organe = convertField(data.type_organe, "string");
      const date_mes = convertField(data.date_mes, "date");
      const marque = convertField(data.marque, "string");
      const sn = convertField(data.sn, "string");
      const origine: OrigineOrgane =
        convertField(data.origine, "string") || null;
      const circuit = convertField(data.circuit, "string");
      const hrm_initial = convertField(data.hrm_initial, "number") || 0;
      const obs = convertField(data.obs, "string");

      const requiredFields = {
        name: name,
        type_organe: type_organe,
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
      // console.log(`typeof origine:`, typeof origine, origine);

      // if (
      //   !origine ||
      //   !Object.values(OrigineOrgane).includes(origine as OrigineOrgane)
      // ) {
      //   return [
      //     {
      //       success: false,
      //       data: data,
      //       message: `Erreur: Le champ 'origine' est requis et doit être une valeur valide (BRC, APPRO, AUTRE)`,
      //     },
      //   ];
      // }

      const typeOrgane = await prisma.typeOrgane.findUnique({
        where: { name: type_organe },
      });

      if (!typeOrgane) {
        return [
          {
            success: false,
            data: data,
            message: `TypeOrgane "${type_organe}" non trouvé`,
          },
        ];
      }

      const newData = {
        name,
        typeOrganeId: typeOrgane.id,
        date_mes,
        marque,
        sn,
        origine,
        circuit,
        hrm_initial,
        obs,
      };

      const organe = await prisma.organe.upsert({
        where: {
          name_typeOrganeId: { name: name, typeOrganeId: typeOrgane.id },
        },
        update: newData,
        create: newData,
      });

      return [
        {
          success: true,
          data: organe,
          message: `Organe ${name} importé avec succès`,
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

  async importTypeOrganes(data: any) {
    try {
      const name = convertField(data.name, "string");
      const parcsString = convertField(data.parcs, "string").trim(); // PARCs séparés par des virgules;
      if (!name || name.trim() === "") {
        return [
          {
            success: false,
            data: data,
            message: `Erreur: Le champ 'name' est requis`,
          },
        ];
      }

      let parcsConnect: { id: string }[] = [];

      if (parcsString && parcsString.trim() !== "") {
        const parcsArray = parcsString
          .split(",")
          .map((name: string) => name.trim());

        // Vérifier l'existence des parcs PAR LEUR NOM
        const existingParcs = await prisma.parc.findMany({
          where: { name: { in: parcsArray } },
          select: { id: true, name: true },
        });

        // Créer un tableau des noms trouvés
        const foundNames = existingParcs.map((p) => p.name);

        // Trouver les noms manquants
        const missingNames = parcsArray.filter(
          (name: string) => !foundNames.includes(name)
        );

        // Si des parcs n'existent pas, retourner une erreur
        if (missingNames.length > 0) {
          return [
            {
              success: false,
              data: data,
              message: `Erreur: Les parcs suivants n'existent pas : ${missingNames.join(
                ", "
              )}`,
            },
          ];
        }

        // Préparer le tableau de connexion avec les IDs
        parcsConnect = existingParcs.map((p) => ({ id: p.id }));
      }

      // Utilisation de upsert avec gestion des relations
      const typeOrgane = await prisma.typeOrgane.upsert({
        where: { name: name },
        update: {
          name: name,
          parcs: {
            set: parcsConnect, // Remplace toutes les relations existantes
          },
        },
        create: {
          name: name,
          parcs: {
            connect: parcsConnect,
          },
        },
        include: {
          parcs: true,
        },
      });

      return [
        {
          success: true,
          data: typeOrgane,
          message: `typeOrgane ${name} ajouté/modifié avec succès.`,
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

  // SAISIE HIMS & HRM
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

  // DONNEES DE BASE
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

  // GESTION DES USERS & ROLES
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
  async importPermissions(data: any) {
    try {
      const name = convertField(data.name, "string");
      const resource = convertField(data.resource, "string");
      const action: ACTION = convertField(data.action, "string");
      const description = convertField(data.description, "string");

      const requiredFields = {
        name: name,
        resource: resource,
        action: action,
        description: description,
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

      if (!action || !Object.values(ACTION).includes(action as ACTION)) {
        return [
          {
            success: false,
            data: data,
            message: `Erreur: Le champ 'action' est requis et doit être une valeur valide (create, read, update, delete)`,
          },
        ];
      }

      const newData = {
        name: name.toLowerCase(),
        action: action,
        description,
        resource: resource.toLowerCase(),
      };

      const result = await prisma.permission.upsert({
        where: { name: name },
        update: newData,
        create: newData,
      });

      return [
        {
          success: true,
          data: result,
          message: `Permission ${name} importé avec succès`,
        },
      ];
    } catch (error: any) {
      console.log(error);

      return [
        {
          success: false,
          data: data,
          message: `Erreur: ${error.message}`,
        },
      ];
    }
  }
  async importRoles(data: any) {
    try {
      const name = convertField(data.name, "string")?.trim().toLowerCase();
      const description = convertField(data.description, "string");
      const permissions = convertField(data.permissions, "string")
        .trim()
        .toLowerCase(); // NAMESs séparés par des virgules

      const requiredFields = {
        name: name,
        description: description,
        permissions: permissions,
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

      // Extraction des NAMESs
      const permissionNames = permissions
        .split(",")
        .map((name: string) => name.trim())
        .filter(Boolean);

      // Vérifier que les permissions existent
      const existingPermissions = await prisma.permission.findMany({
        where: {
          name: { in: permissionNames },
        },
        select: { id: true, name: true },
      });
      // Extraire les noms existants
      const existingPermissionNames = existingPermissions.map((p) =>
        p.name.toLowerCase()
      );
      // Trouver les permissions manquantes
      const missingPermissions = permissionNames.filter(
        (name: string) => !existingPermissionNames.includes(name)
      );
      if (missingPermissions.length > 0) {
        return [
          {
            success: false,
            data,
            message: `Erreur : les permissions suivantes n'existent pas : ${missingPermissions.join(
              ", "
            )}`,
          },
        ];
      }

      // Upsert propre avec reset des relations
      const result = await prisma.role.upsert({
        where: { name },
        update: {
          description,
          permissions: {
            connect: existingPermissions,
          },
        },
        create: {
          name,
          description,
          permissions: {
            connect: existingPermissions,
          },
        },
      });

      return [
        {
          success: true,
          data: result,
          message: `Rôle '${name}' importé avec succès`,
        },
      ];
    } catch (error: any) {
      console.log(error);

      return [
        {
          success: false,
          data: data,
          message: `Erreur: ${error.message}`,
        },
      ];
    }
  }

  // GESTION DES ANOMALIES
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

// LES ENUMS UTILISÉS DANS L'IMPORT DES ANOMALIES
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

enum OrigineOrgane {
  BRC = "BRC",
  APPRO = "APPRO",
  AUTRE = "AUTRE",
}

enum TypeMouvementOrgane {
  POSE = "POSE",
  DEPOSE = "DEPOSE",
}

enum TypeCauseMouvementOrgane {
  PREVENTIF = "PREVENTIF",
  INCIDENT = "INCIDENT",
}

enum TypeRevisionOrgane {
  VP = "VP",
  RG = "RG",
  INTERVENTION = "INTERVENTION",
}
