import type { Metadata } from "next";
import { Suspense } from "react";
import localFont from "next/font/local";
import { Inter, Space_Grotesk, Lora } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./providers";
import { ToastProvider } from "./context/ToastContext";
import ClientTracker from "./components/ClientTracker";
import MaintenanceGate from "./components/MaintenanceGate";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
});
const lora = Lora({ subsets: ["latin"], variable: "--font-lora" });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${lora.variable} antialiased font-sans bg-background text-white`}
      >
        <AuthProvider>
          <ToastProvider>
            <Suspense fallback={null}>
              <ClientTracker />
            </Suspense>
            <MaintenanceGate>{children}</MaintenanceGate>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
