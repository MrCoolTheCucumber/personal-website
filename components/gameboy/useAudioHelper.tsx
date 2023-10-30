import { useRef } from "react";

const useAudioHelper = (sampleRate: number) => {
  const currentAudioSeconds = useRef(0);
  const stopped = useRef(false);
  const audioCtx = useRef(
    new window.AudioContext({
      sampleRate,
    })
  );

  const handleAudio = (samples: Float32Array) => {
    if (stopped.current) {
      return;
    }

    const frameCount = samples.length / 2;

    if (frameCount == 0) {
      return;
    }

    const audioBuffer = audioCtx.current.createBuffer(2, frameCount, 48000);

    for (let channel = 0; channel < 2; channel += 1) {
      const nowBuffering = audioBuffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i += 1) {
        nowBuffering[i] = samples[i * 2 + channel];
      }
    }

    const audioSource = audioCtx.current.createBufferSource();
    audioSource.buffer = audioBuffer;
    audioSource.connect(audioCtx.current.destination);

    // taken from here https://github.com/Powerlated/OptimeGB/blob/master/src/core/audioplayer.ts#L91-L94
    // TODO after some time, the game gets audio delay
    // Reset time if close to buffer underrun
    if (currentAudioSeconds.current <= audioCtx.current.currentTime + 0.02) {
      currentAudioSeconds.current = audioCtx.current.currentTime + 0.06;
    }
    audioSource.start(currentAudioSeconds.current);
    currentAudioSeconds.current += frameCount / audioCtx.current.sampleRate;
  };

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
  };
};

export default useAudioHelper;
