import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = { onStart: () => void };

export function StartTutorialButton({ onStart }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed bottom-6 right-6 z-50"
    >
      <Button
        onClick={onStart}
        className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 flex items-center gap-2 px-4 py-2 rounded-lg"
      >
        <HelpCircle className="w-4 h-4" />
        <span>Start Tutorial</span>
      </Button>
    </motion.div>
  );
}
