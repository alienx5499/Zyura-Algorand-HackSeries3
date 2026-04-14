import { ChevronDown, Plus, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

type BuyInsuranceHeaderProps = {
  showBuyForm: boolean;
  onToggleBuyForm: () => void;
};

export function BuyInsuranceHeader({
  showBuyForm,
  onToggleBuyForm,
}: BuyInsuranceHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <motion.div
        className="flex items-center gap-3"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, type: "spring" }}
      >
        <motion.div
          className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center"
          whileHover={{
            scale: 1.1,
            rotate: [0, -5, 5, -5, 0],
            transition: { duration: 0.5 },
          }}
        >
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
        </motion.div>
        <h2 className="text-2xl font-semibold text-white">Buy Insurance</h2>
      </motion.div>
      <motion.button
        onClick={onToggleBuyForm}
        className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
          showBuyForm
            ? "bg-gray-800 border border-gray-700 text-gray-300 hover:text-white"
            : "bg-indigo-600 hover:bg-indigo-500 text-white"
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, type: "spring" }}
      >
        {showBuyForm ? (
          <>
            <motion.span
              animate={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="w-4 h-4 inline" />
            </motion.span>
            Hide Form
          </>
        ) : (
          <>
            <Plus className="w-4 h-4 inline" />
            Buy Policy
          </>
        )}
      </motion.button>
    </div>
  );
}
