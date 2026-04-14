import { useEffect, useState } from "react";

const DASHBOARD_SECTION_IDS = ["dashboard", "buy", "policies"] as const;

export function useDashboardSectionNavigation() {
  const [activeSection, setActiveSection] = useState<string>("dashboard");

  // Scroll spy to track active section
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150; // Offset for navbar

      for (let i = DASHBOARD_SECTION_IDS.length - 1; i >= 0; i--) {
        const sectionId = DASHBOARD_SECTION_IDS[i];
        const section = document.getElementById(sectionId);
        if (!section) continue;
        if (scrollPosition >= section.offsetTop) {
          setActiveSection(sectionId);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Check on mount

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle hash navigation on mount and when navigating from other pages
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash || !DASHBOARD_SECTION_IDS.includes(hash as any)) return;

    setTimeout(() => {
      const element = document.getElementById(hash);
      if (!element) return;

      const offset = 120; // Navbar height + padding
      const elementPosition =
        element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
      setActiveSection(hash);
    }, 300); // Wait for page to render
  }, []);

  // Listen for hash changes (e.g., browser back/forward)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (!hash || !DASHBOARD_SECTION_IDS.includes(hash as any)) return;

      setTimeout(() => {
        const element = document.getElementById(hash);
        if (!element) return;

        const offset = 120;
        const elementPosition =
          element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - offset;
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
        setActiveSection(hash);
      }, 100);
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return { activeSection };
}
