import React from "react";
import Navbar from "./navbar";
import Head from "./head";
import styles from "../styles/Layout.module.css";

interface LayoutProps {
  children?: JSX.Element | JSX.Element[];
}

const Layout = (props: LayoutProps) => {
  const renderInner = () => {
    return (
      <>
        <Head />
        <Navbar />
        <div className={styles.content}>{props.children}</div>
      </>
    );
  };

  return (
    <div className={styles.root}>
      <div className={styles.wrapper}>
        <div className={styles.grid}>{renderInner()}</div>
      </div>
    </div>
  );
};

export default Layout;
