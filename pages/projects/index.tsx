import React, { ReactElement } from "react";
import Layout from "../../components/layout";
import fs from "fs/promises";
import ProjectCard from "../../components/projects/projectCard";

interface ProjectLink {
  name: string;
  value: string;
}

export interface Project {
  name: string;
  description: string;
  links: ProjectLink[];
  img: string;
}

interface ProjectsProps {
  projects: Project[];
}

const Projects = (props: ProjectsProps) => {
  const projectCards = props.projects.map((project) => {
    return <ProjectCard key={project.name} {...project} />;
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
      }}
    >
      {projectCards}
    </div>
  );
};

Projects.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};

export const getStaticProps = async () => {
  const projects: Project[] = JSON.parse(
    (await fs.readFile("projects/data.json")).toString()
  );

  return {
    props: {
      projects,
    },
  };
};

export default Projects;
