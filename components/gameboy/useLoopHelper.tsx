import { useRef } from "react";

const useLoopHelper = (reportFreqMs: number, gbSpeed: number) => {
  const lastLoop = useRef(performance.now());
  const lastFpsReport = useRef(performance.now());
  const framesDrawn = useRef(0);
  const fpsReportRateMs = reportFreqMs;

  const reset = () => {
    lastLoop.current = performance.now();
    lastFpsReport.current = performance.now();
    framesDrawn.current = 0;
  };

  const calculateTicksToRun = (now: DOMHighResTimeStamp, turbo = false) => {
    const elapsedMs = now - lastLoop.current;
    const ticks = turbo ? gbSpeed : (elapsedMs / 1000) * gbSpeed;
    lastLoop.current = now;
    return ticks;
  };

  const recordFrameDraw = () => {
    framesDrawn.current += 1;
  };

  const reportFps = (now: DOMHighResTimeStamp) => {
    const elapsedSinceLastFpsReport = now - lastFpsReport.current;
    if (elapsedSinceLastFpsReport >= fpsReportRateMs) {
      lastFpsReport.current = now;
      const fps = framesDrawn.current / (elapsedSinceLastFpsReport / 1000);
      framesDrawn.current = 0;

      return fps;
    }
  };

  return {
    reset,
    calculateTicksToRun,
    reportFps,
    recordFrameDraw,
  };
};

export default useLoopHelper;
