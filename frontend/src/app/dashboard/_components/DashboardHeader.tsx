"use client";

import { motion } from "framer-motion";

export function DashboardHeader() {
  return (
    <motion.div
      id="dashboard"
      data-section="dashboard"
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 100,
        damping: 15,
        duration: 0.6,
      }}
      className="mb-8 scroll-mt-32 md:mb-12"
    >
      <motion.h1
        className="mb-3 text-4xl font-bold text-white md:text-5xl"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
      >
        Dashboard
      </motion.h1>
      <motion.p
        className="text-lg text-gray-400"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
      >
        Manage your flight delay insurance policies
      </motion.p>
    </motion.div>
  );
}
