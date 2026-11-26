import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DirectionProvider } from "@/components/foundations/direction/direction";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Topsell Admin Dashboard",
  description: "Dashboard pengelolaan penjualan dan konfigurasi checkout Topsell Belanja",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" dir="ltr" className={inter.variable}>
      <body className="bg-background-full font-sans text-text-primary antialiased">
        <DirectionProvider locale="id-ID">
          {children}
          <Toaster />
        </DirectionProvider>
      </body>
    </html>
  );
}
