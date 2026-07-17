import { motion } from "motion/react";

export const AILoadingAnimation = () => {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: 3 }).map((_, index) => (
        <motion.div
          key={index}
          className="size-4 rounded-full bg-primary/80"
          initial={{
            backgroundColor: "oklch(60.9% 0.126 221.723)",
          }}
          animate={{
            transform: "translateY(15px)",
            backgroundColor: "oklch(69.6% 0.17 162.48)",
          }}
          transition={{
            repeat: Infinity,
            repeatType: "mirror",
            duration: 0.75,
            ease: "easeInOut",
            delay: 0.2 * index,
          }}
        />
      ))}
    </div>
  );
};
