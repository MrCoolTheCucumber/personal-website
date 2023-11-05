import "../styles/globals.css";
import type { ReactElement, ReactNode } from "react";
import type { NextPage } from "next";
import type { AppProps } from "next/app";
import dynamic from "next/dynamic";

export type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? ((page) => page);
  return getLayout(<Component {...pageProps} />);
}

// https://github.com/vercel/next.js/issues/30170#issuecomment-1286250406
// TODO: Disable server side rendering for the required component only
export default dynamic(() => Promise.resolve(MyApp), {
  ssr: false,
});
