"use client";

import { useState, useMemo } from "react";
import { useSites } from "@/hooks/useSites";
import { useRapportRje } from "@/hooks/useRapportRje";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableHeader,
} from "@/components/ui/table";

import { Search, Loader2, MapPin } from "lucide-react";

// Toutes les colonnes possibles
const ALL_COLUMNS = [
  { key: "engin", label: "ENGIN" },
  { key: "siteName", label: "SITE" },
  { key: "parcName", label: "PARC" },

  { key: "dispo_j", label: "DISP J" },
  { key: "dispo_m", label: "DISP M" },
  { key: "dispo_a", label: "DISP C" },

  { key: "tdm_j", label: "TDM J" },
  { key: "tdm_m", label: "TDM M" },
  { key: "tdm_a", label: "TDM C" },

  { key: "mtbf_j", label: "MTBF J" },
  { key: "mtbf_m", label: "MTBF M" },
  { key: "mtbf_a", label: "MTBF C" },

  { key: "nho_j", label: "NHO J" },
  { key: "nho_m", label: "NHO M" },
  { key: "nho_a", label: "NHO A" },

  { key: "him_j", label: "HIM J" },
  { key: "him_m", label: "HIM M" },
  { key: "him_a", label: "HIM A" },

  { key: "hrm_j", label: "HRM J" },
  { key: "hrm_m", label: "HRM M" },
  { key: "hrm_a", label: "HRM A" },

  { key: "ni_j", label: "NI J" },
  { key: "ni_m", label: "NI M" },
  { key: "ni_a", label: "NI A" },

  { key: "objectif_dispo", label: "OBJECTIF DISP" },
  { key: "objectif_mtbf", label: "OBJECTIF MTBF" },
  { key: "objectif_tdm", label: "OBJECTIF TDM" },
];

// Colonnes visibles par défaut
const DEFAULT_VISIBLE_COLUMNS = [
  "engin",
  "siteName",
  "parcName",
  "dispo_j",
  "dispo_m",
  "dispo_a",
  "tdm_j",
  "tdm_m",
  "tdm_a",
  "mtbf_j",
  "mtbf_m",
  "mtbf_a",
];

export default function RapportRjePage() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [siteFilter, setSiteFilter] = useState("");
  const [search, setSearch] = useState("");
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE_COLUMNS);

  const { sitesQuery } = useSites();
  const sites = sitesQuery.data ?? [];

  const rapportQuery = useRapportRje(date);
  const data = rapportQuery.data ?? [];

  // Filtrage
  const filtered = useMemo(() => {
    if (!data.length) return [];
    return data.filter((item) => {
      const matchSite = siteFilter === "" || item.siteId === siteFilter;
      const q = search.toLowerCase();
      const matchSearch =
        item.engin.toLowerCase().includes(q) ||
        (item.parcName ?? "").toLowerCase().includes(q) ||
        (item.siteName ?? "").toLowerCase().includes(q);
      return matchSite && matchSearch;
    });
  }, [data, siteFilter, search]);

  // Toggle colonne
  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Couleur selon objectif
  const getCellColor = (
    value: any,
    type: "dispo" | "mtbf" | "tdm",
    row: any
  ) => {
    const val = parseFloat(value);
    let obj: number | undefined;
    if (type === "dispo") obj = parseFloat(row.objectif_dispo);
    if (type === "mtbf") obj = parseFloat(row.objectif_mtbf);
    if (type === "tdm") obj = parseFloat(row.objectif_tdm);

    if (!obj || isNaN(val)) return "";
    const ratio = val / obj;
    if (ratio >= 1) return "text-green-600 font-semibold";
    if (ratio >= 0.8) return "text-yellow-600 font-semibold";
    return "text-red-600 font-semibold";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Titre et filtres */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MapPin className="h-7 w-7" />
          Rapport Journalier des Engins
        </h1>

        <div className="flex gap-2 items-center">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-9"
          />

          <Select
            value={siteFilter === "" ? "all" : siteFilter}
            onValueChange={(v) => setSiteFilter(v === "all" ? "" : v)}
          >
            <SelectTrigger className="h-9 w-52">
              <SelectValue placeholder="Tous les sites" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les sites</SelectItem>
              {sites.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Recherche */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
          <Input
            placeholder="Rechercher par engin, parc ou site…"
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Button
          variant="outline"
          disabled={rapportQuery.isFetching}
          onClick={() => rapportQuery.refetch()}
        >
          {rapportQuery.isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Rafraîchir"
          )}
        </Button>
      </div>

      {/* Choix colonnes */}
      <div className="flex gap-3 flex-wrap bg-muted p-3 rounded">
        {ALL_COLUMNS.map((col) => (
          <label
            key={col.key}
            className="flex items-center gap-1 cursor-pointer select-none"
          >
            <input
              type="checkbox"
              checked={visibleColumns.includes(col.key)}
              onChange={() => toggleColumn(col.key)}
              className="accent-primary"
            />
            <span className="text-sm">{col.label}</span>
          </label>
        ))}
      </div>

      {/* TABLE */}
      <div className="border rounded-lg overflow-auto">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-20">
            <TableRow>
              {ALL_COLUMNS.filter((c) => visibleColumns.includes(c.key)).map(
                (c) => (
                  <TableHead key={c.key} className="text-center">
                    {c.label}
                  </TableHead>
                )
              )}
            </TableRow>
          </TableHeader>
          <tbody>
            {filtered.map((row) => (
              <TableRow
                key={row.engin + (row.siteName ?? "") + (row.parcName ?? "")}
                className="hover:bg-muted/50"
              >
                {ALL_COLUMNS.filter((c) => visibleColumns.includes(c.key)).map(
                  (col) => {
                    let className = "text-center";
                    // Coloration des valeurs par rapport à objectif
                    if (["dispo_j", "dispo_m", "dispo_a"].includes(col.key))
                      className +=
                        " " + getCellColor(row[col.key], "dispo", row);
                    if (["mtbf_j", "mtbf_m", "mtbf_a"].includes(col.key))
                      className +=
                        " " + getCellColor(row[col.key], "mtbf", row);
                    if (["tdm_j", "tdm_m", "tdm_a"].includes(col.key))
                      className += " " + getCellColor(row[col.key], "tdm", row);

                    return (
                      <TableCell key={col.key} className={className}>
                        {row[col.key as keyof typeof row] ?? "-"}
                      </TableCell>
                    );
                  }
                )}
              </TableRow>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
