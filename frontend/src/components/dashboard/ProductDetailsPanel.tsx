import { AnimatePresence, motion } from "framer-motion";
import { ProductStatsCard } from "@/components/dashboard/ProductStatsCard";

type ProductDetailsPanelProps = {
  selectedProductInfo: any | null;
};

export function ProductDetailsPanel({
  selectedProductInfo,
}: ProductDetailsPanelProps) {
  return (
    <AnimatePresence mode="wait">
      {Boolean(selectedProductInfo) && (
        <motion.div
          key="product-card"
          data-tutorial="product-details"
          initial={{ opacity: 0, x: 30, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 30, scale: 0.95 }}
          transition={{
            delay: 0.3,
            type: "spring",
            stiffness: 200,
            damping: 20,
          }}
          whileHover={{ y: -2 }}
        >
          <ProductStatsCard productInfo={selectedProductInfo} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
