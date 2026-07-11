import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "@/components/common/Navbar";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "BongoLipi — Bangla Made Simple",
  description:
    "Convert Banglish to Bangla, write and share content, and chat in Bangla — all in one warm, community-driven app.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-poppins antialiased bg-background text-foreground min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClerkProvider dynamic>
            <Navbar />
            {children}
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  background: "hsl(var(--card))",
                  color: "hsl(var(--card-foreground))",
                  border: "1px solid hsl(var(--border))",
                },
              }}
            />
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
