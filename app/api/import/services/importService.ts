// app/api/import/services/importService.ts
import { convertField } from "@/lib/convertField";
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
}
