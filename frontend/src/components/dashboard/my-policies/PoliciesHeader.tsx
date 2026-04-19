import { FileText } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type PoliciesHeaderProps = {
  totalPolicies: number;
  filteredCount: number;
};

export function PoliciesHeader({
  totalPolicies,
  filteredCount,
}: PoliciesHeaderProps) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <motion.div
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10"
        whileHover={{
          scale: 1.1,
          rotate: [0, -5, 5, -5, 0],
          transition: { duration: 0.5 },
        }}
      >
        <FileText className="h-5 w-5 text-emerald-400" />
      </motion.div>
      <h2 className="text-2xl font-semibold text-white">My Policies</h2>
      <AnimatePresence>
        {totalPolicies > 0 && (
          <motion.span
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="ml-auto rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-400"
          >
            {filteredCount}
            {filteredCount !== totalPolicies ? ` / ${totalPolicies}` : ""}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
