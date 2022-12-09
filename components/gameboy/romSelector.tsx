import React, { useEffect, useState } from "react";
import styles from "../../styles/gameboy/RomSelector.module.css";

export interface RomSelectorProps {
  onRomSelected: (game: Game) => void;
}

export type Game = {
  name: string;
  rom: Uint8Array;
};

const RomSelector = (props: RomSelectorProps) => {
  const [games, setGames] = useState<Game[]>([]);

  const fetchDemoRoms = async () => {
    const demoRoms = ["cute-demo.gbc", "pocket.gb"];
    let demoRomGames = await Promise.all(
      demoRoms.map(async (romName) => {
        let data = await (
          await fetch(`roms/${romName}`).then((res) => res.blob())
        ).arrayBuffer();

        const rom = new Uint8Array(data);
        const game: Game = {
          name: romName,
          rom,
        };

        return game;
      })
    );

    setGames([...games, ...demoRomGames]);
  };

  useEffect(() => {
    fetchDemoRoms();
  }, []);

  const onFileSelected = (event: React.FormEvent<HTMLInputElement>) => {
    const files = event.currentTarget.files;
    if (!files || files.length == 0) {
      return;
    }

    files[0].arrayBuffer().then((val) => {
      const rom = new Uint8Array(val);
      const game: Game = {
        name: files[0].name,
        rom,
      };
      setGames([...games, game]);
    });
  };

  const renderRomUploadBtn = () => {
    return (
      <div>
        <input
          type="button"
          id="romFileBtn"
          value="Add ROM"
          className="button"
          style={{
            marginTop: "0.5rem",
            marginBottom: "0.5rem",
            alignSelf: "flex-end",
          }}
          onClick={() => {
            window.document.getElementById("file")?.click();
          }}
        />
        <input
          type="file"
          style={{ display: "none" }}
          id="file"
          name="file"
          onChange={onFileSelected}
        />
      </div>
    );
  };

  const renderRomListItem = (game: Game, i: number) => {
    const playBtn = (
      <input
        type="button"
        id="playBtn"
        value="Play"
        className="button"
        onClick={() => props.onRomSelected(game)}
      />
    );

    const name = <span>{game.name}</span>;

    return (
      <div
        key={i}
        onClick={() => props.onRomSelected(game)}
        className={styles.romListItem}
      >
        {name}
        {playBtn}
      </div>
    );
  };

  const renderRomList = () => {
    const items = games.map(renderRomListItem);

    return <div className={styles.romList}>{items}</div>;
  };

  return (
    <div className={styles.romSelectorWrapper}>
      {renderRomList()}
      {renderRomUploadBtn()}
    </div>
  );
};

export default RomSelector;
