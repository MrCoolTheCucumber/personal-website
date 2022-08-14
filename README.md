# My Personal Website

## About

This repo is the code for my personal webiste hosted at https://mrcoolthecucumber.com via cloudflare pages. It is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app) and is exported as a static site.

## Instructions

Requirements:

- NodeJs v16+

Clone the repo and then install the dependancies with `npm i`. To run the website locally you can run `npm run dev`.

To generate the static site, run `npm run build` and then `npm run export`. This will create an `out` directory in the root of the repo. You can test out the generated site with `serve` via `npx serve out`.

### Posts

To add a new post, simply create a new markdown file in `posts/`. It must contain the nessecary meta data at the top of the file, which is parsed with the `gray-matter` library. The blog post is then generated automatically.

### Projects

To add a new project, edit the file `projects/data.json`. It contains an array of objects where each object represents a project. So just add a new object.
