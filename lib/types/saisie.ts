// lib/types/saisie.ts
export interface Saisiehrm {
  id: string;
  du: Date;
  hrm: number;
  enginId: string;
  siteId: string;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  engin?: {
    id: string;
    name: string;
  };
  site?: {
    id: string;
    name: string;
  };
  saisiehim?: Saisiehim[];
}

export interface Saisiehim {
  id: string;
  him: number;
  ni: number;
  obs?: string;
  panneId: string;
  saisiehrmId: string;
  enginId?: string;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  panne?: {
    id: string;
    name: string;
    typepanne?: {
      id: string;
      name: string;
    };
  };
  saisiehrm?: Saisiehrm;
  engin?: {
    id: string;
    name: string;
  };
}

export interface SaisiehrmFormData {
  du: Date | string;
  hrm: number;
  enginId: string;
  siteId: string;
}

export interface SaisiehimFormData {
  him: number;
  ni: number;
  obs?: string;
  panneId: string;
  saisiehrmId: string;
  enginId?: string;
}
