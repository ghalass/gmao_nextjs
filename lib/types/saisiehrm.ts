// types/saisiehrm.ts

import { Saisiehrm, Engin, Site, Parc, Typeparc } from "@prisma/client";

// Base Saisiehrm interface
export interface BaseSaisiehrm {
  id: string;
  du: Date;
  hrm: number;
  compteur: number | null;
  enginId: string;
  siteId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Extended interfaces with different relation structures
export interface SaisiehrmWithEnginSite extends BaseSaisiehrm {
  engin: {
    id: string;
    name: string;
  };
  site: {
    id: string;
    name: string;
  };
}

export interface SaisiehrmWithRelations extends BaseSaisiehrm {
  engin: {
    id: string;
    name: string;
  };
  site: {
    id: string;
    name: string;
  };
}

export interface SaisiehrmWithFullRelations extends BaseSaisiehrm {
  engin: Engin & {
    parc: Parc & {
      typeparc: Typeparc;
    };
  };
  site: Site;
}

// Filters interface
export interface SaisiehrmFilters {
  date: Date;
  enginId?: string;
  siteId?: string;
}

// Unified Paginated interface
export interface PaginatedSaisiehrm {
  data: SaisiehrmWithFullRelations[] | SaisiehrmWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
  nextCursor?: string | null;
  lastCursor?: string | null;
}

// Alternative interface for cursor-based pagination
export interface CursorPaginatedSaisiehrm {
  data: SaisiehrmWithFullRelations[] | SaisiehrmWithRelations[];
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  hasMore: boolean;
  nextCursor: string | null;
  lastCursor: string | null;
}
