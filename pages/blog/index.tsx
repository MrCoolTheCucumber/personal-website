import fs from "fs/promises";
import Layout from "../../components/layout";
import { ReactElement } from "react";
import path from "path";
import matter from "gray-matter";
import { BlogListItem } from "../../components/blog/blogListItem";

interface BlogData {
  title: string;
  description: string;
  date: string;
  slug: string;
}

interface BlogProps {
  blogs: BlogData[];
}

const Blog = (props: BlogProps) => {
  const blogs = props.blogs.map((blogData) => {
    return <BlogListItem key={blogData.slug} {...blogData} />;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>{blogs}</div>
  );
};

export const getStaticProps = async () => {
  const files = await fs.readdir("posts");
  const promises = files.map((fileName) => {
    return fs.readFile(path.join("posts", fileName));
  });
  const blogData = (await Promise.all(promises)).map((buffer) => {
    const content = buffer.toString();
    return matter(content).data;
  });

  return {
    props: {
      blogs: blogData,
    },
  };
};

Blog.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};

export default Blog;
