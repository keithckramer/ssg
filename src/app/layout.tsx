import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/context/AuthContext";
import { SportsSticksProvider } from "@/components/providers/SportsSticksProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sports Stick Game",
  description: "Sports Stick Game Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <SportsSticksProvider>
          <AuthProvider>
            <div className="app-shell">
              <Navbar />
              <main className="app-main">{children}</main>
            </div>
          </AuthProvider>
        </SportsSticksProvider>
      </body>
    </html>
  );
}
