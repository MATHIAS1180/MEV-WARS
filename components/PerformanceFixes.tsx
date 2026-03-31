"use client";

import { useEffect } from "react";

export default function PerformanceFixes() {
  useEffect(() => {
    const perf = typeof window !== "undefined" ? window.performance : undefined;
    if (!perf) return;

    if (typeof perf.clearMarks !== "function") {
      // Defensive no-op to avoid runtime crashes in partial Performance API environments.
      (perf as Performance & { clearMarks: (markName?: string) => void }).clearMarks = () => {};
    }

    if (typeof perf.clearMeasures !== "function") {
      // Defensive no-op to avoid runtime crashes in partial Performance API environments.
      (perf as Performance & { clearMeasures: (measureName?: string) => void }).clearMeasures = () => {};
    }
  }, []);

  return null;
}