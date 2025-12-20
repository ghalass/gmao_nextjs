// @/components/allhim/allhim-table.tsx
"use client";

import { SaisiehimWithRelations } from "@/lib/types/saisiehim";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface AllHimTableProps {
  data: SaisiehimWithRelations[];
}

export function AllHimTable({ data }: AllHimTableProps) {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4">Engin</th>
            <th className="text-left py-3 px-4">TypeParc</th>
            <th className="text-left py-3 px-4">Parc</th>
            <th className="text-left py-3 px-4">Panne</th>
            <th className="text-left py-3 px-4">HIM</th>
            <th className="text-left py-3 px-4">NI</th>
            <th className="text-left py-3 px-4">Type Panne</th>
            <th className="text-left py-3 px-4">Site</th>
            <th className="text-left py-3 px-4">Obs</th>
          </tr>
        </thead>
        <tbody>
          {data.map((saisie) => (
            <tr key={saisie.id} className="border-b hover:bg-muted/50">
              <td className="py-3 px-4">{saisie.engin?.name}</td>
              <td className="py-3 px-4">
                {saisie.engin?.parc?.typeparc?.name}
              </td>
              <td className="py-3 px-4">{saisie.engin?.parc?.name}</td>
              <td className="py-3 px-4">{saisie.panne?.name}</td>
              <td className="py-3 px-4">{saisie.him}</td>
              <td className="py-3 px-4">{saisie.ni}</td>
              <td className="py-3 px-4">{saisie.panne?.typepanne?.name}</td>
              <td className="py-3 px-4">{saisie.saisiehrm?.site?.name}</td>
              <td className="py-3 px-4">{saisie.obs}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
