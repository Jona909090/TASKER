# Tasker

A clean, minimal to-do app built with plain HTML, CSS, and JavaScript, bundled with Vite.

Tasks are stored in your browser (localStorage), so they persist across reloads.

## Getting started

npm install
npm run dev

Open the printed local URL in your browser.

## Build for production

npm run build

The output is generated in `dist/`. Preview it with:

npm run preview

## Deploy to GitHub Pages

1. Push this repository to GitHub.
2. Build the site: `npm run build`.
3. Publish the `dist/` folder, for example with the
   [gh-pages](https://www.npmjs.com/package/gh-pages) package:

npx gh-pages -d dist

If the site is served from a sub-path (`https://user.github.io/repo/`), set
`base` in `vite.config.js`:

export default { base: '/repo/' }

## Features

- Add, complete, and delete tasks
- Filter by All / Active / Done
- Clear all completed tasks
- Persisted in localStorage
- Responsive, keyboard-friendly UI
