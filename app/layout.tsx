import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-brand",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Talentronaut CRM",
  description: "Talentronaut CRM Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${plusJakartaSans.variable} ${playfairDisplay.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
