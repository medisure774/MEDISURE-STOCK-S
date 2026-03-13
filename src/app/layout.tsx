import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Medisure Plus | Stock Management",
  description: "Internal daily stock and order management system for Medisure Plus.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="flex min-h-screen bg-brand-bg">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <Header />
              <main className="flex-1 p-8 overflow-y-auto">
                {children}
              </main>
              <footer className="py-8 px-10 border-t border-brand-border text-sm text-brand-secondary bg-white">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <p>&copy; {new Date().getFullYear()} Medisure Plus. All rights reserved.</p>
                  <p className="font-bold text-brand-accent italic">Reliable Healthcare Distribution</p>
                </div>
              </footer>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
