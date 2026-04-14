import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { GlowingEffect } from "@/components/ui/glowing-effect";

const HOW_IT_WORKS_STEPS = [
  "Select an insurance product and enter your flight details",
  "Pay the premium in USDC through your connected wallet",
  "Receive a policy NFT as proof of your coverage",
  "Get automatic USDC payouts if your flight is delayed beyond the threshold",
];

export function HowItWorksCard() {
  return (
    <motion.div
      data-tutorial="how-it-works"
      initial={{ opacity: 0, x: 30, y: 20 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{
        delay: 0.4,
        type: "spring",
        stiffness: 100,
        damping: 15,
      }}
      className="relative rounded-[1.25rem] border-[0.75px] border-gray-800 p-2 md:rounded-3xl md:p-3"
    >
      <GlowingEffect
        spread={40}
        glow={true}
        disabled={false}
        proximity={64}
        inactiveZone={0.01}
        borderWidth={3}
      />
      <Card className="relative overflow-hidden rounded-xl border-[0.75px] border-gray-800 bg-black">
        <CardContent className="p-6">
          <motion.h4
            className="text-lg font-semibold text-white mb-3 flex items-center gap-2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <motion.span
              className="w-1 h-5 bg-blue-500 rounded-full"
              animate={{
                height: [20, 24, 20],
                opacity: [1, 0.8, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            How It Works
          </motion.h4>
          <motion.ul
            className="space-y-3 text-sm text-gray-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {HOW_IT_WORKS_STEPS.map((text, index) => (
              <motion.li
                key={index}
                className="flex items-start gap-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.65 + index * 0.1 }}
                whileHover={{ x: 5, transition: { duration: 0.2 } }}
              >
                <motion.span
                  className="text-indigo-400 mt-1 font-semibold"
                  whileHover={{ scale: 1.2 }}
                >
                  {index + 1}.
                </motion.span>
                <span>{text}</span>
              </motion.li>
            ))}
          </motion.ul>
        </CardContent>
      </Card>
    </motion.div>
  );
}
