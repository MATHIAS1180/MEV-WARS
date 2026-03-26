import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { WalletContextProvider } from "@/components/WalletContextProvider";
import { FlickeringGrid } from "@/components/ui/flickering-grid";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#000000',
};

export const metadata: Metadata = {
  title: "MEV Wars – Best Solana Casino with Provably Fair On-Chain Gameplay",
  description: "Play MEV Wars, a provably fair Solana casino game. 1 in 3 players wins. Fast, transparent and fully on-chain.",
  keywords: ["solana casino", "crypto casino", "provably fair casino", "on-chain game", "web3 gambling", "mev wars", "blockchain casino"],
  metadataBase: new URL('https://mev-wars-casino.vercel.app'),
  openGraph: {
    title: "MEV Wars – Provably Fair Solana Casino",
    description: "Play MEV Wars, a provably fair Solana casino game. 1 in 3 players wins.",
    url: 'https://mev-wars-casino.vercel.app',
    siteName: 'MEV Wars',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "MEV Wars – Provably Fair Solana Casino",
    description: "Play MEV Wars, a provably fair Solana casino game. 1 in 3 players wins.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.mainnet-beta.solana.com" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${spaceGrotesk.variable} ${inter.variable} font-sans bg-black text-zinc-100 antialiased min-h-screen flex flex-col selection:bg-[#9945FF]/40 selection:text-white`}>
        <div className="fixed inset-0 z-[-2]">
          <FlickeringGrid />
        </div>
        <div className="fixed inset-0 z-[-1]" style={{ background: 'radial-gradient(ellipse at center, transparent 0%, transparent 50%, rgba(0,0,0,0.4) 100%)' }}></div>
        <WalletContextProvider>
          {children}
        </WalletContextProvider>
      </body>
    </html>
  );
}
