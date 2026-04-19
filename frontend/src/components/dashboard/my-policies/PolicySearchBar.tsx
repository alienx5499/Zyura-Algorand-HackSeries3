import { Search } from "lucide-react";

type PolicySearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export function PolicySearchBar({ value, onChange }: PolicySearchBarProps) {
  return (
    <div className="mb-6">
      <label htmlFor="policy-search" className="sr-only">
        Search policies
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <input
          id="policy-search"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search by policy ID, flight, PNR, status, product ID"
          className="w-full rounded-lg border border-gray-800 bg-gray-950/60 py-2.5 pl-9 pr-3 text-sm text-gray-100 placeholder:text-gray-500 outline-none transition-colors focus:border-emerald-500/50"
        />
      </div>
    </div>
  );
}
