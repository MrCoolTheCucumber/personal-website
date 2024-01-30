import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Keycode } from "@mrcoolthecucumber/partyboy-core-web";
import useAudioHelper from "./useAudioHelper";
import { GbMsg, MsgFromGb } from "./gbMsg.ts";
import GBWorker from "../../components/gameboy/gameboy.worker.ts";

/**
 *  Number of cycles per second the gameboy does in single speed mode.
 *  When the emulator is in double speed mode, you don't need to double the speed
 *  as the `tick` function will internally tick twice
 */
export const SPEED = 4_194_304;

export type GameBoyCartridge = {
  rom: Uint8Array;
  ram?: Uint8Array;
};

export interface GameBoyComponentProps {
  gbScale?: number;
  game?: GameBoyCartridge;
  onReportFps: (fps: number) => void;
}

export type GameBoyContext = {
  increaseScale: () => void;
  decreaseScale: () => void;
  loadGame: (cart: GameBoyCartridge) => void;
  start: () => void;
  stop: () => void;
  takeSnapshot: () => void;
  loadSnapshot: () => void;
  setVolumeMultiplier: (mult: number) => void;
};

const keyToKeycode = (key: string): Keycode | undefined => {
  switch (key) {
    case "w":
      return Keycode.Up;
    case "a":
      return Keycode.Left;
    case "s":
      return Keycode.Down;
    case "d":
      return Keycode.Right;
    case "o":
      return Keycode.A;
    case "k":
      return Keycode.B;
    case "m":
      return Keycode.Start;
    case "n":
      return Keycode.Select;
  }
};

// https://stackoverflow.com/questions/37949981/call-child-method-from-parent
// https://stackoverflow.com/questions/62210286/declare-type-with-react-useimperativehandle

const GameBoyComponent = forwardRef<GameBoyContext, GameBoyComponentProps>(
  function GameBoyComponent(props: GameBoyComponentProps, ref) {
    const audioHelper = useAudioHelper(48000);

    const [gbScale, setGbScale] = useState(props.gbScale ?? 2);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const currentFrame = useRef<Uint8Array>();

    const rafId = useRef(-1);
    const onKeyUpHandlerRef = useRef<(e: KeyboardEvent) => void>();
    const onKeyDownHandlerRef = useRef<(e: KeyboardEvent) => void>();

    const worker = useRef<Worker>();

    const setUpEventHandlers = () => {
      onKeyDownHandlerRef.current = (e: KeyboardEvent) => {
        if (e.repeat) return;
        let keycode = keyToKeycode(e.key);
        if (keycode !== undefined) {
          worker.current?.postMessage({
            type: "inputdown",
            data: keycode,
          });
        }
        if (e.key === " ") {
          e.preventDefault();
          worker.current?.postMessage({
            type: "turbo",
            data: true,
          });
        }
        if (e.key == "q") {
          e.preventDefault();
          worker.current?.postMessage({
            type: "startrewind",
          });
        }
      };
      onKeyUpHandlerRef.current = (e: KeyboardEvent) => {
        if (e.repeat) return;
        let keycode = keyToKeycode(e.key);
        if (keycode !== undefined) {
          worker.current?.postMessage({
            type: "inputup",
            data: keycode,
          });
        }
        if (e.key === " ") {
          e.preventDefault();
          worker.current?.postMessage({
            type: "turbo",
            data: false,
          });
          audioHelper.reset();
        }
        if (e.key == "q") {
          e.preventDefault();
          worker.current?.postMessage({
            type: "stoprewind",
          });
          audioHelper.reset();
        }
      };

      window.addEventListener("keydown", onKeyDownHandlerRef.current);
      window.addEventListener("keyup", onKeyUpHandlerRef.current);
    };

    useEffect(() => {
      if (!worker.current) {
        const _worker: Worker = new GBWorker();
        _worker.onmessage = onWorkerRecv;
        worker.current = _worker;
      } else {
        console.log("worker already initted!");
      }

      setUpEventHandlers();

      return () => {
        console.log("tearing down...");

        worker.current?.postMessage({
          type: "shutdown",
        });

        window.cancelAnimationFrame(rafId.current);

        window.removeEventListener(
          "keydown",
          onKeyDownHandlerRef.current ?? (() => {})
        );
        window.removeEventListener(
          "keyup",
          onKeyUpHandlerRef.current ?? (() => {})
        );
      };
    }, []);

    const loadGame = (cart: GameBoyCartridge) => {
      worker.current?.postMessage({
        type: "load",
        data: {
          cart,
        },
      });

      // warmup
      const blankSamples = new Float32Array(512 * 36).fill(0);
      audioHelper.handleAudio(blankSamples);
    };

    const onWorkerRecv = function (e: MessageEvent<GbMsg<MsgFromGb>>) {
      let msg = e.data;

      switch (msg.type) {
        case "ready":
          if (props.game) {
            loadGame(props.game);
            rafId.current = window.requestAnimationFrame(renderLoop);
          }
          break;

        case "fps":
          props.onReportFps(msg.data);
          break;

        case "recvframe":
          currentFrame.current = msg.data;
          break;

        case "recvaudio":
          audioHelper.handleAudio(msg.data);
          break;
      }
    };

    // TODO: call createImageBitmap(ImageData) in the webworker, possibly in wasm itself,
    //       and then send that to the main thread instead of the framebuffer
    const renderLoop = (_: DOMHighResTimeStamp) => {
      if (audioHelper.needMoreSamples() && worker.current) {
        worker.current.postMessage({
          type: "runforsamples",
          data: audioHelper.samplesNeeded(),
        });
      }

      if (!currentFrame.current || !canvasRef.current) {
        rafId.current = window.requestAnimationFrame(renderLoop);
        return;
      }

      let ctx = canvasRef.current.getContext("2d");
      if (!ctx) {
        rafId.current = window.requestAnimationFrame(renderLoop);
        return;
      }

      let imgData = new ImageData(160, 144);
      for (let i = 0; i < 160 * 144 * 3; i += 3) {
        let r = currentFrame.current[i];
        let g = currentFrame.current[i + 1];
        let b = currentFrame.current[i + 2];
        let imgDataIndex = (i / 3) * 4;
        imgData.data[imgDataIndex] = r;
        imgData.data[imgDataIndex + 1] = g;
        imgData.data[imgDataIndex + 2] = b;
        imgData.data[imgDataIndex + 3] = 255;
      }

      ctx.putImageData(imgData, 0, 0);
      rafId.current = window.requestAnimationFrame(renderLoop);
    };

    useImperativeHandle(ref, () => ({
      increaseScale: () => setGbScale(gbScale + 1),
      decreaseScale: () => {
        if (gbScale > 1) setGbScale(gbScale - 1);
      },
      start: () => worker.current?.postMessage({ type: "start" }),
      stop: () => worker.current?.postMessage({ type: "stop" }),
      loadGame,
      takeSnapshot: () => worker.current?.postMessage({ type: "takesnapshot" }),
      loadSnapshot: () => worker.current?.postMessage({ type: "loadsnapshot" }),
      setVolumeMultiplier: (mult) => audioHelper.setVolMult(mult),
    }));

    return (
      <div>
        <canvas
          ref={canvasRef}
          width="160"
          height="144"
          style={{
            width: `${160 * gbScale}px`,
            height: `${144 * gbScale}px`,
            imageRendering: "pixelated",
            backgroundColor: "white",
            border: "1px solid black",
          }}
        />
      </div>
    );
  }
);

export default GameBoyComponent;
