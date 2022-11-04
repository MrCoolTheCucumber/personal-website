import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { GameBoy, Keycode } from "@mrcoolthecucumber/gameboy_web";

const GB_FPS_INTERVAL = 1000 / 60;

type GameBoyWebInterface = typeof import("@mrcoolthecucumber/gameboy_web");

export type GameBoyCartridge = {
  rom: Uint8Array;
  ram?: Uint8Array;
};

export interface GameBoyComponentProps {
  gbScale?: number;
}

export type GameBoyContext = {
  increaseScale: () => void;
  decreaseScale: () => void;
  loadGame: (cart: GameBoyCartridge) => void;
  start: () => void;
  stop: () => void;
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

const GameBoyStats = () => {};

// https://stackoverflow.com/questions/37949981/call-child-method-from-parent
// https://stackoverflow.com/questions/62210286/declare-type-with-react-useimperativehandle

const GameBoyComponent = forwardRef<GameBoyContext, GameBoyComponentProps>(
  (props: GameBoyComponentProps, ref) => {
    const [gbWasm, setGbWasm] = useState<GameBoyWebInterface>();
    const [gbScale, setGbScale] = useState(props.gbScale ?? 2);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gbInstance = useRef<GameBoy | null>(null);
    const lastDraw = useRef(0);
    const rafId = useRef(-1);
    const turbo = useRef(false);
    const onKeyUpHandlerRef = useRef<(e: KeyboardEvent) => void>();
    const onKeyDownHandlerRef = useRef<(e: KeyboardEvent) => void>();
    const stopped = useRef(false);
    const frames = useRef(0);

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

    const tickFrame = (timestamp: DOMHighResTimeStamp) => {
      let gb = gbInstance.current;
      let canvas = canvasRef.current;
      if (!gb || !canvas) return;

      if (
        (timestamp - lastDraw.current >= GB_FPS_INTERVAL || turbo.current) &&
        !stopped.current
      ) {
        gb.tick_to_frame();
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
        lastDraw.current = performance.now();
        frames.current += 1;
      }

      rafId.current = window.requestAnimationFrame(tickFrame);
    };

    useEffect(() => {
      const loadWasm = async () => {
        const wasm = await import("@mrcoolthecucumber/gameboy_web");
        setGbWasm(wasm);
      };

      if (!gbWasm) {
        loadWasm();
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
    }, []);

    useImperativeHandle(ref, () => ({
      increaseScale: () => setGbScale(gbScale + 1),
      decreaseScale: () => {
        if (gbScale > 1) setGbScale(gbScale - 1);
      },
      start: () => (stopped.current = false),
      stop: () => (stopped.current = true),
      loadGame: (cart: GameBoyCartridge) => {
        const newGb = gbWasm?.GameBoy.new(cart.rom);
        const canvas = canvasRef.current;

        if (newGb && canvas) {
          if (gbInstance.current) {
            gbInstance.current.free();
          }
          window.cancelAnimationFrame(rafId.current);

          gbInstance.current = newGb;
          rafId.current = window.requestAnimationFrame(tickFrame);
        }
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
