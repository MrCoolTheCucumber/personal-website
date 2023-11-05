const useLoopHelper = (reportFreqMs: number, gbSpeed: number) => {
  let lastLoop = performance.now();
  let lastFpsReport = performance.now();
  let framesDrawn = 0;
  const fpsReportRateMs = reportFreqMs;

  const reset = () => {
    lastLoop = performance.now();
    lastFpsReport = performance.now();
    framesDrawn = 0;
  };

  const calculateTicksToRun = (now: DOMHighResTimeStamp, turbo = false) => {
    const elapsedMs = now - lastLoop;
    const ticks = turbo ? gbSpeed : (elapsedMs * gbSpeed) / 1000;
    lastLoop = now;
    return ticks;
  };

  const recordFrameDraw = () => {
    framesDrawn += 1;
  };

  const reportFps = (now: DOMHighResTimeStamp) => {
    const elapsedSinceLastFpsReport = now - lastFpsReport;
    if (elapsedSinceLastFpsReport >= fpsReportRateMs) {
      lastFpsReport = now;
      const fps = framesDrawn / (elapsedSinceLastFpsReport / 1000);
      framesDrawn = 0;

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
