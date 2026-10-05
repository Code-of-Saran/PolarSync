import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "PolarSync — India's Polar Science Portal",
  description: "Integrated Polar Science Outreach, Knowledge Repository and Media Dissemination Portal. Explore research, datasets, media and stories from India's polar missions.",
  keywords: "polar science, Antarctica, Arctic, Himalaya, research, datasets, expeditions, India, SIH 2026",
  openGraph: {
    title: "PolarSync — India's Polar Science Portal",
    description: "One portal to share and preserve India's polar science",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#020B18",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
