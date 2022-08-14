import type { NextPage } from "next";
import Head from "../components/head";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "../styles/Home.module.css";

const CURSOR_CHAR = "_";

const Home: NextPage = () => {
  const [title, setTitle] = useState<string>("");
  const [cursor, setCursor] = useState(CURSOR_CHAR);
  let cursorIntervalId = useRef(-1);
  let fakeTypeSetupId = useRef(-1);
  let fakeTypeTimeoutId = useRef<number[]>([]);

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
    fakeTypeTimeoutId.current.push(timeoutId);
  };

  const cleanUp = () => {
    window.clearInterval(cursorIntervalId.current);
    window.clearTimeout(fakeTypeSetupId.current);
    fakeTypeTimeoutId.current.forEach(window.clearTimeout);
  };

  useEffect(() => {
    cursorIntervalId.current = window.setInterval(updateCursor, 500);
    fakeTypeSetupId.current = window.setTimeout(() => {
      fakeType("H", 100);
      fakeType("e", 200);
      fakeType("l", 300);
      fakeType("l", 380);
      fakeType("o", 580);
    }, 1000);

    return () => {
      cleanUp();
    };
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
