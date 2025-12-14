"use client";

import { useState, useMemo, useRef } from "react";
import { useUsers } from "@/hooks/useUsers";
import { useRoles } from "@/hooks/useRoles";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  Users,
  Search,
  ChevronUp,
  ChevronDown,
  Filter,
  X,
  Download,
  Mail,
  UserCircle,
  Shield,
} from "lucide-react";
import { UserModal } from "@/components/users/UserModal";
import { DeleteUserModal } from "@/components/users/DeleteUserModal";
import { User } from "@/lib/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { exportExcel } from "@/lib/xlsxFn";

type SortField = "name" | "email" | "createdAt" | "roles";
type SortDirection = "asc" | "desc";

interface ColumnFilters {
  name: string;
  email: string;
  roles: string;
}

export default function UsersPage() {
  const { usersQuery, createUser, updateUser, deleteUser } = useUsers();
  const { rolesQuery } = useRoles();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  // États pour les nouvelles fonctionnalités
  const [globalSearch, setGlobalSearch] = useState<string>("");
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    name: "",
    email: "",
    roles: "",
  });
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Références pour garder le focus
  const columnFilterRefs = useRef<{
    name: HTMLInputElement | null;
    email: HTMLInputElement | null;
    roles: HTMLInputElement | null;
  }>({
    name: null,
    email: null,
    roles: null,
  });

  const handleCreate = (): void => {
    setSelectedUser(null);
    setError(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: User): void => {
    setSelectedUser(user);
    setError(null);
    setIsModalOpen(true);
  };

  const handleDelete = (user: User): void => {
    setSelectedUser(user);
    setError(null);
    setIsDeleteModalOpen(true);
  };

  const handleCloseModal = (): void => {
    setIsModalOpen(false);
    setError(null);
    setSelectedUser(null);
  };

  const handleCloseDeleteModal = (): void => {
    setIsDeleteModalOpen(false);
    setError(null);
    setSelectedUser(null);
  };

  // Gestion du tri
  const handleSort = (field: SortField): void => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  // Gestion des filtres de colonnes avec conservation du focus
  const handleColumnFilter = (
    column: keyof ColumnFilters,
    value: string
  ): void => {
    const activeElement = document.activeElement as HTMLInputElement;

    setColumnFilters((prev) => ({
      ...prev,
      [column]: value,
    }));
    setCurrentPage(1);

    setTimeout(() => {
      if (activeElement && columnFilterRefs.current[column]) {
        columnFilterRefs.current[column]?.focus();
        if (columnFilterRefs.current[column]) {
          const input = columnFilterRefs.current[column] as HTMLInputElement;
          input.setSelectionRange(input.value.length, input.value.length);
        }
      }
    }, 0);
  };

  // Réinitialiser tous les filtres
  const handleClearFilters = (): void => {
    setGlobalSearch("");
    setColumnFilters({
      name: "",
      email: "",
      roles: "",
    });
    setCurrentPage(1);
  };

  // Filtrage et tri des données
  const filteredAndSortedUsers = useMemo((): User[] => {
    if (!usersQuery.data) return [];

    // Correction: usersQuery.data est déjà un tableau de User
    const usersData: any[] = Array.isArray(usersQuery.data)
      ? usersQuery.data
      : [];

    const filtered = usersData.filter((user: User) => {
      // Filtre global
      const globalMatch =
        globalSearch === "" ||
        user.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
        user.email.toLowerCase().includes(globalSearch.toLowerCase()) ||
        (user.active !== undefined &&
          (user.active ? "actif" : "inactif").includes(
            globalSearch.toLowerCase()
          )) ||
        Boolean(
          user?.roles?.some((userRole) => {
            // Accéder au nom via la relation role
            const roleName =
              userRole.role?.name || userRole.name || userRole.roleName || "";
            return roleName.toLowerCase().includes(globalSearch.toLowerCase());
          })
        );

      // Filtres par colonne
      const nameMatch =
        columnFilters.name === "" ||
        user.name.toLowerCase().includes(columnFilters.name.toLowerCase());
      const emailMatch =
        columnFilters.email === "" ||
        user.email.toLowerCase().includes(columnFilters.email.toLowerCase());
      const rolesMatch =
        columnFilters.roles === "" ||
        Boolean(
          user.roles?.some((userRole) => {
            const roleName =
              userRole.role?.name || userRole.name || userRole.roleName || "";
            return roleName
              .toLowerCase()
              .includes(columnFilters.roles.toLowerCase());
          })
        );

      return Boolean(globalMatch && nameMatch && emailMatch && rolesMatch);
    });

    // Tri
    filtered.sort((a: User, b: User) => {
      let aValue: string | number | Date = "";
      let bValue: string | number | Date = "";

      switch (sortField) {
        case "name":
          aValue = a.name;
          bValue = b.name;
          break;
        case "email":
          aValue = a.email;
          bValue = b.email;
          break;

        case "roles":
          aValue = a.roles?.[0]?.name || "";
          bValue = b.roles?.[0]?.name || "";
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      return 0;
    });

    return filtered;
  }, [usersQuery.data, globalSearch, columnFilters, sortField, sortDirection]);

  // Pagination améliorée avec option "Tout afficher"
  const totalItems: number = filteredAndSortedUsers.length;
  const showAll: boolean = itemsPerPage === -1;
  const totalPages: number = showAll ? 1 : Math.ceil(totalItems / itemsPerPage);
  const startIndex: number = showAll ? 0 : (currentPage - 1) * itemsPerPage;
  const paginatedUsers: User[] = showAll
    ? filteredAndSortedUsers
    : filteredAndSortedUsers.slice(startIndex, startIndex + itemsPerPage);

  const displayError: string | null =
    error || usersQuery.error?.message || null;

  // Vérifier s'il y a des filtres actifs
  const hasActiveFilters: boolean =
    globalSearch !== "" ||
    Object.values(columnFilters).some((filter) => filter !== "");

  // Fonction d'export Excel
  const handleExport = () => {
    if (paginatedUsers.length === 0) {
      console.warn("Aucune donnée à exporter");
      return;
    }
    exportExcel("users-table", "Users");
  };

  // Composant d'en-tête de colonne avec tri amélioré
  const SortableHeader = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <TableHead
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1 group">
        {children}
        <div className="flex flex-col">
          <ChevronUp
            className={`h-3 w-3 -mb-1 ${
              sortField === field && sortDirection === "asc"
                ? "text-primary"
                : "text-muted-foreground opacity-40"
            }`}
          />
          <ChevronDown
            className={`h-3 w-3 -mt-1 ${
              sortField === field && sortDirection === "desc"
                ? "text-primary"
                : "text-muted-foreground opacity-40"
            }`}
          />
        </div>
      </div>
    </TableHead>
  );

  if (usersQuery.isLoading || rolesQuery.isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Gestion des utilisateurs
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez les utilisateurs et leurs rôles
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Bouton d'export Excel */}
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={filteredAndSortedUsers.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exporter
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel utilisateur
          </Button>
        </div>
      </div>

      {displayError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{displayError}</AlertDescription>
        </Alert>
      )}

      {/* Barre de recherche globale améliorée */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, email, rôles ou statut..."
              value={globalSearch}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setGlobalSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Effacer les filtres
            </Button>
          )}
        </div>

        {hasActiveFilters && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>Filtres actifs</span>
            {globalSearch && (
              <Badge variant="secondary" className="text-xs">
                Recherche: {globalSearch}
              </Badge>
            )}
            {Object.entries(columnFilters).map(
              ([key, value]) =>
                value && (
                  <Badge key={key} variant="secondary" className="text-xs">
                    {key}: {value}
                  </Badge>
                )
            )}
          </div>
        )}
      </div>

      {/* Contrôles de pagination en haut améliorés */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Afficher</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value: string) => {
                const newItemsPerPage = value === "all" ? -1 : Number(value);
                setItemsPerPage(newItemsPerPage);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="all">Tout afficher</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              {showAll ? "éléments" : "éléments par page"}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            {totalItems} utilisateur(s) trouvé(s)
            {!showAll &&
              totalPages > 1 &&
              ` • Page ${currentPage}/${totalPages}`}
          </span>
        </div>

        {/* Info d'export */}
        {filteredAndSortedUsers.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {filteredAndSortedUsers.length} ligne(s) exportable(s)
          </div>
        )}
      </div>

      <div className="border rounded-lg bg-card">
        <Table id="users-table">
          <TableHeader>
            <TableRow>
              <TableCell className="w-12">#</TableCell>
              <SortableHeader field="name">
                <div className="space-y-2">
                  <div className="font-medium flex items-center gap-1">
                    <UserCircle className="h-3.5 w-3.5" />
                    Nom
                  </div>
                  <Input
                    ref={(el: HTMLInputElement | null) => {
                      columnFilterRefs.current.name = el;
                    }}
                    placeholder="Filtrer..."
                    value={columnFilters.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleColumnFilter("name", e.target.value)
                    }
                    className="h-7 text-xs"
                    onClick={(e: React.MouseEvent<HTMLInputElement>) =>
                      e.stopPropagation()
                    }
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                      }
                    }}
                  />
                </div>
              </SortableHeader>

              <SortableHeader field="email">
                <div className="space-y-2">
                  <div className="font-medium flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </div>
                  <Input
                    ref={(el: HTMLInputElement | null) => {
                      columnFilterRefs.current.email = el;
                    }}
                    placeholder="Filtrer..."
                    value={columnFilters.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleColumnFilter("email", e.target.value)
                    }
                    className="h-7 text-xs"
                    onClick={(e: React.MouseEvent<HTMLInputElement>) =>
                      e.stopPropagation()
                    }
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                      }
                    }}
                  />
                </div>
              </SortableHeader>

              <TableCell>
                <div className="space-y-2">
                  <div className="font-medium">Statut</div>
                </div>
              </TableCell>

              <SortableHeader field="roles">
                <div className="space-y-2">
                  <div className="font-medium flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5" />
                    Rôles
                  </div>
                  <Input
                    ref={(el: HTMLInputElement | null) => {
                      columnFilterRefs.current.roles = el;
                    }}
                    placeholder="Filtrer..."
                    value={columnFilters.roles}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleColumnFilter("roles", e.target.value)
                    }
                    className="h-7 text-xs"
                    onClick={(e: React.MouseEvent<HTMLInputElement>) =>
                      e.stopPropagation()
                    }
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                      }
                    }}
                  />
                </div>
              </SortableHeader>

              <TableHead className="text-right">
                <span className="font-medium">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-10 text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-12 w-12 opacity-20" />
                    {usersQuery.data?.length === 0
                      ? "Aucun utilisateur trouvé"
                      : "Aucun résultat correspondant aux filtres"}
                    {filteredAndSortedUsers.length === 0 &&
                      usersQuery.data &&
                      usersQuery.data.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleClearFilters}
                          className="mt-2"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Effacer les filtres
                        </Button>
                      )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((user: User, index: number) => (
                <TableRow key={user.id} className="hover:bg-muted/50">
                  <TableCell className="text-muted-foreground">
                    {startIndex + index + 1}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">{user.name}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.active ? "default" : "secondary"}
                      className={
                        user.active
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                      }
                    >
                      {user.active ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {user.roles?.map((role, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {role.name}
                        </Badge>
                      ))}
                      {(!user.roles || user.roles.length === 0) && (
                        <span className="text-muted-foreground/50 text-xs">
                          Aucun rôle
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(user)}
                        className="h-8 w-8 p-0"
                        disabled={updateUser.isPending}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(user)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        disabled={deleteUser.isPending}
                      >
                        {deleteUser.isPending &&
                        selectedUser?.id === user.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination en bas améliorée */}
      {!showAll && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
          <div className="text-sm text-muted-foreground">
            Affichage de <strong>{startIndex + 1}</strong> à{" "}
            <strong>{Math.min(startIndex + itemsPerPage, totalItems)}</strong>{" "}
            sur <strong>{totalItems}</strong> utilisateurs
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev: number) => Math.max(prev - 1, 1))
              }
              disabled={currentPage === 1}
              className="flex items-center gap-1"
            >
              <ChevronDown className="h-4 w-4 rotate-90" />
              Précédent
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (currentPage <= 4) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = currentPage - 3 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev: number) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="flex items-center gap-1"
            >
              Suivant
              <ChevronUp className="h-4 w-4 rotate-90" />
            </Button>
          </div>
        </div>
      )}

      <UserModal
        open={isModalOpen}
        onClose={handleCloseModal}
        user={selectedUser}
        roles={rolesQuery.data || []}
        createUser={createUser}
        updateUser={updateUser}
      />

      <DeleteUserModal
        open={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        user={selectedUser}
        deleteUser={deleteUser}
      />
    </div>
  );
}
