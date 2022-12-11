import { BitPackedState } from "@mrcoolthecucumber/gameboy_web";
import React, { useRef, useState } from "react";
import GameBoyComponent, {
  GameBoyContext,
} from "../../components/gameboy/gameboy";
import RomSelector, { Game } from "../../components/gameboy/romSelector";
import styles from "../../styles/partyboy/Index.module.css";

enum RenderState {
  SelectRom,
  PlayGame,
}

const GBPage = () => {
  const [stop, setStop] = useState(false);
  const [fps, setFps] = useState(0);
  const [renderState, setRenderState] = useState<RenderState>(
    RenderState.SelectRom
  );
  const games = useRef<Game[]>([]);
  const gameRef = useRef<Game>();
  const gbRef = useRef<GameBoyContext>(null);
  const snapshot = useRef<BitPackedState>();

  const reset = () => {
    if (gameRef.current) {
      gbRef.current?.loadGame(gameRef.current);
    }
  };

  const onRomSelectedHandler = (game: Game) => {
    gameRef.current = game;
    setRenderState(RenderState.PlayGame);
  };

  const onChooseBtnClicked = () => {
    if (!stop) {
      gbRef.current?.stop();
    }
    setRenderState(RenderState.SelectRom);
  };

  const renderHelpTooltip = () => {
    return (
      <div className={`${styles.toolTip} ${styles.fps}`}>
        <b>Help &#9432;</b>
        <div className={styles.toolTipText}>
          D-Pad: WASD <br />
          A: O <br />
          B: K <br />
          M: Start <br />
          N: Select <br />
          Space: Hold for turbo
        </div>
      </div>
    );
  };

  const renderGitHubLink = () => {
    return (
      <a
        className={`${styles.fps}`}
        style={{ marginRight: "20px" }}
        href="https://github.com/MrCoolTheCucumber/partyboy"
      >
        GitHub
      </a>
    );
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
      <button className={`button ${styles.footerBtnPad}`} onClick={onClick}>
        {text}
      </button>
    );
  };

  const renderRomSelection = () => {
    return (
      <div className={styles.root}>
        <h2>Roms</h2>
        <RomSelector
          games={games.current}
          onGameSelected={onRomSelectedHandler}
          onGameAdded={(game) => games.current.push(game)}
        />
      </div>
    );
  };

  const renderGameBoyFooterCtrlRow = () => {
    const fpsPercentage = (fps / 59.73) * 100;
    return (
      <div className={styles.footerRow}>
        {renderGitHubLink()}
        <button
          className={`button ${styles.footerBtnPad}`}
          onClick={() => onChooseBtnClicked()}
        >
          Choose
        </button>
        <button
          className="button"
          onClick={() => gbRef.current?.increaseScale()}
        >
          +
        </button>
        <button
          className={`button ${styles.footerBtnPad}`}
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
          className={`button ${styles.footerBtnPad}`}
          onClick={() => {
            if (snapshot.current && gbRef.current) {
              gbRef.current?.loadSnapshot(snapshot.current);
            }
          }}
        >
          Load
        </button>
        <div className={styles.fps} style={{ width: "120px" }}>
          {`FPS: ${fps.toFixed(2)} (${fpsPercentage.toFixed(0)}%)`}
        </div>
      </div>
    );
  };

  const renderGameBoyFooter = () => {
    return (
      <div className={styles.footer}>
        <div className={styles.footerRow} style={{ fontSize: "0.8em" }}>
          D-Pad: WASD | A: O | B: K | START: M | SELECT: N | TURBO: Space (hold)
          | REWIND: Q (hold)
        </div>
        {renderGameBoyFooterCtrlRow()}
      </div>
    );
  };

  const renderGameBoy = () => (
    <div className={styles.root}>
      <GameBoyComponent
        ref={gbRef}
        gbScale={3}
        game={gameRef.current}
        onReportFps={(fps) => setFps(fps)}
      />
      {renderGameBoyFooter()}
    </div>
  );

  switch (renderState) {
    case RenderState.SelectRom:
      return renderRomSelection();
    case RenderState.PlayGame:
      return renderGameBoy();
  }
};

export default GBPage;
