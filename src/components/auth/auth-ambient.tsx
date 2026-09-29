"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Dark, layered ambient background for the auth form side. Uses slow,
 * restrained motion (a gentle pulse + drift) so the page feels alive without
 * competing with the form. Static when `prefers-reduced-motion` is set.
 */
export function AuthAmbient() {
  const reduced = useReducedMotion();

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* dark charcoal base with subtle depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(13,19,16,1), rgba(4,6,5,1))",
        }}
      />

      {/* large, soft emerald glow behind the form */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at 50% 38%, rgba(45,212,168,0.22) 0%, rgba(45,212,168,0.07) 48%, transparent 72%)",
        }}
        animate={reduced ? undefined : { opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* darker graphite/green glow — top-right corner */}
      <motion.div
        className="absolute -right-28 -top-28 h-[26rem] w-[26rem] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(27,60,48,0.6) 0%, rgba(27,60,48,0.16) 50%, transparent 72%)",
        }}
        animate={reduced ? undefined : { x: [0, -26, 0], y: [0, 20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      {/* flowing light shape — bottom-left */}
      <motion.div
        className="absolute -bottom-28 -left-24 h-[28rem] w-[28rem] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(20,44,35,0.5) 0%, rgba(20,44,35,0.12) 50%, transparent 70%)",
        }}
        animate={reduced ? undefined : { x: [0, 22, 0], y: [0, -24, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      />

      {/* keep the center (behind the fields) darker for readability */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, transparent 0%, rgba(3,5,4,0.55) 75%)",
        }}
      />
    </div>
  );
}
