export type MsgFromGb = "ready" | "fps" | "recvframe" | "recvaudio";
export type MsgToGb =
  | "sendcanvas"
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
  | "loadsnapshot";

export interface GbMsg<T extends MsgFromGb | MsgToGb> {
  type: T;
  data?: any;
}
