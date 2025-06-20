import { type Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { WorkspaceProvider } from "@/components/providers/workspace-provider";
import { Topbar } from "@/components/layout/topbar";
import { Toaster } from "sonner";
import { Provider as JotaiProvider } from "jotai";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Project Hub",
  description: "Organize your projects, tasks, docs, and timeline in one place",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up">
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <JotaiProvider>
              <QueryProvider>
                <WorkspaceProvider>
                  <Topbar />
                  {children}
                  <Toaster />
                </WorkspaceProvider>
              </QueryProvider>
            </JotaiProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
