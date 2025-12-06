"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Check, MapPin, PencilIcon, PlusIcon, Trash2, X } from "lucide-react";
import React, { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Site {
  id: string;
  name: string;
  active: boolean;
}

interface SiteFormData {
  name: string;
  active: boolean;
}

type DialogMode = "create" | "edit" | "delete";

export default function SitesPage() {
  // États
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // États pour les dialogues
  const [dialogMode, setDialogMode] = useState<DialogMode | null>(null);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);

  // États pour les formulaires
  const [form, setForm] = useState<SiteFormData>({ name: "", active: true });

  // Gestionnaires de dialogues
  const handleOpenDialog = useCallback((mode: DialogMode, site?: Site) => {
    setDialogMode(mode);
    setError(null);

    if (mode === "edit" && site) {
      setSelectedSite(site);
      setForm({ name: site.name, active: site.active });
    } else if (mode === "delete" && site) {
      setSelectedSite(site);
    } else if (mode === "create") {
      setSelectedSite(null);
      setForm({ name: "", active: true });
    }
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogMode(null);
    setSelectedSite(null);
    setForm({ name: "", active: true });
    setError(null);
  }, []);

  // Fetch des sites
  const fetchSites = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/sites", {
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      const data = await response.json();
      setSites(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors du chargement des sites";
      setError(errorMessage);
      toast.error("Erreur de chargement", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  // CRUD Operations
  const createSite = useCallback(
    async (siteData: SiteFormData): Promise<Site> => {
      if (!siteData.name.trim()) {
        throw new Error("Le nom du site est requis");
      }

      const response = await fetch("/api/sites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: siteData.name.trim(),
          active: siteData.active,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Erreur ${response.status}`);
      }

      return data;
    },
    []
  );

  const updateSite = useCallback(
    async (id: string, siteData: SiteFormData): Promise<Site> => {
      if (!siteData.name.trim()) {
        throw new Error("Le nom du site est requis");
      }

      const response = await fetch(`/api/sites/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: siteData.name.trim(),
          active: siteData.active,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Erreur ${response.status}`);
      }

      return data;
    },
    []
  );

  const deleteSite = useCallback(async (id: string): Promise<void> => {
    const response = await fetch(`/api/sites/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Erreur ${response.status}`);
    }
  }, []);

  // Gestionnaires de soumission
  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Validation", {
        description: "Le nom du site est requis",
      });
      return;
    }

    try {
      setSubmitting(true);

      const newSite = await createSite(form);

      // Mise à jour optimiste
      setSites((prev) => [newSite, ...prev]);

      toast.success("Site créé", {
        description: `Le site "${newSite.name}" a été créé avec succès`,
      });

      handleCloseDialog();
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors de la création du site";

      toast.error("Erreur de création", {
        description: errorMessage,
      });

      await fetchSites();
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSite?.id) return;

    if (!form.name.trim()) {
      toast.error("Validation", {
        description: "Le nom du site est requis",
      });
      return;
    }

    try {
      setSubmitting(true);

      const updatedSite = await updateSite(selectedSite.id, form);

      // Mise à jour optimiste
      setSites((prev) =>
        prev.map((site) => (site.id === selectedSite.id ? updatedSite : site))
      );

      toast.success("Site modifié", {
        description: `Le site "${updatedSite.name}" a été modifié avec succès`,
      });

      handleCloseDialog();
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors de la modification du site";

      toast.error("Erreur de modification", {
        description: errorMessage,
      });

      await fetchSites();
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedSite) return;

    try {
      setSubmitting(true);

      const siteId = selectedSite.id;
      const siteName = selectedSite.name;

      // Mise à jour optimiste
      setSites((prev) => prev.filter((site) => site.id !== siteId));

      await deleteSite(siteId);

      toast.success("Site supprimé", {
        description: `Le site "${siteName}" a été supprimé`,
      });

      handleCloseDialog();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur lors de la suppression";

      toast.error("Erreur de suppression", {
        description: errorMessage,
      });

      await fetchSites();
    } finally {
      setSubmitting(false);
    }
  };

  // Affichage des statuts
  const getStatusBadge = (active: boolean) => {
    return active ? (
      <Badge>
        <Check className="size-5" />
        Active
      </Badge>
    ) : (
      <Badge variant="secondary">
        <X className="size-5" />
        Inactif
      </Badge>
    );
  };

  // Titres et descriptions dynamiques pour les dialogues
  const getDialogConfig = () => {
    switch (dialogMode) {
      case "create":
        return {
          title: "Créer un nouveau site",
          description:
            "Remplissez les informations pour créer un nouveau site.",
          submitText: "Créer le site",
          submitLoadingText: "Création...",
        };
      case "edit":
        return {
          title: "Modifier le site",
          description: "Modifiez les informations du site.",
          submitText: "Enregistrer les modifications",
          submitLoadingText: "Modification...",
        };
      default:
        return {
          title: "",
          description: "",
          submitText: "",
          submitLoadingText: "",
        };
    }
  };

  // État de chargement
  if (loading && sites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Spinner className="h-12 w-12" />
        <p className="text-muted-foreground">Chargement des sites...</p>
      </div>
    );
  }

  // État d'erreur
  if (error && sites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">
            Erreur de chargement
          </h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchSites}>Réessayer</Button>
        </div>
      </div>
    );
  }

  const dialogConfig = getDialogConfig();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Sites</h1>
              <p className="text-muted-foreground">
                {sites.length} site{sites.length !== 1 ? "s" : ""} au total
              </p>
            </div>
          </CardTitle>
          <CardDescription className="flex gap-1 items-center text-2xl">
            <MapPin />
            Gestion des sites !!
          </CardDescription>
          <CardAction>
            <Button
              onClick={() => handleOpenDialog("create")}
              className="sm:self-start"
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Nouveau site
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {/* <div className="container mx-auto p-4 md:p-6"> */}
          {/* Tableau des sites */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/2">Nom</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sites.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Aucun site trouvé. Créez votre premier site.
                    </TableCell>
                  </TableRow>
                ) : (
                  sites.map((site) => (
                    <TableRow key={site.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{site.name}</TableCell>
                      <TableCell>{getStatusBadge(site.active)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog("edit", site)}
                            title="Modifier"
                          >
                            <PencilIcon
                              color="#6de38b"
                              className="h-4 w-4 text-muted-foreground hover:text-blue-600 transition-colors"
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog("delete", site)}
                            title="Supprimer"
                          >
                            <Trash2
                              color="#e36d6d"
                              className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors"
                            />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Dialogue de création/modification */}
          {(dialogMode === "create" || dialogMode === "edit") && (
            <Dialog
              open={true}
              onOpenChange={(open) => !open && handleCloseDialog()}
            >
              <DialogContent className="sm:max-w-[425px]">
                <form
                  onSubmit={
                    dialogMode === "create"
                      ? handleSubmitCreate
                      : handleSubmitEdit
                  }
                >
                  <DialogHeader>
                    <DialogTitle>{dialogConfig.title}</DialogTitle>
                    <DialogDescription>
                      {dialogConfig.description}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="site-name" className="required">
                        Nom du site
                      </Label>
                      <Input
                        id="site-name"
                        name="site-name"
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        placeholder="Ex: MonSite.fr"
                        autoComplete="off"
                        autoFocus
                        required
                      />
                    </div>

                    <div className="grid gap-2">
                      <Field orientation="horizontal">
                        <FieldContent className="flex-1">
                          <FieldLabel>Statut</FieldLabel>
                          <p className="text-sm text-muted-foreground">
                            Le site sera-t-il activé immédiatement ?
                          </p>
                        </FieldContent>
                        <Switch
                          name="site-active"
                          id="site-active"
                          checked={form.active}
                          onCheckedChange={(checked) =>
                            setForm({ ...form, active: checked })
                          }
                        />
                      </Field>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseDialog}
                      disabled={submitting}
                    >
                      Annuler
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Spinner className="mr-2 h-4 w-4" />
                          {dialogConfig.submitLoadingText}
                        </>
                      ) : (
                        dialogConfig.submitText
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}

          {/* Dialogue de suppression */}
          {dialogMode === "delete" && (
            <AlertDialog
              open={true}
              onOpenChange={(open) => !open && handleCloseDialog()}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. Le site `{selectedSite?.name}
                    ` sera définitivement supprimé.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={submitting}>
                    Annuler
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleConfirmDelete}
                    disabled={submitting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {submitting ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Suppression...
                      </>
                    ) : (
                      "Supprimer définitivement"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {/* </div> */}
        </CardContent>
        <CardFooter>
          <p>Pagination</p>
        </CardFooter>
      </Card>
    </>
  );
}
