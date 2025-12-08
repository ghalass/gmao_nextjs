// components/anomalies/AnomalieFilters.tsx
"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Filter, Search, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { StatutAnomalie, SourceAnomalie, Priorite } from "@prisma/client";
import { Site } from "@/hooks/useSites";
import { Engin } from "@/hooks/useEngins";

interface AnomalieFiltersProps {
  filters: {
    search: string;
    statut?: StatutAnomalie;
    priorite?: Priorite;
    source?: SourceAnomalie;
    enginId?: string;
    siteId?: string;
    dateFrom?: string;
    dateTo?: string;
  };
  onFilterChange: (key: string, value: any) => void;
  sites: Site[];
  engins: Engin[];
}

export function AnomalieFilters({
  filters,
  onFilterChange,
  sites,
  engins,
}: AnomalieFiltersProps) {
  const handleClearFilters = () => {
    onFilterChange("search", "");
    onFilterChange("statut", undefined);
    onFilterChange("priorite", undefined);
    onFilterChange("source", undefined);
    onFilterChange("enginId", undefined);
    onFilterChange("siteId", undefined);
    onFilterChange("dateFrom", undefined);
    onFilterChange("dateTo", undefined);
  };

  const hasActiveFilters = () => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === "search") return value !== "";
      return value !== undefined;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4" />
          <h3 className="text-sm font-medium">Filtres</h3>
        </div>
        {hasActiveFilters() && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            <X className="mr-2 h-4 w-4" />
            Réinitialiser
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Recherche */}
        <div className="space-y-2">
          <Label htmlFor="search">Recherche</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="N° backlog, description..."
              value={filters.search}
              onChange={(e) => onFilterChange("search", e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Statut */}
        <div className="space-y-2">
          <Label htmlFor="statut">Statut</Label>
          <Select
            value={filters.statut || "all"}
            onValueChange={(value) =>
              onFilterChange("statut", value === "all" ? undefined : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {Object.values(StatutAnomalie).map((statut) => (
                <SelectItem key={statut} value={statut}>
                  {statut.replace("_", " ").toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Priorité */}
        <div className="space-y-2">
          <Label htmlFor="priorite">Priorité</Label>
          <Select
            value={filters.priorite || "all"}
            onValueChange={(value) =>
              onFilterChange("priorite", value === "all" ? undefined : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Toutes les priorités" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les priorités</SelectItem>
              {Object.values(Priorite).map((priorite) => (
                <SelectItem key={priorite} value={priorite}>
                  {priorite.toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Source */}
        <div className="space-y-2">
          <Label htmlFor="source">Source</Label>
          <Select
            value={filters.source || "all"}
            onValueChange={(value) =>
              onFilterChange("source", value === "all" ? undefined : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Toutes les sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les sources</SelectItem>
              {Object.values(SourceAnomalie).map((source) => (
                <SelectItem key={source} value={source}>
                  {source}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Site */}
        <div className="space-y-2">
          <Label htmlFor="siteId">Site</Label>
          <Select
            value={filters.siteId || "all"}
            onValueChange={(value) =>
              onFilterChange("siteId", value === "all" ? undefined : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Tous les sites" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les sites</SelectItem>
              {sites.map((site) => (
                <SelectItem key={site.id} value={site.id}>
                  {site.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Engin */}
        <div className="space-y-2">
          <Label htmlFor="enginId">Engin</Label>
          <Select
            value={filters.enginId || "all"}
            onValueChange={(value) =>
              onFilterChange("enginId", value === "all" ? undefined : value)
            }
            disabled={!filters.siteId}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  !filters.siteId
                    ? "Sélectionnez d'abord un site"
                    : "Tous les engins"
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les engins</SelectItem>
              {engins
                .filter(
                  (engin) => !filters.siteId || engin.siteId === filters.siteId
                )
                .map((engin) => (
                  <SelectItem key={engin.id} value={engin.id}>
                    {engin.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Dates */}
        <div className="space-y-2">
          <Label>Date de détection</Label>
          <div className="grid grid-cols-2 gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !filters.dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateFrom
                    ? format(new Date(filters.dateFrom), "dd/MM/yyyy", {
                        locale: fr,
                      })
                    : "Du"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={
                    filters.dateFrom ? new Date(filters.dateFrom) : undefined
                  }
                  onSelect={(date) =>
                    onFilterChange(
                      "dateFrom",
                      date ? format(date, "yyyy-MM-dd") : undefined
                    )
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !filters.dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateTo
                    ? format(new Date(filters.dateTo), "dd/MM/yyyy", {
                        locale: fr,
                      })
                    : "Au"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={
                    filters.dateTo ? new Date(filters.dateTo) : undefined
                  }
                  onSelect={(date) =>
                    onFilterChange(
                      "dateTo",
                      date ? format(date, "yyyy-MM-dd") : undefined
                    )
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </div>
  );
}
