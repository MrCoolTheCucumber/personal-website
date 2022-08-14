import Link from "next/link";
import React from "react";
import styles from "../styles/Navbar.module.css";

const Navbar = () => {
  return (
    <>
      <div className={styles.name}>
        <span>MrCoolTheCucumber</span>
      </div>
      <div className={styles.navbar}>
        <Link href="/">Home</Link>
        <Link href="/blog">Blog</Link>
        <Link href="/projects">Projects</Link>
        <Link href="https://github.com/MrCoolTheCucumber">GitHub</Link>
      </div>
    </>
  );
};

export default Navbar;
