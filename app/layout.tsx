import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import QueryProvider from "@/components/QueryProviser";
import { APP_NAME } from "@/lib/constantes";

const cairo = Cairo({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  preload: true,
});

export const metadata: Metadata = {
  title: APP_NAME,
  description:
    "GMAO-PRO est une application web pour gestion de la maintenance assisté par ordinateur",
  authors: { name: "GHALASS", url: "ghalass.com" },
  icons: {
    icon: "/images/wrench.png", // This sets the favicon
    // icon: "/favicon.ico", // This sets the favicon
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${cairo.className}`}>
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <Toaster position="top-center" />
            {children}
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
