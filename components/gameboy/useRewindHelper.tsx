import { BitPackedState } from "@mrcoolthecucumber/gameboy_web";
import { useRef } from "react";

const useRewindHelper = () => {
  const CAPACITY = 60 * 12;
  const history = useRef<BitPackedState[]>([]);

  const pushState = (state: BitPackedState) => {
    history.current.push(state);
    if (history.current.length > CAPACITY) {
      let state = history.current.shift();
      state?.free();
    }
  };

  const popState = () => {
    return history.current.pop();
  };

  return {
    pushState,
    popState,
  };
};

export default useRewindHelper;
