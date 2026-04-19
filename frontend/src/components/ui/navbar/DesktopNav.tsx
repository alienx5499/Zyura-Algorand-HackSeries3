import { motion } from "motion/react";
import { Home } from "lucide-react";
import type { NavItem } from "./types";

type Props = {
  items: NavItem[];
  isDashboardRoute: boolean;
  isActive: (item: NavItem) => boolean;
  onItemClick: (item: NavItem) => void;
};

export function DesktopNav({
  items,
  isDashboardRoute,
  isActive,
  onItemClick,
}: Props) {
  return (
    <nav className="hidden md:flex items-center space-x-8">
      {items.map((item, index) => {
        const active = isActive(item);
        const isHomeIcon = isDashboardRoute && item.name === "Home";
        const buttonHeightClass = isHomeIcon ? "h-[58px]" : "h-5";
        return (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <button
              onClick={() => onItemClick(item)}
              className={`inline-flex ${buttonHeightClass} items-center text-sm leading-none transition-colors font-medium relative ${
                active ? "text-purple-600" : "text-black hover:text-purple-600"
              }`}
              aria-label={isHomeIcon ? "Home" : undefined}
            >
              {isHomeIcon ? (
                <motion.span
                  className="inline-flex h-[22px] w-[22px] items-center justify-center"
                  initial={false}
                  whileHover={{ scale: 1.08 }}
                  transition={{ type: "spring", stiffness: 420, damping: 26 }}
                >
                  <Home className="h-[22px] w-[22px]" strokeWidth={2} />
                </motion.span>
              ) : (
                <span className="inline-flex h-5 items-center leading-none">
                  {item.name}
                </span>
              )}

              {active && !isHomeIcon && (
                <motion.span
                  layoutId="activeIndicator"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-purple-600 rounded-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          </motion.div>
        );
      })}
    </nav>
  );
}
