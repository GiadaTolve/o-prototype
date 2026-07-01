import type { Metadata } from "next";
import { Cinzel, Inter, Cormorant_Garamond, Ropa_Sans } from "next/font/google";
import "animate.css/animate.min.css";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { config } from "@fortawesome/fontawesome-svg-core";
import "./globals.css";
import { ToastContainer } from "@/components/ui/Toast";

config.autoAddCss = false;

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const ropaSans = Ropa_Sans({
  variable: "--font-ropa",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Oyasumi 2.0",
  description: "Protocollo onirico — Dark Fantasy Play-by-Chat",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body
        className={`${cinzel.variable} ${inter.variable} ${cormorant.variable} ${ropaSans.variable} font-sans antialiased`}
      >
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
