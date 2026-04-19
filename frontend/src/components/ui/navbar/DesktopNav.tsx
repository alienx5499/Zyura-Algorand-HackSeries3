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
        return (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <button
              onClick={() => onItemClick(item)}
              className={`text-sm transition-colors font-medium relative ${
                active ? "text-purple-600" : "text-black hover:text-purple-600"
              }`}
              aria-label={
                isDashboardRoute && item.name === "Home" ? "Home" : undefined
              }
            >
              {isDashboardRoute && item.name === "Home" ? (
                <motion.span
                  className="inline-flex items-center justify-center"
                  initial={false}
                  whileHover={{ x: -2 }}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                >
                  <Home className="h-4 w-4" />
                </motion.span>
              ) : (
                item.name
              )}

              {active && (
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
