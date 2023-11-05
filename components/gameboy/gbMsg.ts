export type MsgFromGb = "ready" | "fps" | "recvframe" | "recvaudio";
export type MsgToGb =
  | "load"
  | "shutdown"
  | "turbo"
  | "inputdown"
  | "inputup"
  | "start"
  | "stop"
  | "startrewind"
  | "stoprewind"
  | "takesnapshot"
  | "loadsnapshot"
  // Sync to audio ideas
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects#structured_data
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics
  | "runforsamples";

export interface GbMsg<T extends MsgFromGb | MsgToGb> {
  type: T;
  data?: any;
}
