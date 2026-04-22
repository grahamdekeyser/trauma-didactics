import type { Metadata } from "next";
import { Lora } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Trauma Didactics — OHSU Orthopaedic Trauma",
  description:
    "Journal club, didactics calendar, and resources for the OHSU orthopaedic trauma team.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${lora.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-muted/30">
        <TooltipProvider>
          {children}
          <Toaster richColors position="top-center" />
        </TooltipProvider>
      </body>
    </html>
  );
}
