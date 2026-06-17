# cool-web

A Vite + React + TypeScript single-page app, configured for deployment on Netlify.

## Cursor Cloud specific instructions

This is a single web app (no backend services). The startup `update_script` runs `npm install`, so dependencies are already present when a session begins.

- Dev server: `npm run dev` (Vite, serves on port `5173`). Use `npm run dev -- --host` if you need it reachable on the VM's network interface. Hot-module reload is on by default.
- Lint: `npm run lint` (flat-config ESLint). Note: `eslint-plugin-react-hooks` v7 nests its flat config under `configs.flat['recommended-latest']` (the top-level `configs['recommended-latest']` is legacy eslintrc format and will error under flat config).
- Typecheck: `npm run typecheck` (`tsc -b`). CSS side-effect imports require `src/vite-env.d.ts` (`/// <reference types="vite/client" />`) because `noUncheckedSideEffectImports` is enabled.
- Test: `npm test` (Vitest + Testing Library, jsdom env). Global test APIs are enabled via `test.globals` in `vite.config.ts`; setup lives in `src/test/setup.ts`.
- Build: `npm run build` (runs `tsc -b` then `vite build`, output to `dist/`). This is the production build — prefer `npm run dev` while developing.

Netlify config is in `netlify.toml` (publish `dist`, SPA redirect to `/index.html`).
