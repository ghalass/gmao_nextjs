import { Engin, Site, Panne, Lubrifiant, Typeconsommationlub } from "@prisma/client";

// Re-export Prisma types
export type { Engin, Site, Panne, Lubrifiant };
export type TypeConsommationLub = Typeconsommationlub;

// lib/types/performance.ts
export interface SaisiePerformance {
  id: string;
  du: Date;
  enginId: string;
  siteId: string;
  hrm: number;
  saisiehim?: SaisieHim[];
  saisielubrifiants?: SaisieLubrifiant[];
  engin: Engin;
  site: Site;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaisieHim {
  id: string;
  panneId: string;
  him: number;
  ni: number;
  saisiehrmId: string;
  enginId?: string;
  obs?: string;
  panne: Panne;
  engin?: Engin;
  saisielubrifiants?: SaisieLubrifiant[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SaisieLubrifiant {
  id: string;
  lubrifiantId: string;
  qte: number;
  obs?: string;
  saisiehimId: string;
  typeconsommationlubId?: string;
  lubrifiant: Lubrifiant;
  typeconsommationlub?: TypeConsommationLub;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaisiePerformanceFormData {
  du: Date;
  enginId: string;
  siteId: string;
  hrm: number;
}

export interface SaisieHimFormData {
  id?: string;
  panneId: string;
  him: number;
  ni: number;
  obs?: string;
  saisiehrmId: string;
  enginId?: string;
}

export interface SaisieLubrifiantFormData {
  id?: string;
  lubrifiantId: string;
  qte: number;
  obs?: string;
  saisiehimId: string;
  typeconsommationlubId?: string;
}
