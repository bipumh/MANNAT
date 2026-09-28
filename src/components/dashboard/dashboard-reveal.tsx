"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Subtle mount reveal for dashboard sections — a small fade + rise on load.
 * Respects the app-level MotionConfig reduced-motion setting.
 */
export function DashboardReveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
