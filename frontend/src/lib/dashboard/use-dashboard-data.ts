import { useCallback, useState } from "react";
import { toast } from "sonner";

type UseDashboardDataArgs = {
  address?: string | null;
  productId: string;
  setProductId: (value: string) => void;
};

export function useDashboardData({
  address,
  productId,
  setProductId,
}: UseDashboardDataArgs) {
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingPolicies, setIsLoadingPolicies] = useState(false);
  const [products, setProducts] = useState<Array<{ id: string }>>([]);
  const [selectedProductInfo, setSelectedProductInfo] = useState<any | null>(
    null,
  );
  const [myPolicies, setMyPolicies] = useState<any[]>([]);
  const [policiesFetchError, setPoliciesFetchError] = useState<string | null>(
    null,
  );

  const showProductById = useCallback(async (id: string) => {
    try {
      const idNum = parseInt(id, 10);
      if (Number.isNaN(idNum)) return;

      // Fetch product data from Algorand chain
      const response = await fetch(`/api/zyura/product/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch product details");
      }
      const productData = await response.json();

      setSelectedProductInfo({
        id: idNum,
        product_id: idNum,
        delay_threshold_minutes:
          parseInt(productData.delay_threshold_minutes || "0", 10) || undefined,
        coverage_amount: productData.coverage_amount || "0",
        premium_rate_bps:
          parseInt(productData.premium_rate_bps || "0", 10) || undefined,
        claim_window_hours:
          parseInt(productData.claim_window_hours || "0", 10) || undefined,
        active: productData.active === true,
      });
    } catch (error: any) {
      console.error("Error fetching product:", error);
      toast.error("Failed to load product details", {
        description: error.message,
      });
      setSelectedProductInfo(null);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoadingProducts(true);
      // Algorand stub: expose Zyura product IDs [1..5] without on-chain reads.
      const mapped = ["1", "2", "3", "4", "5"].map((id) => ({ id }));
      setProducts(mapped);
      if (!productId && mapped.length > 0) {
        const firstId = mapped[0].id;
        setProductId(firstId);
        await showProductById(firstId);
      }
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to load products", { description: e.message });
    } finally {
      setIsLoadingProducts(false);
    }
  }, [productId, setProductId, showProductById]);

  const fetchMyPolicies = useCallback(
    async (bypassCache = false) => {
      const walletAddress =
        address && typeof address === "string" ? address.trim() : "";
      if (!walletAddress) {
        setMyPolicies([]);
        setPoliciesFetchError(null);
        setIsLoadingPolicies(false);
        return;
      }

      setIsLoadingPolicies(true);
      setPoliciesFetchError(null);
      try {
        const cacheParam = bypassCache ? "?noCache=true" : "";
        const response = await fetch(
          `/api/zyura/policies/${encodeURIComponent(walletAddress)}${cacheParam}`,
        );
        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          const errMsg =
            (errBody as { error?: string })?.error ||
            response.statusText ||
            "Failed to fetch policies";
          console.error("Failed to fetch policies:", response.status, errMsg);
          setPoliciesFetchError(errMsg);
          setMyPolicies([]);
          return;
        }

        const data = await response.json();
        setMyPolicies(data.policies || []);
      } catch (error: any) {
        console.error("Error fetching policies:", error);
        setPoliciesFetchError(
          error?.message || "Network error. Please try again.",
        );
        setMyPolicies([]);
      } finally {
        setIsLoadingPolicies(false);
      }
    },
    [address],
  );

  const resetPoliciesState = useCallback(() => {
    setMyPolicies([]);
    setPoliciesFetchError(null);
  }, []);

  return {
    isLoadingProducts,
    isLoadingPolicies,
    products,
    selectedProductInfo,
    myPolicies,
    policiesFetchError,
    fetchProducts,
    fetchMyPolicies,
    showProductById,
    setMyPolicies,
    resetPoliciesState,
  };
}
