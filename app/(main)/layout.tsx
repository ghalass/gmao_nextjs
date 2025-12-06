import { AppSidebar } from "@/components/AppSidebar";
import Navbar from "@/components/Navbar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      {/* ----- STRUCTURE GLOBALE : sidebar + contenu principal ----- */}
      <div className="flex min-h-screen max-w-[100vw] overflow-x-hidden">
        {/* ---------- Sidebar (colonne gauche) ---------- */}
        <AppSidebar />

        {/* ---------- Contenu principal (colonne droite) ---------- */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Header horizontal */}
          <Navbar />
          {/* Contenu principal avec scroll */}
          <main className="flex-1 overflow-y-auto p-3 md:p-4">
            <div className="min-h-full rounded-lg border bg-background p-4">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
