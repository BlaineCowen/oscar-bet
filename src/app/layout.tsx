import { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/layout/navbar";
import { Toaster } from "sonner";
import JoinCheck from "@/components/auth/join-check";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Oscar Action",
  description: "Bet on Oscar winners with your friends",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <Navbar />
          <main className="min-h-screen bg-background">{children}</main>
          <Toaster position="top-right" />
          <JoinCheck />
        </Providers>
      </body>
    </html>
  );
}
