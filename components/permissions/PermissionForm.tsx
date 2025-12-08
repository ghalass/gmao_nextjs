"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { API } from "@/lib/constantes";

interface SimplePermissionFormProps {
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  error?: string;
}

const actionOptions = [
  { value: "read", label: "Lecture" },
  { value: "create", label: "Création" },
  { value: "update", label: "Modification" },
  { value: "delete", label: "Suppression" },
];

export function PermissionForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  error,
}: SimplePermissionFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    resource: initialData?.resource || "",
    action: initialData?.action || "",
    description: initialData?.description || "",
  });

  const [resources, setResources] = useState<string[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(false);

  // Charger les ressources une seule fois
  useEffect(() => {
    const loadResources = async () => {
      setIsLoadingResources(true);
      try {
        const response = await fetch(`${API}/tables`);
        if (response.ok) {
          const data = await response.json();
          setResources(data);
        }
      } catch (error) {
        console.error("Erreur chargement ressources:", error);
      } finally {
        setIsLoadingResources(false);
      }
    };

    loadResources();
  }, []); // Tableau de dépendances vide = exécuté une seule fois

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div>
        <Label htmlFor="name">Nom de la permission *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          disabled={isSubmitting}
          placeholder="ex: users.read"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="resource">Ressource *</Label>
          <Select
            value={formData.resource}
            onValueChange={(value) => handleChange("resource", value)}
            disabled={isSubmitting || isLoadingResources}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  isLoadingResources
                    ? "Chargement..."
                    : "Sélectionnez une ressource"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {resources.map((resource, key) => (
                <SelectItem key={key} value={resource}>
                  {resource}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="action">Action *</Label>
          <Select
            value={formData.action}
            onValueChange={(value) => handleChange("action", value)}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez une action" />
            </SelectTrigger>
            <SelectContent>
              {actionOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          disabled={isSubmitting}
          rows={3}
          placeholder="Description optionnelle de la permission..."
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={
            isSubmitting ||
            !formData.name ||
            !formData.resource ||
            !formData.action
          }
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData?.id ? "Modifier" : "Créer"}
        </Button>
      </div>
    </form>
  );
}
