import { motion, AnimatePresence } from "motion/react";
import { Home, X } from "lucide-react";

import type { NavItem } from "./types";
import { LiquidButton } from "../liquid-glass-button";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
  isDashboardRoute: boolean;
  isItemActive: (item: NavItem) => boolean;
  onNavItemClick: (item: NavItem) => void;
  isConnected: boolean;
  address?: string | null;
  formatAddress: (addr: string) => string;
  onGoDashboard: () => void;
  onDisconnect: () => void;
  onConnect: () => void;
};

export function MobileMenu({
  isOpen,
  onClose,
  navItems,
  isDashboardRoute,
  isItemActive,
  onNavItemClick,
  isConnected,
  address,
  formatAddress,
  onGoDashboard,
  onDisconnect,
  onConnect,
}: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute top-full left-0 right-0 mt-2 mx-4 bg-white rounded-xl shadow-lg border border-gray-200 py-4 z-50 md:hidden"
        >
          <div className="px-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Menu</h3>
              <button onClick={onClose} className="p-1">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-2">
              {navItems.map((item, index) => (
                <motion.button
                  key={item.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  onClick={() => onNavItemClick(item)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    isItemActive(item)
                      ? "bg-purple-50 text-purple-600 font-medium"
                      : "text-black hover:bg-purple-50 hover:text-purple-600"
                  }`}
                  aria-label={
                    isDashboardRoute && item.name === "Home"
                      ? "Home"
                      : undefined
                  }
                >
                  {isDashboardRoute && item.name === "Home" ? (
                    <span className="inline-flex items-center gap-2">
                      <Home className="h-4 w-4 text-gray-600" />
                    </span>
                  ) : (
                    item.name
                  )}
                </motion.button>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              {isConnected && address ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-100 rounded-lg border border-gray-200">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700 font-mono">
                      {formatAddress(address)}
                    </span>
                  </div>
                  <LiquidButton
                    size="lg"
                    className="w-full px-5 py-3 text-base"
                    onClick={onGoDashboard}
                  >
                    Dashboard
                  </LiquidButton>
                  <LiquidButton
                    size="lg"
                    className="w-full px-5 py-3 text-base"
                    onClick={onDisconnect}
                  >
                    Disconnect
                  </LiquidButton>
                </div>
              ) : (
                <LiquidButton
                  size="lg"
                  className="w-full px-5 py-3 text-base text-purple-600"
                  onClick={onConnect}
                >
                  Connect Wallet
                </LiquidButton>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
