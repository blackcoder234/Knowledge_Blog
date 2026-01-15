import type { Metadata } from "next";
import localFont from "next/font/local";
import { Inter, Space_Grotesk } from 'next/font/google'
import "./globals.css";
import { AuthProvider } from "./providers";
import { ToastProvider } from "./context/ToastContext";
import { VisitorTracker } from "./components/VisitorTracker";

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' })


export const metadata: Metadata = {
  title: "KnowledgeLog - Tech & Future Blog",
  description: "A fullstack blog website for sharing knowledge about the future of technology, AI, and science.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} antialiased font-sans bg-background text-white`}
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
