import React, { useState } from "react";
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
          style={{ marginTop: "0.5rem", marginBottom: "0.5rem" }}
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

  const renderRomList = () => {
    const items = games.map((game, i) => {
      return (
        <div
          key={i}
          onClick={() => props.onRomSelected(game)}
          className={styles.romListItem}
        >
          {game.name}
        </div>
      );
    });

    return <div className={styles.romList}>{items}</div>;
  };

  return (
    <>
      {renderRomUploadBtn()}
      <div className={styles.romListWrapper}>{renderRomList()}</div>
    </>
  );
};

export default RomSelector;
