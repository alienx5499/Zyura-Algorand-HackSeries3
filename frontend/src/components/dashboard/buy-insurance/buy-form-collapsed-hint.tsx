"use client";

import { motion, AnimatePresence } from "framer-motion";

export function BuyFormCollapsedHint({
  showBuyForm,
}: {
  showBuyForm: boolean;
}) {
  return (
    <AnimatePresence mode="wait">
      {!showBuyForm && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="text-gray-400 text-sm"
        >
          Protect your flight with instant, automated delay insurance. Click
          &quot;Buy Policy&quot; to get started.
        </motion.p>
      )}
    </AnimatePresence>
  );
}
