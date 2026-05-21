import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Freitir",
  description: "Transport execution intelligence",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {user && (
          <header className="border-b border-slate-200 bg-white px-8 py-3 flex items-center justify-between">
            <span className="text-xs text-slate-400">{user.email}</span>
            <SignOutButton />
          </header>
        )}
        {children}
      </body>
    </html>
  );
}
