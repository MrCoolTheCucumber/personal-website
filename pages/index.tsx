import type { NextPage } from "next";
import Head from "../components/head";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "../styles/Home.module.css";

const CURSOR_CHAR = "_";

const Home: NextPage = () => {
  const [title, setTitle] = useState<string>("");
  const [cursor, setCursor] = useState(CURSOR_CHAR);
  let cursorIntervalId = -1;
  let fakeTypeSetupId = -1;
  let fakeTypeTimeoutId: number[] = [];

  const updateCursor = () => {
    setCursor((cursor) => {
      return cursor === CURSOR_CHAR ? "" : CURSOR_CHAR;
    });
  };

  const fakeType = (char: string, delay: number) => {
    const timeoutId = window.setTimeout(() => {
      setTitle((prevTitle) => {
        return prevTitle + char;
      });
    }, delay);
    fakeTypeTimeoutId.push(timeoutId);
  };

  const cleanUp = () => {
    window.clearInterval(cursorIntervalId);
    window.clearTimeout(fakeTypeSetupId);
    fakeTypeTimeoutId.forEach(window.clearTimeout);
  };

  useEffect(() => {
    cursorIntervalId = window.setInterval(updateCursor, 500);
    fakeTypeSetupId = window.setTimeout(() => {
      fakeType("H", 100);
      fakeType("e", 200);
      fakeType("l", 300);
      fakeType("l", 380);
      fakeType("o", 580);
    });
  }, []);

  return (
    <div className={styles.container}>
      <Head />

      <main className={styles.main}>
        <div className={styles.hello}>
          <span>{title}</span>
          <span>{cursor}</span>
        </div>

        <div className={styles.links}>
          <Link href="/blog">Blog</Link>
          <span>|</span>
          <Link href="/projects">Projects</Link>
          <span>|</span>
          <a href="https://github.com/MrCoolTheCucumber">GitHub</a>
        </div>
      </main>
    </div>
  );
};

export default Home;
