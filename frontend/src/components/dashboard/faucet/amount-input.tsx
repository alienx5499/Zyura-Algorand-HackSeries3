"use client";

import { Input } from "@/components/ui/input";

type AmountInputProps = {
  value: string;
  disabled: boolean;
  onChange: (next: string) => void;
};

export function AmountInput({ value, disabled, onChange }: AmountInputProps) {
  return (
    <>
      <label className="sr-only" htmlFor="recycle-amount">
        Amount in USDC to send to faucet
      </label>
      <Input
        id="recycle-amount"
        inputMode="decimal"
        autoComplete="off"
        placeholder="0.00"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 border-gray-700/90 bg-gray-950/80 text-white placeholder:text-gray-600"
      />
    </>
  );
}
