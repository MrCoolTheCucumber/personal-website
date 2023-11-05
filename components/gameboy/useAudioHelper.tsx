import { useRef } from "react";

const useAudioHelper = (sampleRate: number) => {
  const currentAudioSeconds = useRef(0);
  const volMult = useRef(1);
  const stopped = useRef(false);
  const audioCtx = useRef(
    new window.AudioContext({
      sampleRate,
    })
  );

  const needMoreSamples = (): boolean => {
    return currentAudioSeconds.current <= audioCtx.current.currentTime + 0.075;
  };

  const setVolMult = (mult: number) => {
    volMult.current = mult;
  };

  const handleAudio = (samples: Float32Array) => {
    if (stopped.current) {
      return;
    }

    const frameCount = samples.length / 2;

    if (frameCount == 0) {
      return;
    }

    const audioBuffer = audioCtx.current.createBuffer(2, frameCount, 48000);

    // TODO: optimize gb_web to return samples as array per channel, rather than one array
    for (let channel = 0; channel < 2; channel += 1) {
      const nowBuffering = audioBuffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i += 1) {
        nowBuffering[i] = samples[i * 2 + channel] * volMult.current;
      }
    }

    const audioSource = audioCtx.current.createBufferSource();
    audioSource.buffer = audioBuffer;
    audioSource.connect(audioCtx.current.destination);

    audioSource.start(currentAudioSeconds.current);
    currentAudioSeconds.current += frameCount / audioCtx.current.sampleRate;
  };

  // https://stackoverflow.com/a/76916488
  const stop = () => {
    stopped.current = true;
  };

  const reset = () => {
    audioCtx.current.close();
    audioCtx.current = new window.AudioContext({
      sampleRate,
    });
    stopped.current = false;
  };

  return {
    handleAudio,
    stop,
    reset,
    needMoreSamples,
    setVolMult,
  };
};

export default useAudioHelper;
