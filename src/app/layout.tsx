import "~/styles/globals.css";
import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { TRPCReactProvider } from "~/trpc/react";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "~/components/ui/sonner";
import { ThemeProvider } from "~/components/theme/theme-provider";
import { ThemePersonalizationProvider } from "~/components/theme/theme-personalization";
import { THEME_INIT_SCRIPT } from "~/lib/theme";

export const metadata: Metadata = {
  title: "StudyPal",
  description: "Platform belajar interaktif — Quiz, Flashcard, Mindmap",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={geist.variable} suppressHydrationWarning>
      <head>
        {/* Terapkan tema kustom sebelum paint untuk mencegah flash */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider>
          <SessionProvider>
            <TRPCReactProvider>
              <ThemePersonalizationProvider>
                {children}
                <Toaster />
              </ThemePersonalizationProvider>
            </TRPCReactProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
