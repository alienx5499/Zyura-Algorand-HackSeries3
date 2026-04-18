"use client";

type PresetButtonsProps = {
  disabled: boolean;
  onQuarter: () => void;
  onHalf: () => void;
  onMax: () => void;
};

const buttonClassName =
  "cursor-pointer rounded-lg border border-gray-700/90 bg-gray-950/80 px-3 py-3 text-sm font-medium text-white transition-colors duration-200 hover:border-indigo-500/40 hover:bg-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-35";

export function PresetButtons({
  disabled,
  onQuarter,
  onHalf,
  onMax,
}: PresetButtonsProps) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:max-w-xs sm:shrink-0">
      <button
        type="button"
        disabled={disabled}
        onClick={onQuarter}
        className={buttonClassName}
      >
        25%
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onHalf}
        className={buttonClassName}
      >
        50%
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onMax}
        className={buttonClassName}
      >
        Max
      </button>
    </div>
  );
}
