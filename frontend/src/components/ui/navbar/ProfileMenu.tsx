import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Copy, ExternalLink, User } from "lucide-react";

import { LiquidButton } from "../liquid-glass-button";

type Props = {
  address: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onCopyAddress: () => void;
  onGoDashboard: () => void;
  onDisconnect: () => void;
};

export function ProfileMenu({
  address,
  isOpen,
  onToggle,
  onClose,
  onCopyAddress,
  onGoDashboard,
  onDisconnect,
}: Props) {
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen && typeof document !== "undefined") {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      if (typeof document !== "undefined") {
        document.removeEventListener("mousedown", handleClickOutside);
      }
    };
  }, [isOpen, onClose]);

  const formatAddress = (addr: string) =>
    `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  return (
    <div className="relative" ref={profileRef}>
      <LiquidButton onClick={onToggle} size="sm" className="px-5 py-2 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="font-mono text-xs">{formatAddress(address)}</span>
        </div>
      </LiquidButton>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute left-0 top-full mt-2 w-80 overflow-hidden rounded-2xl py-2 z-50"
          >
            <div className="absolute inset-0 rounded-2xl shadow-[0_0_6px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3px_rgba(0,0,0,0.9),inset_-3px_-3px_0.5px_-3px_rgba(0,0,0,0.85),inset_1px_1px_1px_-0.5px_rgba(0,0,0,0.6),inset_-1px_-1px_1px_-0.5px_rgba(0,0,0,0.6),inset_0_0_6px_6px_rgba(0,0,0,0.12),inset_0_0_2px_2px_rgba(0,0,0,0.06),0_0_12px_rgba(255,255,255,0.15)] dark:shadow-[0_0_8px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3.5px_rgba(255,255,255,0.09),inset_-3px_-3px_0.5px_-3.5px_rgba(255,255,255,0.85),inset_1px_1px_1px_-0.5px_rgba(255,255,255,0.6),inset_-1px_-1px_1px_-0.5px_rgba(255,255,255,0.6),inset_0_0_6px_6px_rgba(255,255,255,0.12),inset_0_0_2px_2px_rgba(255,255,255,0.06),0_0_12px_rgba(0,0,0,0.15)]" />
            <div
              className="absolute inset-0 isolate -z-10 overflow-hidden rounded-2xl bg-white/80"
              style={{ backdropFilter: 'url("#container-glass")' }}
            />

            <div className="relative z-10 px-4 py-3 border-b border-gray-200/70">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    Connected wallet
                  </div>
                  <div className="text-xs text-gray-500 font-mono truncate">
                    {formatAddress(address)}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 px-2 py-2 space-y-1">
              <button
                onClick={onGoDashboard}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-white/60 rounded-xl transition-colors duration-200"
              >
                <ExternalLink className="h-4 w-4" />
                Dashboard
              </button>
              <button
                onClick={onCopyAddress}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-white/60 rounded-xl transition-colors duration-200"
              >
                <Copy className="h-4 w-4" />
                Copy Address
              </button>
            </div>

            <div className="relative z-10 border-t border-gray-200/70 px-2 pt-2 pb-1">
              <button
                onClick={onDisconnect}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50/70 rounded-xl transition-colors duration-200"
              >
                Disconnect
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
