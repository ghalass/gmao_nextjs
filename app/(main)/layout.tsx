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
      <div className="flex w-screen h-screen overflow-hidden bg-muted/40">
        {/* ---- Sidebar ---- */}
        <AppSidebar />

        {/* ---- Contenu principal ---- */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Navbar */}
          <div className="sticky top-0 z-20 bg-background/70 backdrop-blur-md border-b mt-2 mr-2">
            <Navbar />
          </div>

          {/* Contenu */}
          <main
            className="
              flex-1 overflow-y-auto 
              p-4 
              bg-background 
              rounded-b-lg 
              shadow-inner
              border
              mb-2 mr-2
            "
          >
            <div className="max-w-[1600px] mx-auto ">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
