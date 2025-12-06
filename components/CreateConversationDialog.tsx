// components/CreateConversationDialog.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
// import { useToast } from "@/hooks/use-toast";

interface CreateConversationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateConversation: (participantIds: string[]) => void;
  isLoading: boolean;
  currentUserId: string;
}

export function CreateConversationDialog({
  isOpen,
  onOpenChange,
  onCreateConversation,
  isLoading,
  currentUserId,
}: CreateConversationDialogProps) {
  //   const { toast } = useToast();
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    []
  );
  const [searchTerm, setSearchTerm] = useState("");

  // Récupérer les utilisateurs disponibles
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["available-users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
    enabled: isOpen,
  });

  // Filtrer les utilisateurs
  const filteredUsers = users.filter(
    (user: any) =>
      user.id !== currentUserId &&
      (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleToggleParticipant = (userId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreateConversation = () => {
    if (selectedParticipants.length === 0) {
      toast("Sélectionnez au moins un participant");
      return;
    }

    onCreateConversation(selectedParticipants);
    setSelectedParticipants([]);
    setSearchTerm("");
  };

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setSelectedParticipants([]);
      setSearchTerm("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nouvelle conversation</DialogTitle>
          <DialogDescription>
            Sélectionnez les utilisateurs avec qui vous voulez discuter
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Champ de recherche */}
          <div>
            <Label htmlFor="search" className="text-sm">
              Rechercher des utilisateurs
            </Label>
            <Input
              id="search"
              placeholder="Nom ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isLoadingUsers}
              className="mt-1"
            />
          </div>

          {/* Liste des utilisateurs */}
          <div>
            <Label className="text-sm">
              Participants sélectionnés ({selectedParticipants.length})
            </Label>
            <ScrollArea className="h-64 border border-gray-200 rounded-lg mt-2">
              <div className="p-4 space-y-3">
                {isLoadingUsers ? (
                  <p className="text-sm text-gray-500 text-center">
                    Chargement des utilisateurs...
                  </p>
                ) : filteredUsers.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center">
                    Aucun utilisateur trouvé
                  </p>
                ) : (
                  filteredUsers.map((user: any) => (
                    <div
                      key={user.id}
                      className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded cursor-pointer"
                      onClick={() => handleToggleParticipant(user.id)}
                    >
                      <Checkbox
                        checked={selectedParticipants.includes(user.id)}
                        onCheckedChange={() => handleToggleParticipant(user.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreateConversation}
              disabled={
                isLoading || selectedParticipants.length === 0 || isLoadingUsers
              }
            >
              {isLoading ? "Création..." : "Créer la conversation"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
