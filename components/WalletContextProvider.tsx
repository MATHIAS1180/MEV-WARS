"use client";

import { FC, ReactNode, useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";

// Default styles that can be overridden by your app
import '@solana/wallet-adapter-react-ui/styles.css';

export const WalletContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
    // Read network from environment variable, default to devnet
    const network = (process.env.NEXT_PUBLIC_SOLANA_NETWORK as 'devnet' | 'testnet' | 'mainnet-beta') || 'devnet';

    // Use custom RPC URL if provided, otherwise use clusterApiUrl
    let endpoint = process.env.NEXT_PUBLIC_RPC_URL;
    if (!endpoint) {
        endpoint = clusterApiUrl(network);
    }

    const wallets = useMemo(
        () => [],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [network]
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};
