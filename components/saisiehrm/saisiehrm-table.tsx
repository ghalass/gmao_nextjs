// components/saisiehrm/saisiehrm-table.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { SaisiehrmWithRelations } from "@/lib/types/saisiehrm";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

const columns: ColumnDef<SaisiehrmWithRelations>[] = [
  {
    id: "engin",
    accessorKey: "du",
    header: "Date/Heure",
    cell: ({ row }) => {
      return format(new Date(row.original.du), "dd/MM/yyyy", {
        locale: fr,
      });
    },
  },
  {
    id: "site",
    accessorKey: "engin.name",
    header: "Engin",
    cell: ({ row }) => {
      return <span className="font-medium">{row.original.engin.name}</span>;
    },
  },
  {
    accessorKey: "site.name",
    header: "Site",
  },
  {
    accessorKey: "hrm",
    header: "HRM",
    cell: ({ row }) => {
      return <Badge variant="secondary">{row.original.hrm.toFixed(2)}</Badge>;
    },
  },
  {
    accessorKey: "compteur",
    header: "Compteur",
    cell: ({ row }) => {
      return row.original.compteur ? (
        <span className="font-mono">{row.original.compteur.toFixed(2)}</span>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
  },
  // {
  //   accessorKey: "createdAt",
  //   header: "Créé le",
  //   cell: ({ row }) => {
  //     return format(new Date(row.original.createdAt), "dd/MM/yyyy", {
  //       locale: fr,
  //     });
  //   },
  // },
];

interface SaisiehrmTableProps {
  data: SaisiehrmWithRelations[];
}

export function SaisiehrmTable({ data }: SaisiehrmTableProps) {
  return <DataTable columns={columns} data={data} />;
}
