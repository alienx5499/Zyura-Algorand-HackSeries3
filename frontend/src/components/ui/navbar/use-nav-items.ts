import type { NavItem } from "./types";

type Params = {
  pathname: string | null;
  isConnected: boolean;
  address: string | null | undefined;
  isDashboardRoute: boolean;
};

export function useNavItems({
  pathname,
  isConnected,
  address,
  isDashboardRoute,
}: Params): NavItem[] {
  if (pathname === "/") {
    const base: NavItem[] = [
      { name: "Home", path: "/", section: "hero" },
      { name: "About", path: "/", section: "about" },
      { name: "Policies", path: "/", section: "policies" },
      { name: "Features", path: "/", section: "features" },
      { name: "Contact", path: "/", section: "contact" },
    ];
    if (isConnected && address) {
      base.push({
        name: "Dashboard",
        path: "/dashboard",
        section: "dashboard",
      });
    }
    return base;
  }

  if (isConnected && address) {
    const dashboardBase: NavItem[] = [
      { name: "Home", path: "/", section: "hero" },
      { name: "Dashboard", path: "/dashboard", section: "dashboard" },
      { name: "My Policies", path: "/dashboard", section: "policies" },
      { name: "Buy Policies", path: "/dashboard", section: "buy" },
    ];

    if (isDashboardRoute) {
      dashboardBase.push({
        name: "Faucet",
        path: "/dashboard/faucet",
        section: "faucet",
      });
    }

    return dashboardBase;
  }

  return [{ name: "Home", path: "/", section: "hero" }];
}
