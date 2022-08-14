import React from "react";
import { Project } from "../../pages/projects/index";
import Image from "next/image";
import styles from "../../styles/projects/ProjectCard.module.css";

const ProjectCard = (props: Project) => {
  const links = props.links.map((link) => {
    return (
      <a key={link.name} href={link.value} className={styles.cardButton}>
        <span>{link.name}</span>
      </a>
    );
  });

  return (
    <div className={styles.card}>
      <div className={styles.detailsWrapper}>
        <div className={styles.titleRowWrapper}>
          <div className={styles.title}>{props.name}</div>
          {links}
        </div>

        <div>{props.description}</div>
      </div>

      <div className={styles.imgWrapper}>
        <img className={styles.img} src={props.img} />
      </div>
    </div>
  );
};

export default ProjectCard;
