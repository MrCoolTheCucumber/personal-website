import { BitPackedState, GameBoy } from "@mrcoolthecucumber/gameboy_web";
import useLoopHelper from "./useLoopHelper";
import { GbMsg, MsgFromGb, MsgToGb } from "./gbMsg";
import useRewindHelper from "./useRewindHelper";
type GameBoyWebInterface = typeof import("@mrcoolthecucumber/gameboy_web");

const worker: Worker = self as any;
const SPEED = 4_194_304;

const loopHelper = useLoopHelper(500, SPEED); // eslint-disable-line
const rewindHelper = useRewindHelper(); // eslint-disable-line

let wasm: GameBoyWebInterface | null = null;
let canvas: OffscreenCanvas | null = null;
let snapshot: BitPackedState | undefined;
let stopped = false;
let gb: GameBoy | null = null;
let rafId = -1;
let turbo = false;
let rewinding = false;

console.log("WebWorker running...");

(async () => {
  const _wasm = await import("@mrcoolthecucumber/gameboy_web");
  wasm = _wasm;
  wasm.init_panic_hook();
})().then(() => {
  postMessage({ type: "ready" });
  console.log("WASM loaded within worker.");
});

worker.onmessage = function onRecv(e: MessageEvent<GbMsg<MsgToGb>>) {
  console.log("recieved msg", e);
  let msg = e.data;

  switch (msg.type) {
    case "inputdown":
      gb?.key_down(msg.data);
      break;

    case "inputup":
      gb?.key_up(msg.data);
      break;

    case "sendcanvas":
      canvas = msg.data.canvas;
      break;

    case "load":
      const cart = msg.data.cart;
      console.log("Building gb...");
      const newGb = wasm?.GameBoyBuilder.new().rom(cart.rom).build();
      console.log("Built gb!");

      if (newGb) {
        if (gb) {
          gb.free();
        }

        cancelAnimationFrame(rafId);
        gb = newGb;

        loopHelper.reset();
        rafId = requestAnimationFrame(runEmulator);
      }
      break;

    case "turbo":
      turbo = msg.data;
      break;

    case "start":
      stopped = false;
      break;

    case "stop":
      stopped = true;
      break;

    case "startrewind":
      rewinding = true;
      break;

    case "stoprewind":
      rewinding = false;
      break;

    case "takesnapshot":
      if (gb) snapshot = wasm?.take_snapshot(gb);
      break;

    case "loadsnapshot":
      if (snapshot && gb) wasm?.load_snapshot(gb, snapshot);
      break;

    case "shutdown":
      cancelAnimationFrame(rafId);
      console.log("Closing webworker...");
      close();
      break;
  }
};

/**
 * Called on each request animation frame callback
 */
const runEmulator = (_: DOMHighResTimeStamp) => {
  if (!gb || !wasm) {
    return;
  }

  const now = performance.now();

  let ticks = BigInt(Math.floor(loopHelper.calculateTicksToRun(now, turbo)));

  // This can happen if the user tabs out for too long I think
  if (ticks > BigInt(4_000_000) && !turbo) {
    ticks = BigInt(0);
  } else if (turbo) {
    // TODO: This seems to help a lot with syncing audio and
    //       responsivenes of turbo mode in general
    ticks = BigInt(1_000_000);
  }

  while (!stopped && !rewinding && ticks > BigInt(0)) {
    let output = wasm?.batch_ticks(gb, ticks);

    if (!turbo) {
      postMessage(
        {
          type: "recvaudio",
          data: output.samples,
        },
        [output.samples.buffer]
      );
    }

    if (output.remaining_ticks <= BigInt(0)) {
      break;
    }

    const fb = gb.get_frame_buffer();
    postMessage(
      {
        type: "recvframe",
        data: fb,
      },
      [fb.buffer]
    );

    loopHelper.recordFrameDraw();
    ticks = output.remaining_ticks;

    if (!rewinding && !turbo) {
      let state = wasm.take_snapshot(gb);
      rewindHelper.pushState(state);
    }
  }

  if (rewinding) {
    let state = rewindHelper.popState();
    if (state) {
      wasm.load_snapshot(gb, state);
      const fb = gb.get_frame_buffer();
      postMessage(
        {
          type: "recvframe",
          data: fb,
        },
        [fb.buffer]
      );
      state.free();
    }
  }

  let fps = loopHelper.reportFps(now);
  if (fps) {
    const fpsMsg: GbMsg<MsgFromGb> = {
      type: "fps",
      data: fps,
    };
    postMessage(fpsMsg);
  }

  rafId = requestAnimationFrame(runEmulator);
};

export default null as any;
