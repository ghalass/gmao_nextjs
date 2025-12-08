// lib/types/anomalie.ts
import { StatutAnomalie, SourceAnomalie, Priorite } from "@prisma/client";

export interface Anomalie {
  id: string;
  numeroBacklog: string;
  dateDetection: Date;
  description: string;
  source: SourceAnomalie;
  priorite: Priorite;
  besoinPDR: boolean;
  quantite: number | null;
  reference: string | null;
  code: string | null;
  stock: string | null;
  numeroBS: string | null;
  programmation: string | null;
  sortiePDR: string | null;
  equipe: string | null;
  statut: StatutAnomalie;
  dateExecution: Date | null;
  confirmation: string | null;
  observations: string | null;
  enginId: string;
  siteId: string;
  createdAt: Date;
  updatedAt: Date;
  engin?: {
    id: string;
    name: string;
  };
  site?: {
    id: string;
    name: string;
  };
  historiqueStatutAnomalies?: HistoriqueStatutAnomalie[];
}

export interface HistoriqueStatutAnomalie {
  id: string;
  anomalieId: string;
  ancienStatut: StatutAnomalie;
  nouveauStatut: StatutAnomalie;
  dateChangement: Date;
  commentaire: string | null;
}

export interface AnomalieFormData {
  numeroBacklog: string;
  dateDetection: string;
  description: string;
  source: SourceAnomalie;
  priorite: Priorite;
  besoinPDR: boolean;
  quantite?: number | null;
  reference?: string | null;
  code?: string | null;
  stock?: string | null;
  numeroBS?: string | null;
  programmation?: string | null;
  sortiePDR?: string | null;
  equipe?: string | null;
  statut: StatutAnomalie;
  dateExecution?: string | null;
  confirmation?: string | null;
  observations?: string | null;
  enginId: string;
  siteId: string;
}

// Fonction pour convertir les données du formulaire
export function convertToAnomalieFormData(data: any): AnomalieFormData {
  return {
    numeroBacklog: data.numeroBacklog || "",
    dateDetection: data.dateDetection || "",
    description: data.description || "",
    source: data.source as SourceAnomalie,
    priorite: data.priorite as Priorite,
    besoinPDR: Boolean(data.besoinPDR),
    quantite: data.quantite || null,
    reference: data.reference || null,
    code: data.code || null,
    stock: data.stock || null,
    numeroBS: data.numeroBS || null,
    programmation: data.programmation || null,
    sortiePDR: data.sortiePDR || null,
    equipe: data.equipe || null,
    statut: data.statut as StatutAnomalie,
    dateExecution: data.dateExecution || null,
    confirmation: data.confirmation || null,
    observations: data.observations || null,
    enginId: data.enginId || "",
    siteId: data.siteId || "",
  };
}

export interface AnomalieUpdateData extends Partial<AnomalieFormData> {
  statut?: StatutAnomalie;
}

export interface AnomalieWithRelations extends Anomalie {
  engin: {
    id: string;
    name: string;
  };
  site: {
    id: string;
    name: string;
  };
  historiqueStatutAnomalies: HistoriqueStatutAnomalie[];
}

export interface AnomalieFilters {
  id?: string;
  search?: string;
  statut?: StatutAnomalie;
  priorite?: Priorite;
  source?: SourceAnomalie;
  enginId?: string;
  siteId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AnomalieStats {
  total: number;
  parStatut: Record<StatutAnomalie, number>;
  parPriorite: Record<Priorite, number>;
  parSource: Record<SourceAnomalie, number>;
}
