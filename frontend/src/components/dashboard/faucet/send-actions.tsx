"use client";

type SendActionsProps = {
  canSend: boolean;
  isSending: boolean;
  onSend: () => void | Promise<void>;
};

export function SendActions({ canSend, isSending, onSend }: SendActionsProps) {
  return (
    <button
      type="button"
      disabled={!canSend}
      onClick={() => void onSend()}
      className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-indigo-500/45 bg-indigo-500/15 px-3 py-2.5 text-sm font-medium text-indigo-100 transition-colors duration-200 hover:border-indigo-400/55 hover:bg-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-35"
    >
      {isSending ? "Waiting for Pera…" : "Sign & send to faucet"}
    </button>
  );
}
