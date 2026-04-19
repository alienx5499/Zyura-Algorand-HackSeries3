"use client";

import { useRef, useState } from "react";
import { Menu } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { usePathname, useRouter } from "next/navigation";

import { useAlgorandWallet } from "@/contexts/WalletConnectionProvider";
import { Logo } from "../logo";
import { LiquidButton } from "../liquid-glass-button";

import type { NavItem } from "./types";
import { DesktopNav } from "./DesktopNav";
import { MobileMenu } from "./MobileMenu";
import { ProfileMenu } from "./ProfileMenu";
import { useActiveSection } from "./use-active-section";
import { useNavItems } from "./use-nav-items";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");

  const { address, isConnected, connect, disconnect } = useAlgorandWallet();
  const router = useRouter();
  const pathname = usePathname();
  const isNavigatingRef = useRef(false);
  const isDashboardRoute = pathname?.startsWith("/dashboard");

  useActiveSection({ pathname, isNavigatingRef, setActiveSection });

  const navItems = useNavItems({
    pathname,
    isConnected,
    address,
    isDashboardRoute: !!isDashboardRoute,
  });

  const formatAddress = (addr: string) =>
    `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    toast.success("Wallet address copied to clipboard!", {
      description: address,
    });
  };

  const isItemActive = (item: NavItem) =>
    (pathname === "/" && item.section === activeSection) ||
    (pathname === "/dashboard" &&
      item.name === "Dashboard" &&
      activeSection === "dashboard") ||
    (pathname === "/dashboard" && item.section === activeSection) ||
    (item.path === "/dashboard/faucet" && pathname === "/dashboard/faucet");

  const handleNavClick = (item: NavItem) => {
    if (item.name === "Home") {
      if (pathname === "/") {
        isNavigatingRef.current = true;
        setActiveSection("hero");
        window.scrollTo({ top: 0, behavior: "smooth" });
        window.history.pushState(null, "", "/");
        setTimeout(() => {
          isNavigatingRef.current = false;
          setActiveSection("hero");
        }, 800);
      } else {
        router.push("/");
        setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 100);
      }
      setIsMenuOpen(false);
      return;
    }

    if (item.path === "/") {
      if (pathname !== "/") {
        router.push(`/#${item.section}`);
      } else {
        let element = document.querySelector(
          `[data-section="${item.section}"]`,
        );
        if (!element) element = document.getElementById(item.section);
        if (!element) element = document.querySelector(`#${item.section}`);

        if (element) {
          const offset = 120;
          const rect = (element as HTMLElement).getBoundingClientRect();
          const elementPosition = rect.top + window.pageYOffset;
          const offsetPosition = elementPosition - offset;

          setActiveSection(item.section);
          isNavigatingRef.current = true;
          window.scrollTo({ top: offsetPosition, behavior: "smooth" });
          window.history.pushState(null, "", `#${item.section}`);

          setTimeout(() => {
            isNavigatingRef.current = false;
            setActiveSection(item.section);
          }, 800);
        } else {
          setTimeout(() => {
            const fallbackElement =
              document.querySelector(`[data-section="${item.section}"]`) ||
              document.getElementById(item.section) ||
              document.querySelector(`#${item.section}`);
            if (!fallbackElement) return;

            const offset = 120;
            const rect = (
              fallbackElement as HTMLElement
            ).getBoundingClientRect();
            const elementPosition = rect.top + window.pageYOffset;
            const offsetPosition = elementPosition - offset;
            window.scrollTo({ top: offsetPosition, behavior: "smooth" });
            window.history.pushState(null, "", `#${item.section}`);
            setActiveSection(item.section);
          }, 100);
        }
      }
      setIsMenuOpen(false);
      return;
    }

    if (item.path === "/dashboard") {
      if (pathname === "/dashboard") {
        const element =
          document.querySelector(`[data-section="${item.section}"]`) ||
          document.getElementById(item.section) ||
          document.querySelector(`#${item.section}`);
        if (element) {
          const offset = 120;
          const elementPosition =
            element.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = elementPosition - offset;
          window.scrollTo({ top: offsetPosition, behavior: "smooth" });
          window.history.pushState(null, "", `#${item.section}`);
          setActiveSection(item.section);
          setIsMenuOpen(false);
          return;
        }
      }
      router.push(`/dashboard#${item.section}`);
      setIsMenuOpen(false);
      return;
    }

    router.push(item.path);
    setIsMenuOpen(false);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center w-full py-6 px-4">
      <div
        className="flex items-center justify-between px-6 py-3 bg-white rounded-full shadow-lg relative border border-gray-200 navbar-white"
        style={{ width: "768px", height: "58px" }}
      >
        <div className="flex items-center flex-shrink-0">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-shrink-0"
          >
            <button
              onClick={() => {
                if (pathname === "/") {
                  isNavigatingRef.current = true;
                  setActiveSection("hero");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  window.history.pushState(null, "", "/");
                  setTimeout(() => {
                    isNavigatingRef.current = false;
                    setActiveSection("hero");
                  }, 800);
                } else {
                  router.push("/");
                  setTimeout(
                    () => window.scrollTo({ top: 0, behavior: "smooth" }),
                    100,
                  );
                }
              }}
              className="flex items-center flex-shrink-0"
              aria-label="Go to home"
            >
              <Logo size={35} variant="dark" />
            </button>
          </motion.div>
        </div>

        <DesktopNav
          items={navItems}
          isDashboardRoute={!!isDashboardRoute}
          isActive={isItemActive}
          onItemClick={handleNavClick}
        />

        <motion.div
          className="hidden md:block relative"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {isConnected && address ? (
            <ProfileMenu
              address={address}
              isOpen={isProfileOpen}
              onToggle={() => setIsProfileOpen((s) => !s)}
              onClose={() => setIsProfileOpen(false)}
              onCopyAddress={copyAddress}
              onGoDashboard={() => {
                router.push("/dashboard");
                setIsProfileOpen(false);
              }}
              onDisconnect={() => {
                disconnect();
                setIsProfileOpen(false);
              }}
            />
          ) : (
            <LiquidButton
              size="sm"
              className="px-5 py-2 text-sm text-purple-600"
              onClick={() => void connect()}
            >
              Connect Wallet
            </LiquidButton>
          )}
        </motion.div>

        <motion.button
          className="md:hidden flex items-center"
          onClick={() => setIsMenuOpen((s) => !s)}
          whileTap={{ scale: 0.9 }}
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6 text-gray-900" />
        </motion.button>
      </div>

      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        navItems={navItems}
        isDashboardRoute={!!isDashboardRoute}
        isItemActive={isItemActive}
        onNavItemClick={handleNavClick}
        isConnected={isConnected}
        address={address}
        formatAddress={formatAddress}
        onGoDashboard={() => {
          router.push("/dashboard");
          setIsMenuOpen(false);
        }}
        onDisconnect={() => {
          disconnect();
          setIsMenuOpen(false);
        }}
        onConnect={() => {
          void connect();
          setIsMenuOpen(false);
        }}
      />
    </div>
  );
}
