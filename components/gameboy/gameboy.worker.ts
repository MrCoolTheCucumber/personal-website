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
let snapshot: BitPackedState | undefined;
let stopped = false;
let gb: GameBoy | null = null;
let rafId = -1;
let turbo = false;
let turboId: NodeJS.Timer;
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
  let msg = e.data;

  switch (msg.type) {
    case "runforsamples":
      tickEmulator(msg.data);
      break;

    case "inputdown":
      gb?.key_down(msg.data);
      break;

    case "inputup":
      gb?.key_up(msg.data);
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
      }
      break;

    case "turbo":
      turbo = msg.data;

      if (turbo) {
        turboId = setTimeout(turboEmulator, 0);
      } else {
        clearTimeout(turboId);
      }

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

const sendSamples = (samples: Float32Array) => {
  postMessage(
    {
      type: "recvaudio",
      data: samples,
    },
    [samples.buffer]
  );
};

const sendEmptySamples = () => {
  sendSamples(new Float32Array(512).fill(0));
};

const tickEmulator = (samplesNeeded: number) => {
  if (!gb || !wasm || stopped || turbo) {
    sendEmptySamples();
    return;
  }

  const now = performance.now();

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

    sendEmptySamples();
  } else {
    let remaining = samplesNeeded;

    // TODO: make handle_ticks take in a sample number, rather
    // than returning fixed chunks
    while (remaining > 0) {
      const samples = wasm.handle_ticks(gb);
      console.log(remaining, samples.length);
      remaining -= samples.length;
      sendSamples(samples);

      // TODO: this has vsync issues?
      // we need to send the frame buffer as soon as the flag is set
      // also we need to be able to request for x amount of samples from the main thread
      // to prevent the initial buffer underrun

      if (gb.consume_draw_flag()) {
        const fb = gb.get_frame_buffer();
        postMessage(
          {
            type: "recvframe",
            data: fb,
          },
          [fb.buffer]
        );
        loopHelper.recordFrameDraw();

        if (!turbo) {
          let state = wasm.take_snapshot(gb);
          rewindHelper.pushState(state);
        }
      }
    }
  }

  if (!turbo) {
    let fps = loopHelper.reportFps(now);
    if (fps) {
      const fpsMsg: GbMsg<MsgFromGb> = {
        type: "fps",
        data: fps,
      };
      postMessage(fpsMsg);
    }
  }
};

const turboEmulator = () => {
  if (!gb || !wasm || !turbo) return;

  const now = performance.now();

  let ticks = BigInt(1_000_000);

  while (ticks > BigInt(0)) {
    let remaining_ticks = wasm?.batch_ticks(gb, ticks);

    if (remaining_ticks <= BigInt(0)) {
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
    ticks = remaining_ticks;

    if (!rewinding) {
      let state = wasm.take_snapshot(gb);
      rewindHelper.pushState(state);
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

  turboId = setTimeout(turboEmulator, 0);
};

export default null as any;
