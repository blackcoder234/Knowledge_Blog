import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Space_Grotesk, Lora } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./providers";
import { ToastProvider } from "./context/ToastContext";
import ClientTracker from "./components/ClientTracker";
import MaintenanceGate from "./components/MaintenanceGate";
import dbConnect from "@/lib/db";
import Setting from "@/models/Setting";
import { GoogleAnalytics } from "@next/third-parties/google";
import { GlobalNotificationObserver } from "./components/GlobalNotificationObserver";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
});
const lora = Lora({ subsets: ["latin"], variable: "--font-lora" });

export async function generateMetadata(): Promise<Metadata> {
  let isIndexed = true;
  let siteTitle = "KnowledgeLog";
  let siteTagline = "Science, Tech & Future Insights";

  try {
    await dbConnect();
    const settings = await Setting.find({
      key: { $in: ["public_indexing", "site_title", "site_tagline"] },
    });
    const config = settings.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    isIndexed = config.public_indexing !== false;
    siteTitle = config.site_title || "KnowledgeLog";
    siteTagline = config.site_tagline || "Science, Tech & Future Insights";
  } catch (error) {
    console.error("Metadata fetch failed:", error);
  }

  const fullDescription = siteTagline;

  return {
    metadataBase: new URL("https://www.knowledgelog.blog"),
    title: {
      default: `${siteTitle} | ${siteTagline}`,
      template: `%s | ${siteTitle}`,
    },
    description: fullDescription,
    openGraph: {
      title: siteTitle,
      description: siteTagline,
      url: "https://www.knowledgelog.blog",
      siteName: siteTitle,
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description: siteTagline,
    },
    robots: {
      index: isIndexed,
      follow: true,
    },
    verification: {
      google: "LGlet2ea5c-cEiDOaxycV-yBBJYjISLFCKOfIms_800",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let gaId = "";
  try {
    await dbConnect();
    const gaSetting = await Setting.findOne({ key: "ga_measurement_id" });
    gaId = gaSetting?.value || "";
  } catch (error) {
    console.error("Layout settings fetch failed:", error);
  }

  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${lora.variable} antialiased font-sans bg-background text-white`}
      >
        {gaId && <GoogleAnalytics gaId={gaId} />}
        <AuthProvider>
          <ToastProvider>
            <GlobalNotificationObserver />
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
