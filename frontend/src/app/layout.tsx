import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileBottomCTA from "@/components/layout/MobileBottomCTA";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/lib/i18n";
import { Toaster } from "sonner";
import ServiceWorkerRegistration from "@/components/pwa/ServiceWorkerRegistration";
import InstallPWAButton from "@/components/pwa/InstallPWAButton";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "SAHA Transport & Logistics – Un colis, un sourire…",
  description:
    "Transport de colis, fûts, véhicules et marchandises vers le Cameroun. Ramassages en Europe, livraison à Douala, Yaoundé, Bafoussam.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#C62828",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <LanguageProvider>
          <AuthProvider>
            <Header />
            <main className="min-h-screen">{children}</main>
            <Footer />
            <MobileBottomCTA />
            <ServiceWorkerRegistration />
            <InstallPWAButton />
            <Toaster position="top-center" richColors />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
