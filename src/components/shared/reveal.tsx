"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

type Direction = "up" | "down" | "left" | "right" | "none" | "zoom";

const offset: Record<"up" | "down" | "left" | "right", Record<"x" | "y", number>> = {
  up: { x: 0, y: 22 },
  down: { x: 0, y: -22 },
  left: { x: 22, y: 0 },
  right: { x: -22, y: 0 },
};

/**
 * Gentle scroll reveal. Motion is intentionally restrained and respects the
 * user's reduced-motion preference via the app-level MotionConfig.
 */
export function Reveal({
  children,
  delay = 0,
  direction = "up",
  className,
  once = true,
}: {
  children: ReactNode;
  delay?: number;
  direction?: Direction;
  className?: string;
  once?: boolean;
}) {
  const variants: Variants = {
    hidden: {
      opacity: 0,
      ...(direction === "zoom"
        ? { scale: 1.03 }
        : direction !== "none"
          ? offset[direction as keyof typeof offset]
          : {}),
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
        delay,
      },
    },
  };

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "0px 0px -8% 0px" }}
    >
      {children}
    </motion.div>
  );
}
