import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EduInv - Gestión de Inventario Escolar",
  description: "Sistema de gestión de inventario para centros educativos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full bg-white">
      <body className={`${inter.className} h-full`}>{children}</body>
    </html>
  );
}
