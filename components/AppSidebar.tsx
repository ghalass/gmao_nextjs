"use client";

import {
  Home,
  InfoIcon,
  Settings,
  ChevronDown,
  Users,
  MapPin,
  Truck,
  Shield,
  FileText,
  ShieldUser,
  LockKeyhole,
  Wrench,
  ListOrdered,
  Tractor,
  Car,
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
  {
    title: "À propos",
    url: "/about",
    icon: InfoIcon,
    description: "Informations sur l'application",
  },
];

const configItems = [
  {
    title: "Saisie des Performances",
    url: "/performances",
    icon: Truck,
    description: "Gérer les performances des engins",
  },
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
  {
    title: "Origies des pannes",
    url: "/origine_pannes",
    icon: ListOrdered,
    description: "Gérer les origines des pannes",
  },
  {
    title: "Niveaux d'urgence",
    url: "/niveau-urgences",
    icon: ListOrdered,
    description: "Gérer les niveaux des urgences",
  },
  {
    title: "Sites",
    url: "/sites",
    icon: MapPin,
    description: "Gérer les sites",
  },
];

const adminItems = [
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
    title: "Ressources",
    url: "/resources",
    icon: FileText,
    description: "Gérer les ressources",
  },
];

// Hook personnalisé pour la navigation active
import { usePathname } from "next/navigation";

function useActivePath() {
  const pathname = usePathname();

  return (url: string) => {
    if (url === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(url);
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
                        "transition-all duration-200 hover:bg-accent",
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

              {/* Section Configurations */}
              <Collapsible className="group/collapsible" defaultOpen={false}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      className="w-full justify-between hover:bg-accent transition-all duration-200"
                      tooltip="Paramètres et configurations"
                    >
                      <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        <span>Configurations</span>
                      </div>
                      <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180 text-muted-foreground" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarMenuSub className="mt-1">
                      <SidebarMenuSubItem>
                        {configItems.map((item) => {
                          const isActive = isActivePath(item.url);
                          return (
                            <SidebarMenuButton
                              key={item.title}
                              asChild
                              isActive={isActive}
                              className={cn(
                                "pl-4 transition-all duration-200 hover:bg-accent",
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

              {/* Section Administration */}
              <Collapsible className="group/collapsible" defaultOpen={false}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      className="w-full justify-between hover:bg-accent transition-all duration-200"
                      tooltip="Administration du système"
                    >
                      <div className="flex items-center gap-2">
                        <LockKeyhole className="w-4 h-4" />
                        <span>Administration</span>
                      </div>
                      <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180 text-muted-foreground" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="CollapsibleContent">
                    <SidebarMenuSub className="mt-1">
                      <SidebarMenuSubItem>
                        {adminItems.map((item) => {
                          const isActive = isActivePath(item.url);
                          return (
                            <SidebarMenuButton
                              key={item.title}
                              asChild
                              isActive={isActive}
                              className={cn(
                                "pl-4 transition-all duration-200 hover:bg-accent",
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
