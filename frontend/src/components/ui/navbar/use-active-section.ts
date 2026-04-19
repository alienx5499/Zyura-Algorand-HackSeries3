import { useEffect, type MutableRefObject } from "react";

type Params = {
  pathname: string | null;
  isNavigatingRef: MutableRefObject<boolean>;
  setActiveSection: (section: string) => void;
};

export function useActiveSection({
  pathname,
  isNavigatingRef,
  setActiveSection,
}: Params) {
  useEffect(() => {
    if (!pathname) return;

    if (pathname === "/dashboard") {
      const handleScroll = () => {
        const sections = ["dashboard", "buy", "policies"];
        const scrollPosition = window.scrollY + 150;

        for (let i = sections.length - 1; i >= 0; i--) {
          const section = document.getElementById(sections[i]);
          if (!section) continue;
          if (scrollPosition >= section.offsetTop) {
            setActiveSection(sections[i]);
            break;
          }
        }
      };

      window.addEventListener("scroll", handleScroll);
      handleScroll();
      return () => window.removeEventListener("scroll", handleScroll);
    }

    if (pathname === "/") {
      const handleScroll = () => {
        if (isNavigatingRef.current) return;

        const sections = ["hero", "about", "policies", "features", "contact"];
        const scrollPosition = window.scrollY;
        const offset = 200;

        let currentSection = "hero";
        for (let i = sections.length - 1; i >= 0; i--) {
          const sectionName = sections[i];
          const section =
            document.querySelector(`[data-section="${sectionName}"]`) ||
            document.getElementById(sectionName) ||
            document.querySelector(`#${sectionName}`);

          if (!section) continue;
          const rect = (section as HTMLElement).getBoundingClientRect();
          const sectionTop = window.scrollY + rect.top;
          if (scrollPosition + offset >= sectionTop) {
            currentSection = sectionName;
            break;
          }
        }

        if (scrollPosition < 50) currentSection = "hero";
        setActiveSection(currentSection);
      };

      window.addEventListener("scroll", handleScroll);
      if (!window.location.hash) setActiveSection("hero");
      handleScroll();
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [pathname, isNavigatingRef, setActiveSection]);

  useEffect(() => {
    if (!pathname) return;

    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      const dashboardSections = ["dashboard", "buy", "policies"];
      const homeSections = ["hero", "about", "policies", "features", "contact"];

      if (pathname === "/dashboard" && dashboardSections.includes(hash)) {
        setActiveSection(hash);
      } else if (pathname === "/" && homeSections.includes(hash)) {
        setActiveSection(hash);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [pathname, setActiveSection]);
}
