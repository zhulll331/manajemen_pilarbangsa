"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LoadingLogo } from "@/components/LoadingLogo";

export function SplashScreen() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Menahan splash screen selama tepat 2 detik (2000ms) pada initial load
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="splash-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(8px)" }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="fixed inset-0 z-[99999] min-h-screen w-full flex items-center justify-center bg-white/95 backdrop-blur-md"
        >
          <LoadingLogo fullScreen={false} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
