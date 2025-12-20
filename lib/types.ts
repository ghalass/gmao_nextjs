// lib/types.ts - Types corrigés basés sur le schéma

// ============ ENUMS ============
export enum Action {
  CREATE = "create",
  READ = "read",
  UPDATE = "update",
  DELETE = "delete",
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

export enum StatutEngin {
  ACTIF = "ACTIF",
  INACTIF = "INACTIF",
  EN_MAINTENANCE = "EN_MAINTENANCE",
  HORS_SERVICE = "HORS_SERVICE",
}

// ============ MODELS DE BASE ============
export interface User {
  id?: string;
  name: string;
  email: string;
  password?: string;
  active?: boolean;

  roles?: UserRole[];
}

export interface Permission {
  id: string;
  resource: string;
  action?: Action;
  roles?: RolePermission[];
}

// lib/types.ts - Assurez-vous que Role a ces propriétés
export interface Role {
  id: string;
  name: string;
  description?: string;
  createdAt?: string; // Date en string
  updatedAt?: string; // Date en string
  permissions?: Array<{
    id: string;
    name: string;
    description: string;
    resource: string;
    action: string;
  }>;
  user?: [];
}

export interface UserRole {
  id?: string;
  userId: string;
  roleId: string;
  user?: User;
  role?: Role;

  // Ajouter ces propriétés si elles existent dans votre modèle
  // (selon votre schéma de base de données)
  name?: string; // Si le nom est stocké directement dans UserRole
  roleName?: string; // Alternative: nom dédié
}

export interface RolePermission {
  roleId: string;
  permissionId: string;
  role?: Role;
  permission?: Permission;
}

// ============ MODELS PRINCIPAUX ============
export interface Site {
  id: string;
  name: string;
  active: boolean;

  engins?: Engin[];
  saisiehrm?: Saisiehrm[];
  objectif?: Objectif[];
  anomalies?: Anomalie[];

  // Count pour les agrégations
  _count?: {
    engins?: number;
  };
}

export interface Typeparc {
  id: string;
  name: string;

  parcs?: Parc[];

  totalEngins?: number;
}

export interface Parc {
  id: string;
  name: string;
  typeparcId: string;

  typeparc?: Typeparc;
  engins?: Engin[];
  typesConsommationLub?: TypeconsommationlubParc[];
  typepanneParc?: TypepanneParc[];
  lubrifiantParc?: LubrifiantParc[];
  objectif?: Objectif[];

  _count?: {
    engins?: number;
  };
}

export interface Typeconsommationlub {
  id: string;
  name: string;

  parcs?: TypeconsommationlubParc[];
  saisielubrifiant?: Saisielubrifiant[];
}

export interface TypeconsommationlubParc {
  parcId: string;
  typeconsommationlubId: string;
  parc?: Parc;
  typeconsommationlub?: Typeconsommationlub;
}

export interface LubrifiantParc {
  parcId: string;
  lubrifiantId: string;
  parc?: Parc;
  lubrifiant?: Lubrifiant;
}

export interface Engin {
  id: string;
  name: string;
  active: boolean;
  parcId: string;
  siteId: string;
  initialHeureChassis?: number;
  createdAt?: string;
  updatedAt?: string;

  // Relations
  parc?: {
    id: string;
    name: string;
    typeparcId: string;
    typeparc?: {
      id: string;
      name: string;
    };
  };
  site?: {
    id: string;
    name: string;
    active: boolean;
  };
  saisiehrm?: Saisiehrm[];
  saisiehim?: Saisiehim[];
  anomalies?: Anomalie[];

  // Count pour les agrégations
  _count?: {
    pannes?: number;
    saisiehrm?: number;
    saisiehim?: number;
    anomalies?: number;
  };
}

export interface Typepanne {
  id: string;
  name: string;
  description?: string;

  pannes?: Panne[];
  typepanneParc?: TypepanneParc[];
}

export interface TypepanneParc {
  parcId: string;
  typepanneId: string;
  parc?: Parc;
  typepanne?: Typepanne;
}

export interface Panne {
  id: string;
  name: string;
  description?: string;
  typepanneId: string;

  typepanne?: Typepanne;
  saisiehim?: Saisiehim[];
}

export interface Saisiehrm {
  id: string;
  du: Date;
  enginId: string;
  siteId: string;
  hrm: number;

