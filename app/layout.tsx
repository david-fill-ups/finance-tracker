import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import Nav from "@/components/nav";
import { Toaster } from "sonner";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "Finance Tracker",
  description: "Household cashflow planning and allocation",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    return (
      <html lang="en">
        <body className={`${geist.variable} font-sans bg-slate-950 text-slate-100 antialiased`}>
          {children}
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body className={`${geist.variable} font-sans bg-slate-950 text-slate-100 antialiased`}>
        <div className="min-h-screen flex flex-col">
          <Nav user={session.user!} />
          <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">{children}</main>
        </div>
        <Toaster theme="dark" position="bottom-right" />
      </body>
    </html>
  );
}
