import "@/app/globals.css";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import { Metadata } from "next";
import { Providers } from "@/providers";
import { Navbar } from "@/components/layout/navbar";
import JoinCheck from "@/components/auth/join-check";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Oscar Bet",
  description: "Bet on the Oscars with your friends",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Providers>
            <Navbar />
            <main className="min-h-screen bg-background">{children}</main>
            <Toaster />
            <JoinCheck />
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
}
