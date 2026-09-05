# Habitude 🔥

A fast, gorgeous streak tracker for your habits — built for one screen: your phone.

- **Local-first.** All data lives in your browser (`localStorage`). No account, no server, no tracking.
- **Portable.** Export your habits to a JSON file and import them on another device when you switch phones.
- **Installable.** Add it to your home screen and it behaves like a native app.

Live app: https://vidyasagar89.github.io/habitude/

## Installing on your phone

Open the live app in Safari (iPhone) or Chrome (Android), then:

- **iPhone:** tap Share → **Add to Home Screen**
- **Android:** tap the menu (⋮) → **Add to Home screen** / **Install app**

It launches full-screen with its own icon, and keeps working without a
connection — a service worker caches the app itself, so only fetching or
restoring a backup needs the network.

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
