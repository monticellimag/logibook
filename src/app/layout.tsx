import type { Metadata } from "next";
import { Inter, Outfit, Roboto_Condensed } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const robotoCondensed = Roboto_Condensed({
  variable: "--font-roboto-condensed",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

export const metadata: Metadata = {
  title: "LogiBook | L'Azienda",
  description: "Piattaforma avanzata per la gestione intelligente dei transiti e prenotazioni slot.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${inter.variable} ${outfit.variable} ${robotoCondensed.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-outfit" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
