import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zonage Conventionnel Infirmier - CartoSante",
  description:
    "Decouvrez le zonage conventionnel infirmier de votre commune. Recherchez votre ville et consultez les aides disponibles pour les infirmieres liberales (IDEL).",
  keywords: [
    "zonage infirmier",
    "IDEL",
    "infirmiere liberale",
    "installation infirmiere",
    "zone sous-dotee",
    "conventionnement infirmier",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  );
}
