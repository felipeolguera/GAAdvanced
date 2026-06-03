# GAAdvanced

A Vite + React web app for Grand Archive players who want to search cards with natural English.

## Features

- Natural-language card search such as `fire spells that target units`.
- Rules-based parser for elements, classes, types, subtypes, and common effect phrases.
- Live card data, images, editions, and details from the public Grand Archive API at `https://api.gatcg.com`.
- Responsive card grid with click-to-open lightbox details.
- Client-side result verification so cards shown match parsed filters like Fire element, Spell subtype, and `target unit` effect text.

## Getting started

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

## Configuration

The app defaults to the public GA API. To point at a different compatible API, set:

```bash
VITE_GATCG_BASE_URL=https://api.gatcg.com
```


## GitHub Pages deployment

This repository includes a GitHub Actions workflow that builds the Vite app and publishes the `dist` folder to GitHub Pages whenever `main` is updated.

For the project URL `https://felipeolguera.github.io/GAAdvanced/`, the workflow sets `GITHUB_PAGES=true` so Vite emits asset URLs with the `/GAAdvanced/` base path.

If Pages is still configured to publish from a branch root, switch the repository Pages source to **GitHub Actions** in GitHub settings so the built app is served instead of the raw `index.html` source file.

If GitHub reports that `main` is not allowed to deploy to `github-pages`, open **Settings > Environments > github-pages > Deployment branches and tags** and allow `main`, or remove the branch restriction for that environment.
