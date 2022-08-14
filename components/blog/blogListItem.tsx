import React from "react";
import styles from "../../styles/blog/BlogListItem.module.css";
import { useRouter } from "next/router";

export interface BlogListItemProps {
  title: string;
  description: string;
  date: string;
  slug: string;
}

const dateLocaleOptions: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "numeric",
  day: "numeric",
};

const BlogListItem = (props: BlogListItemProps) => {
  const router = useRouter();
  const localeDate = new Date(props.date).toLocaleDateString(
    undefined,
    dateLocaleOptions
  );

  const handleOnClick = () => {
    router.push("blog/" + props.slug);
  };

  return (
    <div className={styles.item} onClick={handleOnClick}>
      <div className={styles.header}>
        <div className={styles.title}>{props.title}</div>
        <div className={styles.date}>{localeDate}</div>
      </div>
      <div>{props.description}</div>
    </div>
  );
};

export { BlogListItem };
