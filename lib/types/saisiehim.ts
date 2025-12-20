// @/lib/types/saisiehim.ts
import {
  Saisiehim,
  Engin,
  Site,
  Parc,
  Typeparc,
  Panne,
  Typepanne,
  Saisiehrm,
} from "@prisma/client";

export type SaisiehimWithRelations = Saisiehim & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  enginId: string;
  panneId: string;
  saisiehrmId: string;
  him: number;
  ni: number;
  obs: string | null;
  engin: {
    id: string;
    name: string;
    parcId: string;
    siteId: string;
    parc: {
      id: string;
      name: string;
      typeparcId: string;
      typeparc: {
        id: string;
        name: string;
      };
    };
    site: {
      id: string;
      name: string;
    };
  };
  panne: {
    id: string;
    name: string;
    typepanneId: string;
    typepanne: {
      id: string;
      name: string;
    };
  };
  saisiehrm: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    enginId: string;
    siteId: string;
    du: Date;
    hrm: number;
    compteur: number | null;
    site: {
      id: string;
      name: string;
      // Add other site fields if needed
    };
  };
};

export type PaginatedSaisiehim = {
  data: SaisiehimWithRelations[];
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  hasMore?: boolean;
  nextCursor?: string | null;
  lastCursor?: string | null;
};
