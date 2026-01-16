import type { Metadata } from "next";
import localFont from "next/font/local";
import { Inter, Space_Grotesk, Lora } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./providers";
import { ToastProvider } from "./context/ToastContext";
import { VisitorTracker } from "./components/VisitorTracker";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
});
const lora = Lora({ subsets: ["latin"], variable: "--font-lora" });

export const metadata: Metadata = {
  title: {
    default: "KnowledgeLog - Tech, Science & Culture",
    template: "%s | KnowledgeLog",
  },
  alternates: {
    canonical: "./",
  },
  description:
    "A digital publication decoding the signals in Technology, Science, and Culture. Deep dives into the ideas shaping our world.",
  keywords: [
    "technology",
    "science",
    "culture",
    "philosophy",
    "future",
    "editorial",
    "blog",
    "analysis",
  ],
  authors: [{ name: "KnowledgeLog Team", url: "https://knowledgelog.blog" }],
  creator: "KnowledgeLog",
  metadataBase: new URL("https://knowledgelog.blog"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://knowledgelog.blog",
    title: "KnowledgeLog - Tech, Science & Culture",
    description:
      "A digital publication decoding the signals in Technology, Science, and Culture.",
    siteName: "KnowledgeLog",
    images: [
      {
        url: "/images/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "KnowledgeLog - Clarity in a Noise World",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KnowledgeLog - Tech, Science & Culture",
    description:
      "A digital publication decoding the signals in Technology, Science, and Culture.",
    images: ["/images/og-default.jpg"],
    creator: "@knowledgelog",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "YOUR_GOOGLE_VERIFICATION_CODE", // Replace this after getting code from GSC
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
            <VisitorTracker />
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
