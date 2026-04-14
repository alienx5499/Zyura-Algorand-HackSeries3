"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { PnrStatus } from "@/lib/dashboard/types";

type PassengerDetailsCardProps = {
  fetchedPassenger: any | null;
  pnrStatus: PnrStatus;
};

export function PassengerDetailsCard({
  fetchedPassenger,
  pnrStatus,
}: PassengerDetailsCardProps) {
  return (
    <AnimatePresence>
      {fetchedPassenger && pnrStatus === "found" && (
        <motion.div
          initial={{
            opacity: 0,
            height: 0,
            scale: 0.9,
            y: -20,
          }}
          animate={{
            opacity: 1,
            height: "auto",
            scale: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
            height: 0,
            scale: 0.9,
            y: -20,
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30,
            mass: 0.8,
          }}
          className="rounded-lg border border-accent-success/20 bg-accent-success/5 p-4 relative overflow-hidden"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1,
              ease: "easeInOut",
            }}
          />
          <motion.h4
            className="text-sm font-semibold text-white mb-3 flex items-center gap-2 relative z-10"
            initial={{ opacity: 0, x: -20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{
              delay: 0.2,
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
          >
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-4 h-4 relative z-10"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- small local logo */}
              <img
                src="/logo.svg"
                alt="ZYURA"
                className="w-full h-full object-contain"
              />
            </motion.div>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="relative z-10"
            >
              Passenger Details (Auto-filled)
            </motion.span>
          </motion.h4>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm relative z-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div
              initial={{
                opacity: 0,
                x: -20,
                scale: 0.95,
              }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{
                delay: 0.4,
                type: "spring",
                stiffness: 300,
                damping: 20,
              }}
              className="relative"
            >
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-gray-400"
              >
                Name:
              </motion.span>{" "}
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: 0.6,
                  type: "spring",
                  stiffness: 400,
                }}
                className="text-white font-medium"
              >
                {fetchedPassenger.fullName ||
                  fetchedPassenger.full_name ||
                  "N/A"}
              </motion.span>
            </motion.div>
            {fetchedPassenger.email && (
              <motion.div
                initial={{
                  opacity: 0,
                  x: 20,
                  scale: 0.95,
                }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{
                  delay: 0.45,
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                }}
                className="relative"
              >
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.55 }}
                  className="text-gray-400"
                >
                  Email:
                </motion.span>{" "}
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: 0.65,
                    type: "spring",
                    stiffness: 400,
                  }}
                  className="text-white font-medium"
                >
                  {fetchedPassenger.email}
                </motion.span>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
