import { BitPackedState } from "@mrcoolthecucumber/gameboy_web";

const useRewindHelper = () => {
  const CAPACITY = 60 * 12;
  const history: BitPackedState[] = [];

  const pushState = (state: BitPackedState) => {
    history.push(state);
    if (history.length > CAPACITY) {
      let state = history.shift();
      state?.free();
    }
  };

  const popState = () => {
    return history.pop();
  };

  return {
    pushState,
    popState,
  };
};

export default useRewindHelper;
