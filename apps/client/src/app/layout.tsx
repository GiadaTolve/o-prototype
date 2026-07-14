import type { Metadata } from "next";
import { Source_Sans_3, Philosopher, EB_Garamond, Workbench } from "next/font/google";
import "animate.css/animate.min.css";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { config } from "@fortawesome/fontawesome-svg-core";
import "./globals.css";
import { ToastContainer } from "@/components/ui/Toast";

config.autoAddCss = false;

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  display: "swap",
});

const philosopher = Philosopher({
  variable: "--font-philosopher",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  display: "swap",
});

const workbench = Workbench({
  variable: "--font-workbench",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "𝑂𝑦𝑎𝑠𝑢𝑚𝑖",
  description: "Dark Fantasy Play-by-Chat",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Oyasumi",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
  interactiveWidget: "resizes-content" as const,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${sourceSans.variable} ${philosopher.variable} ${ebGaramond.variable} ${workbench.variable}`}
    >
      <body className="font-sans antialiased">
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
