import React, { ReactElement, useRef, useState } from "react";
import GameBoyComponent, {
  GameBoyContext,
} from "../../components/gameboy/gameboy";
import RomSelector, { Game } from "../../components/gameboy/romSelector";
import Layout from "../../components/layout";
import styles from "../../styles/partyboy/Index.module.css";

const GBPage = () => {
  const gameRef = useRef<Game>();
  const [stop, setStop] = useState(false);
  const gbRef = useRef<GameBoyContext>(null);
  const snapshot = useRef<Uint8Array>();

  const reset = () => {
    if (gameRef.current) {
      gbRef.current?.loadGame(gameRef.current);
    }
  };

  const onRomSelectedHandler = (game: Game) => {
    gameRef.current = game;
    gbRef.current?.loadGame(game);
  };

  const renderStartStopButton = () => {
    const text = stop ? "Start" : "Stop";
    const onClick = () => {
      if (!stop) {
        gbRef.current?.stop();
      } else {
        gbRef.current?.start();
      }
      setStop(!stop);
    };
    return (
      <button className="button" onClick={onClick}>
        {text}
      </button>
    );
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.controlHeader}>
        <button
          className="button"
          onClick={() => gbRef.current?.increaseScale()}
        >
          +
        </button>
        <button
          className="button"
          onClick={() => gbRef.current?.decreaseScale()}
        >
          -
        </button>
        <button className="button" onClick={() => reset()}>
          Reset
        </button>
        {renderStartStopButton()}
        <button
          className="button"
          onClick={() => {
            snapshot.current = gbRef.current?.takeSnapshot();
          }}
        >
          Take
        </button>
        <button
          className="button"
          onClick={() => {
            if (snapshot.current && gbRef.current) {
              gbRef.current?.loadSnapshot(snapshot.current);
            }
          }}
        >
          Load
        </button>
      </div>
      <GameBoyComponent ref={gbRef} gbScale={2} />
      <RomSelector onRomSelected={onRomSelectedHandler} />
    </div>
  );
};

GBPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};

export default GBPage;
