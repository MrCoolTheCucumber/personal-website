import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { GameBoy, Keycode } from "@mrcoolthecucumber/gameboy_web";
import useLoopHelper from "./useLoopHelper";

type GameBoyWebInterface = typeof import("@mrcoolthecucumber/gameboy_web");

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
  takeSnapshot: () => Uint8Array | undefined;
  loadSnapshot: (snapshot: Uint8Array) => void;
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
    const loopHelper = useLoopHelper(500, SPEED);
    const [fps, setFps] = useState(0);

    const [gbWasm, setGbWasm] = useState<GameBoyWebInterface>();
    const [gbScale, setGbScale] = useState(props.gbScale ?? 2);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gbInstance = useRef<GameBoy | null>(null);
    const rafId = useRef(-1);
    const turbo = useRef(false);
    const onKeyUpHandlerRef = useRef<(e: KeyboardEvent) => void>();
    const onKeyDownHandlerRef = useRef<(e: KeyboardEvent) => void>();
    const stopped = useRef(false);

    const setUpEventHandlers = () => {
      onKeyDownHandlerRef.current = (e: KeyboardEvent) => {
        let gb = gbInstance.current;
        if (!gb || e.repeat) return;

        let keycode = keyToKeycode(e.key);
        if (keycode !== undefined) {
          gb.key_down(keycode);
        }

        if (e.key === " ") {
          e.preventDefault();
          turbo.current = true;
        }
      };
      onKeyUpHandlerRef.current = (e: KeyboardEvent) => {
        let gb = gbInstance.current;
        if (!gb || e.repeat) return;

        let keycode = keyToKeycode(e.key);
        if (keycode !== undefined) {
          gb.key_up(keycode);
        }

        if (e.key === " ") {
          e.preventDefault();
          turbo.current = false;
        }
      };

      window.addEventListener("keydown", onKeyDownHandlerRef.current);
      window.addEventListener("keyup", onKeyUpHandlerRef.current);
    };

    const render = () => {
      let gb = gbInstance.current;
      let canvas = canvasRef.current;
      if (!gb || !canvas) return;

      let fb = gb.get_frame_buffer();

      let ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      let imgData = ctx.getImageData(0, 0, 160, 144);
      for (let i = 0; i < 160 * 144 * 3; i += 3) {
        let r = fb[i];
        let g = fb[i + 1];
        let b = fb[i + 2];

        let imgDataIndex = (i / 3) * 4;
        imgData.data[imgDataIndex] = r;
        imgData.data[imgDataIndex + 1] = g;
        imgData.data[imgDataIndex + 2] = b;
        imgData.data[imgDataIndex + 3] = 255;
      }

      ctx.putImageData(imgData, 0, 0);
    };

    useEffect(() => {
      const loadWasm = async () => {
        const wasm = await import("@mrcoolthecucumber/gameboy_web");
        setGbWasm(wasm);
      };

      if (!gbWasm) {
        loadWasm().then(() => {
          if (props.game) {
            loadGame(props.game);
          }
        });
      } else if (props.game) {
        loadGame(props.game);
      }

      setUpEventHandlers();

      return () => {
        window.cancelAnimationFrame(rafId.current);
        gbInstance.current?.free();

        window.removeEventListener(
          "keydown",
          onKeyDownHandlerRef.current ?? (() => {})
        );
        window.removeEventListener(
          "keyup",
          onKeyUpHandlerRef.current ?? (() => {})
        );
      };
    }, [gbWasm]);

    /**
     * Called on each request animation frame callback
     */
    const runEmulator = (_: DOMHighResTimeStamp) => {
      if (!gbInstance.current || !gbWasm) {
        return;
      }

      const now = performance.now();

      let ticks = BigInt(
        Math.floor(loopHelper.calculateTicksToRun(now, turbo.current))
      );

      while (!stopped.current) {
        let remaining = gbWasm?.batch_ticks(gbInstance.current, ticks);
        if (remaining != BigInt(0)) {
          render();
          loopHelper.recordFrameDraw();
          ticks = remaining;
        } else {
          break;
        }
      }

      let fps = loopHelper.reportFps(now);
      if (fps) {
        props.onReportFps(fps);
      }

      rafId.current = window.requestAnimationFrame(runEmulator);
    };

    const loadGame = (cart: GameBoyCartridge) => {
      const newGb = gbWasm?.GameBoyBuilder.new().rom(cart.rom).build();
      const canvas = canvasRef.current;

      if (newGb && canvas) {
        if (gbInstance.current) {
          gbInstance.current.free();
        }
        window.cancelAnimationFrame(rafId.current);
        gbInstance.current = newGb;

        loopHelper.reset();
        rafId.current = window.requestAnimationFrame(runEmulator);
      }
    };

    useImperativeHandle(ref, () => ({
      increaseScale: () => setGbScale(gbScale + 1),
      decreaseScale: () => {
        if (gbScale > 1) setGbScale(gbScale - 1);
      },
      start: () => (stopped.current = false),
      stop: () => (stopped.current = true),
      loadGame,
      takeSnapshot: () => {
        if (!gbWasm || !gbInstance.current) return;
        return gbWasm.take_snapshot(gbInstance.current);
      },
      loadSnapshot: (snapshot: Uint8Array) => {
        if (!gbWasm || !gbInstance.current) return;
        gbWasm.load_snapshot(snapshot, gbInstance.current);
      },
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
          }}
        />
      </div>
    );
  }
);

export default GameBoyComponent;
