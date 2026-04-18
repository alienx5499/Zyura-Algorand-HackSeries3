import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

export function FaucetPageHeader() {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 15,
          duration: 0.6,
        }}
        className="mb-8 md:mb-10"
      >
        <motion.h1
          className="mb-3 text-4xl font-bold text-white md:text-5xl"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.06, type: "spring", stiffness: 100 }}
        >
          Testnet USDC
        </motion.h1>
        <motion.p
          className="max-w-2xl text-lg text-gray-400"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.12, type: "spring", stiffness: 100 }}
        >
          Request test tokens for the Buy Insurance flow. Same layout and card
          chrome as the main dashboard.
        </motion.p>
      </motion.div>

      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-300 transition-colors duration-200 hover:border-gray-500 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
      </div>
    </>
  );
}