  engin?: Engin;
  site?: Site;
  saisiehim?: Saisiehim[];
}

export interface Saisiehim {
  id: string;
  panneId: string;
  him: number;
  ni: number;
  saisiehrmId: string;
  enginId?: string;
  obs?: string;

  panne?: Panne;
  saisiehrm?: Saisiehrm;
  engin?: Engin;
  saisielubrifiant?: Saisielubrifiant[];
}

export interface Typelubrifiant {
  id: string;
  name: string;

  lubrifiants?: Lubrifiant[];
}

export interface Lubrifiant {
  id: string;
  name: string;
  typelubrifiantId: string;

  typelubrifiant?: Typelubrifiant;
  taisielubrifiant?: Saisielubrifiant[];
  tubrifiantParc?: LubrifiantParc[];
}

export interface Saisielubrifiant {
  id: string;
  lubrifiantId: string;
  qte: number;
  obs?: string;
  saisiehimId: string;
  typeconsommationlubId?: string;

  lubrifiant?: Lubrifiant;
  saisiehim?: Saisiehim;
  typeconsommationlub?: Typeconsommationlub;
}

export interface Objectif {
  id: string;
  annee: number;
  parcId: string;
  siteId: string;
  dispo?: number;
  mtbf?: number;
  tdm?: number;
  spe_huile?: number;
  spe_go?: number;
  spe_graisse?: number;

  parc?: Parc;
  site?: Site;
}

export interface Anomalie {
  id: string;
  numeroBacklog: string;
  dateDetection: Date;
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
  dateExecution?: Date;
  confirmation?: string;
  observations?: string;
  enginId: string;
  siteId: string;

  engin?: Engin;
  site?: Site;
  historiqueStatutAnomalies?: HistoriqueStatutAnomalie[];
}

export interface HistoriqueStatutAnomalie {
  id: string;
  anomalieId: string;
  ancienStatut: StatutAnomalie;
  nouveauStatut: StatutAnomalie;
  dateChangement: Date;
  commentaire?: string;
  anomalie?: Anomalie;
}

// ============ TYPES POUR LES FORMULAIRES ============
export interface PanneCreateDto {
  name: string;
  typepanneId: string;
}

export interface PanneUpdateDto {
  id: string;
  name?: string;
  typepanneId?: string;
}

export interface EnginCreateDto {
  name: string;
  active?: boolean;
  parcId: string;
  siteId: string;
  initialHeureChassis?: number;
}

export interface EnginUpdateDto {
  id: string;
  name?: string;
  active?: boolean;
  parcId?: string;
  siteId?: string;
  initialHeureChassis?: number;
}

export interface SaisiehrmCreateDto {
  du: Date | string;
  enginId: string;
  siteId: string;
  hrm: number;
}

export interface SaisiehrmUpdateDto {
  id: string;
  du?: Date | string;
  enginId?: string;
  siteId?: string;
  hrm?: number;
}

// ============ TYPES POUR LES RÉPONSES API ============
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============ TYPES POUR LES FILTRES ============
export interface EnginFilter {
  name?: string;
  parcId?: string;
  siteId?: string;
  active?: boolean;
  search?: string;
}

export interface SaisiehrmFilter {
  enginId?: string;
  siteId?: string;
  startDate?: Date;
  endDate?: Date;
}

// ============ TYPE UTILITAIRE ============
export type WithRelations<T, K extends keyof T> = T & {
  [P in K]: NonNullable<T[P]>;
};

// ============ TYPES POUR LES DTO ============
export interface RoleCreateDto {
  name: string;
  description?: string;
  permissions: string[]; // IDs des permissions
}

export interface RoleUpdateDto {
  id: string;
  name?: string;
  description?: string;
  permissions?: string[];
}

// ============ TYPES POUR LES FILTRES UTILISATEURS ============
export interface UserFilter {
  name?: string;
  email?: string;
  active?: boolean;
  role?: string;
  search?: string;
}

// ============ TYPES POUR LES TABLEAUX ============
export interface ColumnFilters {
  name: string;
  email: string;
  roles: string;
}

// ============ TYPES POUR LES FONCTIONS DE FILTRE ============
export interface FilterOptions {
  globalSearch: string;
  columnFilters: ColumnFilters;
}

export interface UserDetail {
  id: string;
  name: string;
  email: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  roles: Role[];
  permissions: Permission[];
  roleNames: string[];
}
