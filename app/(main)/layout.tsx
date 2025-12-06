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
      <div className="flex  w-screen overflow-hidden  ">
        {/* ---------- Sidebar (colonne gauche) ---------- */}
        <AppSidebar />

        {/* ---------- Contenu principal (colonne droite) ---------- */}
        <div className="flex flex-col flex-1 my-2 me-2">
          {/* Header horizontal */}
          <Navbar />
          {/* Contenu principal */}
          <main className="flex-1 overflow-y-hidden border rounded-b-md p-2">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
