# Astro Starter Kit: Minimal

```sh
npm create astro@latest -- --template minimal
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## Prerequisiti

**Node 22.12.0**, la versione in `.nvmrc`:

```sh
nvm use
```

Non è un dettaglio opzionale. Cloudflare Pages legge `.nvmrc` e builda con Node 22.12 → npm 10.9.2, e il `package-lock.json` è risolto per quella versione. Con Node 25 (npm 11) `npm ci` fallisce, perché npm 11 pretende un albero di dipendenze diverso:

```
npm error `npm ci` can only install packages when your package.json
npm error and package-lock.json are in sync.
```

Per lo stesso motivo, **il lockfile non va rigenerato da zero** per far passare un errore di `npm ci`: `npm install` scrive solo i binari nativi della piattaforma su cui gira, e potando le altre si rompe il build sul runner Linux (`Cannot find module '@rolldown/binding-linux-x64-gnu'`). Le entry mancanti si aggiungono; l'albero non si ricostruisce.

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
