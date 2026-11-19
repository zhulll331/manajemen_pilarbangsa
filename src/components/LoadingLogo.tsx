import React from "react";
import { PilarLoader } from "@/components/PilarLoader";

export function LoadingLogo({ fullScreen = true }: { fullScreen?: boolean }) {
  return <PilarLoader fullscreen={fullScreen} size={fullScreen ? "lg" : "md"} />;
}
