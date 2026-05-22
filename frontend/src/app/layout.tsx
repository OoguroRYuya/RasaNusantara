import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import Link from "next/link";
import { BookOpen, Search, Code, Network } from "lucide-react";

export const metadata: Metadata = {
  title: "Pustaka Rasa Nusantara | Pencarian Semantik Kuliner",
  description: "Sistem Pencarian Semantik Istilah Kuliner Tradisional & Etimologinya Berbasis Web dengan RDF dan SPARQL",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      style={{ colorScheme: 'dark' }}
    >
      <body className="min-h-full flex flex-col bg-stone-950 text-stone-300">
        <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-stone-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-stone-950/60">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-amber-500 font-bold text-lg hover:text-amber-400 transition-colors">
              <BookOpen size={24} />
              <span>Rasa Nusantara</span>
            </Link>
            
            <nav className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2 text-sm font-medium text-stone-400 hover:text-white transition-colors">
                <Search size={16} />
                <span className="hidden sm:inline">Pencarian</span>
              </Link>
              <Link href="/ontology" className="flex items-center gap-2 text-sm font-medium text-stone-400 hover:text-white transition-colors">
                <Network size={16} />
                <span className="hidden sm:inline">Ontologi</span>
              </Link>
              <Link href="/sparql" className="flex items-center gap-2 text-sm font-medium text-stone-400 hover:text-white transition-colors">
                <Code size={16} />
                <span className="hidden sm:inline">SPARQL</span>
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
