"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { FormField } from "@/components/dashboard/FormField";
import type { PnrStatus } from "@/lib/dashboard/types";

type BuyFormFieldsProps = {
  connected: boolean;
  isSubmitting: boolean;
  productId: string;
  setProductId: (value: string) => void;
  products: { id: string }[];
  isLoadingProducts: boolean;
  showProductById: (id: string) => void | Promise<void>;
  pnr: string;
  setPnr: (value: string) => void;
  pnrStatus: PnrStatus;
  setPnrStatus: (value: PnrStatus) => void;
  setFetchedPassenger: (value: any | null) => void;
  flightNumber: string;
  setFlightNumber: (value: string) => void;
  departureDate: string;
  setDepartureDate: (value: string) => void;
  departureTime: string;
  setDepartureTime: (value: string) => void;
  timeOptions: { value: string; label: string }[];
};

export function BuyFormFields({
  connected,
  isSubmitting,
  productId,
  setProductId,
  products,
  isLoadingProducts,
  showProductById,
  pnr,
  setPnr,
  pnrStatus,
  setPnrStatus,
  setFetchedPassenger,
  flightNumber,
  setFlightNumber,
  departureDate,
  setDepartureDate,
  departureTime,
  setDepartureTime,
  timeOptions,
}: BuyFormFieldsProps) {
  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white">
            Product *
          </label>
          <select
            value={productId}
            onChange={async (e) => {
              const v = e.target.value;
              setProductId(v);
              if (v) await showProductById(v);
            }}
            disabled={!connected || isSubmitting || isLoadingProducts}
            className="w-full px-4 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
          >
            <option value="" disabled>
              {products.length ? "Select a product" : "Loading..."}
            </option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                Product {p.id}
              </option>
            ))}
          </select>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <FormField
            label="PNR"
            required
            value={pnr}
            onChange={(e) => {
              setPnr(e.target.value.toUpperCase());
              if (e.target.value.length !== 6) {
                setPnrStatus(null);
                setFetchedPassenger(null);
              }
            }}
            placeholder="6-character code"
            disabled={!connected || isSubmitting}
            className={pnrStatus === "fetching" ? "relative" : ""}
            helperText={
              pnrStatus === "fetching" ? (
                <motion.span
                  className="flex items-center gap-2 text-indigo-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  Fetching PNR details...
                </motion.span>
              ) : pnrStatus === "found" ? (
                <motion.span
                  className="flex items-center gap-2 text-emerald-400"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                  }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      delay: 0.2,
                      type: "spring",
                      stiffness: 400,
                    }}
                  >
                    ✓
                  </motion.div>
                  PNR found, details auto-filled
                </motion.span>
              ) : pnrStatus === "not-found" ? (
                <span className="text-amber-400">
                  PNR not found, enter manually
                </span>
              ) : (
                ("Enter your 6-character PNR for auto-fill" as React.ReactNode)
              )
            }
          />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{
            opacity: 1,
            x: 0,
            scale: pnrStatus === "found" ? [1, 1.02, 1] : 1,
          }}
          transition={{
            delay: 0.25,
            scale:
              pnrStatus === "found"
                ? {
                    duration: 0.6,
                    times: [0, 0.5, 1],
                  }
                : {},
          }}
        >
          <FormField
            label="Flight Number"
            required
            value={flightNumber}
            onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
            placeholder="e.g., AI202, AP986"
            disabled={!connected || isSubmitting || pnrStatus === "found"}
            showLockIcon={pnrStatus === "found"}
            className={
              pnrStatus === "found"
                ? "border-2 border-amber-500/50 shadow-[0_0_0_2px_rgba(251,191,36,0.2)]"
                : ""
            }
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{
            opacity: 1,
            x: 0,
            scale: pnrStatus === "found" ? [1, 1.02, 1] : 1,
          }}
          transition={{
            delay: 0.3,
            scale:
              pnrStatus === "found"
                ? {
                    duration: 0.6,
                    times: [0, 0.5, 1],
                  }
                : {},
          }}
        >
          <FormField
            label="Departure Date"
            required
            type="date"
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
            disabled={!connected || isSubmitting || pnrStatus === "found"}
            showLockIcon={pnrStatus === "found"}
            className={
              pnrStatus === "found"
                ? "border-2 border-amber-500/50 shadow-[0_0_0_2px_rgba(251,191,36,0.2)]"
                : ""
            }
          />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: pnrStatus === "found" ? [1, 1.02, 1] : 1,
          }}
          transition={{
            delay: 0.35,
            scale:
              pnrStatus === "found"
                ? {
                    duration: 0.6,
                    times: [0, 0.5, 1],
                  }
                : {},
          }}
        >
          <label className="block text-sm font-medium text-white">
            Departure Time *
          </label>
          <div className="relative">
            <select
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              disabled={!connected || isSubmitting || pnrStatus === "found"}
              className={`w-full px-4 py-2.5 bg-black border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all ${
                pnrStatus === "found"
                  ? "border-2 border-amber-500/50 shadow-[0_0_0_2px_rgba(251,191,36,0.2)] pr-10 appearance-none"
                  : "border border-gray-700 disabled:opacity-50"
              }`}
            >
              <option value="" disabled>
                Select time
              </option>
              {timeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {pnrStatus === "found" && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
