import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { WalletContextProvider } from "@/components/WalletContextProvider";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "MEV Wars – Best Solana Casino with Provably Fair On-Chain Gameplay",
  description: "Play MEV Wars, a provably fair Solana casino game. 1 in 3 players wins. Fast, transparent and fully on-chain.",
  keywords: ["solana casino", "crypto casino", "provably fair casino", "on-chain game", "web3 gambling", "mev wars", "blockchain casino"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${spaceGrotesk.variable} ${inter.variable} font-sans bg-[var(--bg-color)] text-zinc-100 antialiased min-h-screen flex flex-col selection:bg-[#9945FF]/40 selection:text-white`}>
        <div className="liquid-overlay" />
        <WalletContextProvider>
          {children}
        </WalletContextProvider>
      </body>
    </html>
  );
}
