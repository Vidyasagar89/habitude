# Habitude 🔥

A fast, gorgeous streak tracker for your habits — built for one screen: your phone.

- **Local-first.** All data lives in your browser (`localStorage`). No account, no server, no tracking.
- **Portable.** Export your habits to a JSON file and import them on another device when you switch phones.

Live app: https://vidyasagar89.github.io/habitude/

## Developing

```bash
npm install
npm run dev
```

## Building

```bash
npm run build   # type-checks + builds to dist/
npm run preview # serve the production build locally
```

## Deployment

Pushing to `main` builds the app and deploys `dist/` to GitHub Pages via
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). No manual steps required.
