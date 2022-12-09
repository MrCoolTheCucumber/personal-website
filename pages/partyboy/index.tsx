import React, { useEffect, useRef, useState } from "react";
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
  const snapshot = useRef<Uint8Array>();

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
        Help &#9432;
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

  const renderGameBoyFooter = () => {
    const fpsPercentage = (fps / 59.73) * 100;
    return (
      <div className={styles.footer}>
        <div className={styles.controlHeader}>
          {renderHelpTooltip()}
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
          <div className={styles.fps}>
            {`FPS: ${fps.toFixed(2)} (${fpsPercentage.toFixed(0)}%)`}
          </div>
        </div>
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
