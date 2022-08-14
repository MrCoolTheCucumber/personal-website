import React, { ReactElement } from "react";
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import Head from "next/head";
import { marked } from "marked";
import hljs from "highlight.js";
import Layout from "../../components/layout";
import styles from "../../styles/blog/Blog.module.css";
import "highlight.js/styles/a11y-dark.css";

interface PostHeaderProps {
  title: string;
  date: string;
}

interface PostProps {
  html: string;
  data: any;
}

interface Context {
  params: {
    slug: string;
  };
}

const dateLocaleOptions: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
  day: "numeric",
};

const PostHeader = (props: PostHeaderProps) => {
  const date = new Date(props.date).toLocaleDateString(
    undefined,
    dateLocaleOptions
  );

  return (
    <div className={styles.header}>
      <div className={styles.title}>{props.title}</div>
      <div className={styles.date}>{date}</div>
    </div>
  );
};

const PostFooter = (props: { tags: string }) => {
  const tags = props.tags.split("|").map((tag) => {
    return <span key={tag}>#{tag}</span>;
  });
  return <div className={styles.footer}>{tags}</div>;
};

const Post = (props: PostProps) => {
  return (
    <div>
      <Head>
        <title key="title">{props.data.title}</title>
        <meta name="description" content={props.data.description} />
      </Head>

      <PostHeader title={props.data.title} date={props.data.date} />
      <div
        className={styles.content}
        dangerouslySetInnerHTML={{ __html: props.html }}
      />
      <PostFooter tags={props.data.tags} />
    </div>
  );
};

Post.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};

export const getStaticPaths = async () => {
  const files = await fs.readdir("posts");
  const paths = files.map((name) => ({
    params: {
      slug: name.replace(".md", ""),
    },
  }));

  return {
    paths,
    fallback: false,
  };
};

const parseContent = (content: string): string => {
  marked.setOptions({
    renderer: new marked.Renderer(),
    highlight: function (code, lang) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
    langPrefix: "hljs language-",
  });

  return marked.parse(content);
};

export const getStaticProps = async (context: Context) => {
  const slug = context.params.slug;
  const rawContents = (
    await fs.readFile(path.join("posts", slug + ".md"))
  ).toString();
  const greyMatterFile = matter(rawContents);
  const html = parseContent(greyMatterFile.content);

  const props: PostProps = {
    html,
    data: greyMatterFile.data,
  };
  return { props };
};

export default Post;
