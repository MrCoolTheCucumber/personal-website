const useRewindHelper = () => {
  const CAPACITY = 60 * 12;
  const history: Uint8Array[] = [];

  const pushState = (state: Uint8Array) => {
    history.push(state);
    if (history.length > CAPACITY) {
      history.shift();
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
