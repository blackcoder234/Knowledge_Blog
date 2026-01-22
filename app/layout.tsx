import { Analytics } from "@vercel/analytics/react";
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

export const metadata: Metadata = {
  metadataBase: new URL("https://knowledgelog.blog"),
  title: {
    default: "KnowledgeLog | Insights for the Modern Developer",
    template: "%s | KnowledgeLog",
  },
  description:
    "A premium destination for in-depth tech analysis, coding tutorials, and industry insights.",
  openGraph: {
    title: "KnowledgeLog",
    description: "Insights for the Modern Developer",
    url: "https://knowledgelog.blog",
    siteName: "KnowledgeLog",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KnowledgeLog",
    description: "Insights for the Modern Developer",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "LGlet2ea5c-cEiDOaxycV-yBBJYjISLFCKOfIms_800",
  },
};

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
              <Analytics />
            </Suspense>
            <MaintenanceGate>{children}</MaintenanceGate>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
