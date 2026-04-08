"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import algosdk from "algosdk";
import type { PeraWalletConnect } from "@perawallet/connect";

type WalletContextValue = {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  peraWallet: PeraWalletConnect | null;
};

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

type Props = { children: ReactNode };

/**
 * Algorand + Pera Wallet connection provider.
 * PeraWalletConnect is only created in the browser (useEffect) to avoid
 * crypto.subtle being undefined during SSR.
 */
export function WalletConnectionProvider({ children }: Props) {
  const [peraWallet, setPeraWallet] = useState<PeraWalletConnect | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Create PeraWalletConnect only on the client (crypto.subtle is undefined in SSR)
  useEffect(() => {
    let cancelled = false;
    import("@perawallet/connect").then(({ PeraWalletConnect: PWC }) => {
      if (cancelled) return;
      setPeraWallet(new PWC());
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Reconnect existing Pera session when peraWallet is ready
  useEffect(() => {
    if (!peraWallet) return;
    let cancelled = false;

    peraWallet
      .reconnectSession()
      .then((accounts) => {
        if (cancelled) return;
        if (accounts.length > 0) {
          try {
            const decoded = algosdk.decodeAddress(accounts[0]);
            const normalized = algosdk.encodeAddress(decoded.publicKey);
            setAddress(normalized);
          } catch {
            setAddress(accounts[0]);
          }
        }

        peraWallet.connector?.on("disconnect", () => {
          setAddress(null);
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      peraWallet.connector?.off("disconnect");
    };
  }, [peraWallet]);

  const connect = useCallback(async () => {
    if (!peraWallet) {
      return;
    }
    setIsConnecting(true);
    try {
      const accounts = await peraWallet.connect();
      if (accounts.length > 0) {
        try {
          const decoded = algosdk.decodeAddress(accounts[0]);
          const normalized = algosdk.encodeAddress(decoded.publicKey);
          setAddress(normalized);
        } catch {
          setAddress(accounts[0]);
        }
      }
    } finally {
      setIsConnecting(false);
    }
  }, [peraWallet]);

  const disconnect = useCallback(async () => {
    if (peraWallet) {
      try {
        await peraWallet.disconnect();
      } finally {
        setAddress(null);
      }
    } else {
      setAddress(null);
    }
  }, [peraWallet]);

  const value: WalletContextValue = {
    address,
    isConnected: Boolean(address),
    isConnecting,
    connect,
    disconnect,
    peraWallet,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

/**
 * Hook for components to access Pera/Algorand wallet state.
 *
 * Example usage:
 *   const { address, isConnected, connect, disconnect } = useAlgorandWallet();
 */
export function useAlgorandWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error(
      "useAlgorandWallet must be used within WalletConnectionProvider",
    );
  }
  return ctx;
}
