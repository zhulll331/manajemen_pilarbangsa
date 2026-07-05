"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

export function ScrollReveal({ 
  children, 
  delay = 0,
  direction = "up"
}: { 
  children: ReactNode,
  delay?: number,
  direction?: "up" | "left" | "right" | "down" | "none"
}) {
  const getVariants = () => {
    switch (direction) {
      case "up": return { hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0 } };
      case "down": return { hidden: { opacity: 0, y: -50 }, visible: { opacity: 1, y: 0 } };
      case "left": return { hidden: { opacity: 0, x: -50 }, visible: { opacity: 1, x: 0 } };
      case "right": return { hidden: { opacity: 0, x: 50 }, visible: { opacity: 1, x: 0 } };
      default: return { hidden: { opacity: 0 }, visible: { opacity: 1 } };
    }
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      variants={getVariants()}
    >
      {children}
    </motion.div>
  );
}
