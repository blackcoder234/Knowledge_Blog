import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Space_Grotesk, Lora } from "next/font/google";
import "./globals.css";
import "./styles/typography-balanced.css";
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
    alternates: {
      canonical: "https://www.knowledgelog.blog",
      types: {
        "application/rss+xml": "https://www.knowledgelog.blog/feed.xml",
      },
    },
    openGraph: {
      title: siteTitle,
      description: siteTagline,
      url: "https://www.knowledgelog.blog",
      siteName: siteTitle,
      locale: "en_US",
      type: "website",
      images: [
        {
          url: "https://www.knowledgelog.blog/images/Amarnath_Bera.jpg",
          width: 1200,
          height: 630,
          alt: `${siteTitle} - ${siteTagline}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description: siteTagline,
      images: ["https://www.knowledgelog.blog/images/Amarnath_Bera.jpg"],
    },
    robots: {
      index: isIndexed,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
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

  const siteSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://www.knowledgelog.blog/#organization",
        name: "KnowledgeLog",
        url: "https://www.knowledgelog.blog",
        logo: {
          "@type": "ImageObject",
          "@id": "https://www.knowledgelog.blog/#logo",
          url: "https://www.knowledgelog.blog/icon.png",
          caption: "KnowledgeLog Logo",
        },
        founder: {
          "@type": "Person",
          name: "Amarnath Bera",
          url: "https://amaranathbera.in",
        },
        sameAs: [
          "https://x.com/beraamarnath5",
          "https://github.com/blackcoder234",
          "https://www.linkedin.com/in/amarnath-bera/",
        ],
      },
      {
        "@type": "WebSite",
        "@id": "https://www.knowledgelog.blog/#website",
        url: "https://www.knowledgelog.blog",
        name: "KnowledgeLog",
        description: "Science, Tech & Future Insights",
        publisher: {
          "@id": "https://www.knowledgelog.blog/#organization",
        },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate:
              "https://www.knowledgelog.blog/blog?q={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema) }}
        />
      </head>
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
