import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Srivalli SmartSpeak \u2013 Speak Clearly. Think Creatively. Shine Confidently.",
  description: "Professional skill-development platform for students. Public Speaking and Content Writing programs. Speak Clearly, Think Creatively, Shine Confidently.",
  keywords: ["Srivalli SmartSpeak", "public speaking", "content writing", "communication skills", "online classes", "student development", "confidence building"],
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>\ud83c\udf38</text></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${nunito.variable} font-sans antialiased bg-background text-foreground`}
      >
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-primary focus:font-bold"
        >
          Skip to main content
        </a>
        <main id="main-content" tabIndex={-1} className="outline-none flex-1 flex flex-col min-h-screen">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}