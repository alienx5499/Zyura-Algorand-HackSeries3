"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type UseDashboardAuthGateArgs = {
  address: string | null | undefined;
  connected: boolean;
};

export function useDashboardAuthGate({
  address,
  connected,
}: UseDashboardAuthGateArgs) {
  const router = useRouter();
  const publicKey = useMemo(
    () => (address ? { toString: () => address } : (null as any)),
    [address],
  );
  const [walletInitComplete, setWalletInitComplete] = useState(false);

  useEffect(() => {
    const initTimer = setTimeout(() => {
      setWalletInitComplete(true);
    }, 1500);
    return () => clearTimeout(initTimer);
  }, []);

  useEffect(() => {
    if (walletInitComplete && (!connected || !publicKey)) {
      router.push("/");
    }
  }, [walletInitComplete, connected, publicKey, router]);

  return { publicKey, walletInitComplete };
}
