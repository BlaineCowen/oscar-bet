import "@/app/globals.css";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Toaster } from "react-hot-toast";
import { Metadata } from "next";
import { Providers } from "@/providers";
import { Navbar } from "@/components/layout/navbar";
import { CoffeeSupport } from "@/components/layout/coffee-support";
import JoinCheck from "@/components/auth/join-check";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Oscar Action",
  description: "Bet on the Oscars with your friends",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16", type: "image/png" },
      { url: "/favicon.ico", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <Providers>
            <Navbar />
            <main className="min-h-screen bg-background">{children}</main>
            <CoffeeSupport />
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "hsl(var(--background))",
                  color: "hsl(var(--foreground))",
                  border: "1px solid hsl(var(--border))",
                },
              }}
            />
            <JoinCheck />
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
}
