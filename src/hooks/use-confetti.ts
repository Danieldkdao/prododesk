import confetti from "canvas-confetti";

type ConfettiOptions = {
  angle?: number;
  spread?: number;
  startVelocity?: number;
  decay?: number;
  gravity?: number;
  drift?: number;
  ticks?: number;
  origin?: {
    x?: number;
    y?: number;
  };
  colors?: string[];
  shapes?: ("square" | "circle" | "star")[];
  scalar?: number;
  zIndex?: number;
  disableForReducedMotion?: boolean;
  particleCount?: number;
};

export const useConfetti = () => {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
  };

  function fire(particleRatio: number, opts: ConfettiOptions) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  const triggerConfetti = () => {
    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });
    fire(0.2, {
      spread: 60,
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  };

  return { fire, triggerConfetti };
};
