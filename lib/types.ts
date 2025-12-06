// lib/types.ts - Version corrigée
export interface Panne {
  id: string;
  name: string; // Champ principal dans votre schéma
  typepanneId: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  typepanne?: Typepanne;
  saisiehim?: Saisiehim[];
}

export interface Typepanne {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Engin {
  id: string;
  name: string;
  active: boolean;
  parcId: string;
  siteId: string;
  initialHeureChassis?: number;
  createdAt: string;
  updatedAt: string;

  // Relations
  parc?: Parc;
  site?: Site;
  saisiehrm?: Saisiehrm[];
  saisiehim?: Saisiehim[];
  anomalies?: Anomalie[];
}

export interface Saisiehim {
  id: string;
  panneId: string;
  him: number;
  ni: number;
  saisiehrmId: string;
  enginId?: string;
  obs?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  panne?: Panne;
  saisiehrm?: Saisiehrm;
  engin?: Engin;
}

export interface Saisiehrm {
  id: string;
  du: string;
  enginId: string;
  siteId: string;
  hrm: number;
  createdAt: string;
  updatedAt: string;

  // Relations
  engin?: Engin;
  site?: Site;
}

export interface Parc {
  id: string;
  name: string;
  typeparcId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Site {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Anomalie {
  id: string;
  numeroBacklog: string;
  dateDetection: string;
  description: string;
  source: SourceAnomalie;
  priorite: Priorite;
  besoinPDR: boolean;
  quantite?: number;
  reference?: string;
  code?: string;
  stock?: string;
  numeroBS?: string;
  programmation?: string;
  sortiePDR?: string;
  equipe?: string;
  statut: StatutAnomalie;
  dateExecution?: string;
  confirmation?: string;
  observations?: string;
  enginId: string;
  siteId: string;
  createdAt: string;
  updatedAt: string;
}

export enum SourceAnomalie {
  VS = "VS",
  VJ = "VJ",
  INSPECTION = "INSPECTION",
  AUTRE = "AUTRE",
}

export enum Priorite {
  ELEVEE = "ELEVEE",
  MOYENNE = "MOYENNE",
  FAIBLE = "FAIBLE",
}

export enum StatutAnomalie {
  ATTENTE_PDR = "ATTENTE_PDR",
  PDR_PRET = "PDR_PRET",
  NON_PROGRAMMEE = "NON_PROGRAMMEE",
  PROGRAMMEE = "PROGRAMMEE",
  EXECUTE = "EXECUTE",
}

// Types pour les formulaires
export interface PanneCreateDto {
  name: string;
  typepanneId: string;
}

export interface PanneUpdateDto {
  id: string;
  name?: string;
  typepanneId?: string;
}
