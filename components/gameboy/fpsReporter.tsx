import React, { useEffect, useRef, useState } from "react";

interface FpsReporterProps {
  reportFrequency: number;
  targetFps?: number;
}

const useFpsReporter = (props: FpsReporterProps) => {
  const frames = useRef(0);
  const elapsedTime = useRef(0);
  const lastReportTs = useRef(performance.now());
  const loopStartTs = useRef(performance.now());

  const loopStart = () => {
    let now = performance.now();
    let delta = now - loopStartTs.current;
    loopStartTs.current = now;

    frames.current += 1;
    elapsedTime.current += delta;
    return delta;
  };

  const reportFps = () => {
    let now = performance.now();
    let sinceLastReport = now - lastReportTs.current;
    if (sinceLastReport > props.reportFrequency && frames.current > 0) {
      let fps = frames.current / elapsedTime.current;
      elapsedTime.current = 0;
      frames.current = 0;
      lastReportTs.current = now;

      return fps;
    }
  };

  return {
    loopStart,
    reportFps,
  };
};
