import { motion } from "framer-motion";
import { GlowingEffect } from "@/components/ui/glowing-effect";

export function TutorialOverlay({
  targetRect,
}: {
  targetRect: DOMRect | null;
}) {
  return (
    <>
      {targetRect ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed z-[9998] pointer-events-auto bg-black/85"
            style={{
              top: 0,
              left: 0,
              right: 0,
              height: `${Math.max(0, targetRect.top - 8)}px`,
            }}
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed z-[9998] pointer-events-auto bg-black/85"
            style={{
              top: `${targetRect.bottom + 8}px`,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed z-[9998] pointer-events-auto bg-black/85"
            style={{
              top: `${Math.max(0, targetRect.top - 8)}px`,
              left: 0,
              width: `${Math.max(0, targetRect.left - 8)}px`,
              height: `${targetRect.height + 16}px`,
            }}
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed z-[9998] pointer-events-auto bg-black/85"
            style={{
              top: `${Math.max(0, targetRect.top - 8)}px`,
              left: `${targetRect.right + 8}px`,
              right: 0,
              height: `${targetRect.height + 16}px`,
            }}
          />
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] pointer-events-auto bg-black/85"
        />
      )}
      {targetRect && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="fixed z-[9999] pointer-events-none"
          style={{
            top: `${targetRect.top - 12}px`,
            left: `${targetRect.left - 12}px`,
            width: `${targetRect.width + 24}px`,
            height: `${targetRect.height + 24}px`,
          }}
        >
          <div className="relative w-full h-full rounded-[1.25rem] md:rounded-3xl">
            <GlowingEffect
              spread={40}
              glow={true}
              disabled={false}
              proximity={64}
              inactiveZone={0.01}
              borderWidth={3}
            />
            <div className="absolute inset-0 rounded-[1.25rem] md:rounded-3xl border-[0.75px] border-indigo-500/50" />
          </div>
        </motion.div>
      )}
    </>
  );
}
