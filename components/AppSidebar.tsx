"use client";

import {
  Home,
  Settings,
  ChevronDown,
  Users,
  MapPin,
  Truck,
  Shield,
  ShieldUser,
  LockKeyhole,
  Wrench,
  ListOrdered,
  Tractor,
  Car,
  FormInputIcon,
  Gauge,
  Puzzle,
  FileUpIcon,
  FolderCog2Icon,
  CalendarCheck,
  Ungroup,
  NotepadText,
  BookOpenCheck,
  Boxes,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { cn } from "@/lib/utils";

// Menu items
const mainItems = [
  {
    title: "Accueil",
    url: "/",
    icon: Home,
    description: "Tableau de bord principal",
  },
];

const configItems = {
  title: "Configurations",
  icon: Settings,

  list: [
    {
      title: "Engin",
      url: "/engins",
      icon: Truck,
      description: "Gérer les engins",
    },
    {
      title: "Parc",
      url: "/parcs",
      icon: Car,
      description: "Gérer les parcs",
    },
    {
      title: "Type de parc",
      url: "/typeparcs",
      icon: Tractor,
      description: "Gérer les type des parcs",
    },
    {
      title: "Sites",
      url: "/sites",
      icon: MapPin,
      description: "Gérer les sites",
    },
    {
      title: "Panne",
      url: "/pannes",
      icon: Wrench,
      description: "Gérer les pannes",
    },
    {
      title: "Type de panne",
      url: "/typepannes",
      icon: ListOrdered,
      description: "Gérer les type des pannes",
    },
  ],
};

const saisieItems = {
  title: "Gestion de saisie",
  icon: Settings,

  list: [
    {
      title: "Journalier",
      url: "/saisies",
      icon: Truck,
      description: "Gérer les saisies des engins",
    },
  ],
};

const backlogItems = {
  title: "Gestion des backlog",
  icon: Wrench,
  list: [
    {
      title: "Dashboard",
      url: "/anomalies/stats",
      icon: Gauge,
      description: "Dashboard",
    },
    {
      title: "Backlog",
      url: "/anomalies",
      icon: Wrench,
      description: "Gestion des anomalies",
    },
  ],
};

const rapportsItems = {
  title: "Rapports",
  icon: FolderCog2Icon,

  list: [
    {
      title: "RJE",
      url: "/rapports/rje",
      icon: CalendarCheck,
      description: "RJE",
    },
    {
      title: "Unité physique",
      url: "/rapports/unite-physique",
      icon: Ungroup,
      description: "Unité physique",
    },
    {
      title: "Etat Mensuel",
      url: "/rapports/etat-mensuel",
      icon: NotepadText,
      description: "Etat Mensuel",
    },
    {
      title: "Analyse Indispo",
      url: "/rapports/analyse-indispo-parc",
      icon: BookOpenCheck,
      description: "analyse-indispo",
    },
    {
      title: "Etat Général",
      url: "/rapports/etat-general",
      icon: Boxes,
      description: "etat-general",
    },
  ],
};

const gestionOrganesItems = {
  title: "Gestion des organes",
  icon: Puzzle,
  list: [
    {
      title: "Organes",
      url: "/organes",
      icon: FormInputIcon,
      description: "Gestion des organes",
    },
  ],
};

const adminItems = {
  title: "Administrateur",
  icon: LockKeyhole,

  list: [
    {
      title: "Utilisateurs",
      url: "/users",
      icon: Users,
      description: "Gérer les utilisateurs",
    },
    {
      title: "Rôles",
      url: "/roles",
      icon: Shield,
      description: "Gérer les rôles",
    },
    {
      title: "Permissions",
      url: "/permissions",
      icon: ShieldUser,
      description: "Gérer les permissions",
    },
    {
      title: "Importations",
      url: "/importations",
      icon: FileUpIcon,
      description: "Gérer les importations",
    },
  ],
};

const allItems = [
  saisieItems,
  rapportsItems,
  backlogItems,
  gestionOrganesItems,
  configItems,
  adminItems,
];

// Hook personnalisé pour la navigation active
import { usePathname } from "next/navigation";

function useActivePath() {
  const pathname = usePathname();

  return (url: string) => {
    if (url === "/") {
      return pathname === "/";
    }
    return pathname === url;
  };
}

export function AppSidebar() {
  const isActivePath = useActivePath();
  return (
    <Sidebar variant="floating" collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Liens principaux */}
              {mainItems.map((item) => {
                const isActive = isActivePath(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.description}
                      isActive={isActive}
                      className={cn(
                        "transition-all duration-200 hover:bg-accent mb-1",
                        isActive &&
                          "bg-accent text-accent-foreground font-medium"
                      )}
                    >
                      <Link href={item.url}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                        {isActive && (
                          <div className="ml-auto w-1 h-4 bg-primary rounded-full" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              <hr className="my-1" />
              {/* ALL */}
              {allItems.map((theItem, index) => (
                <Collapsible
                  key={index}
                  className="group/collapsible"
                  defaultOpen={false}
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        className="w-full justify-between hover:bg-accent transition-all duration-200"
                        tooltip={theItem.title}
                      >
                        <div className="flex items-center gap-2">
                          <theItem.icon className="w-4 h-4" />
                          <span
                            className={cn(
                              "transition-all duration-200",
                              "group-data-[collapsible=icon]:hidden"
                            )}
                          >
                            {theItem.title}
                          </span>
                        </div>
                        <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180 text-muted-foreground" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="CollapsibleContent">
                      <SidebarMenuSub className="mt-1">
                        <SidebarMenuSubItem>
                          {theItem.list.map((item) => {
                            const isActive = isActivePath(item.url);
                            return (
                              <SidebarMenuButton
                                key={item.title}
                                asChild
                                isActive={isActive}
                                className={cn(
                                  "pl-4 transition-all duration-200 hover:bg-accent mb-1",
                                  isActive &&
                                    "bg-accent text-accent-foreground font-medium"
                                )}
                                tooltip={item.description}
                              >
                                <Link href={item.url}>
                                  <item.icon className="w-4 h-4" />
                                  <span>{item.title}</span>
                                  {isActive && (
                                    <div className="ml-auto w-1 h-3 bg-primary rounded-full" />
                                  )}
                                </Link>
                              </SidebarMenuButton>
                            );
                          })}
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ))}
            </SidebarMenu>

            {/*  */}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
