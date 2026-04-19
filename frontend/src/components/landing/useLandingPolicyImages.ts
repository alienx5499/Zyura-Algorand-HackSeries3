"use client";

import { useEffect, useState } from "react";
import { fetchPolicyImages } from "@/lib/fetch-policies";

export function useLandingPolicyImages() {
  const [policyImages, setPolicyImages] = useState<string[]>([]);
  const [isLoadingPolicies, setIsLoadingPolicies] = useState(true);

  useEffect(() => {
    const CACHE_KEY = "zyura_policy_images";
    const CACHE_EXPIRY_KEY = "zyura_policy_images_expiry";
    const CACHE_DURATION = 15 * 60 * 1000;

    const isHardRefresh = () => {
      try {
        const navEntries = performance.getEntriesByType(
          "navigation",
        ) as PerformanceNavigationTiming[];
        if (navEntries.length > 0) {
          const navType = navEntries[0].type;
          if (navType === "reload") {
            const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);
            if (expiry) {
              const expiryTime = parseInt(expiry, 10);
              const cacheSetTime = expiryTime - CACHE_DURATION;
              const cacheAge = Date.now() - cacheSetTime;
              if (cacheAge > 60 * 1000) return true;
            } else {
              return true;
            }
          }
        }

        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get("refresh") === "true") return true;
      } catch {
        // Assume normal load when detection fails.
      }

      return false;
    };

    const loadCachedData = (skipIfHardRefresh = false) => {
      try {
        if (skipIfHardRefresh && isHardRefresh()) {
          localStorage.removeItem(CACHE_KEY);
          localStorage.removeItem(CACHE_EXPIRY_KEY);
          return false;
        }

        const cached = localStorage.getItem(CACHE_KEY);
        const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);

        if (cached && expiry) {
          const expiryTime = parseInt(expiry, 10);
          if (Date.now() < expiryTime) {
            const images = JSON.parse(cached);
            if (Array.isArray(images) && images.length > 0) {
              setPolicyImages(images);
              setIsLoadingPolicies(false);
              return true;
            }
          } else {
            localStorage.removeItem(CACHE_KEY);
            localStorage.removeItem(CACHE_EXPIRY_KEY);
          }
        }
      } catch (error) {
        console.error("Error loading cached policies:", error);
      }

      return false;
    };

    const saveToCache = (images: string[]) => {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(images));
        localStorage.setItem(
          CACHE_EXPIRY_KEY,
          (Date.now() + CACHE_DURATION).toString(),
        );
      } catch (error) {
        console.error("Error saving policies to cache:", error);
      }
    };

    const hardRefresh = isHardRefresh();
    const cacheLoaded = loadCachedData(hardRefresh);

    if (!cacheLoaded || hardRefresh) {
      fetchPolicyImages(10)
        .then((policies) => {
          const images = policies.map((p) => p.imageUrl);
          if (images.length > 0) {
            setPolicyImages(images);
            saveToCache(images);
          }
          setIsLoadingPolicies(false);
        })
        .catch((error) => {
          console.error("Error loading policies:", error);
          setPolicyImages([]);
          setIsLoadingPolicies(false);
        });
    }
  }, []);

  return { policyImages, isLoadingPolicies };
}
