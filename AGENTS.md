# Repository Guidelines

## Project Structure & Module Organization

Boongo is an Expo/React Native app bootstrapped by `index.js` and `App.js`. Product code lives in `src/`: views in `screens/`, reusable UI in `components/`, navigation in `navigations/`, shared state in `contexts/`, API access in `services/`, and shared logic in `hooks/`, `utils/`, or `tools/`. Translations live in `src/locales/`; static media is under `assets/`. Native projects are in `ios/` and `android/`. Keep Jest tests in `__tests__/` and API references in `docs/`.

## Build, Test, and Development Commands

- `npm ci`: install the exact versions from `package-lock.json`.
- `npm start`: start the Expo development server.
- `npm run start:dev-client`: start Metro for an installed development build.
- `npm run ios` / `npm run android`: compile and run the native app locally.
- `npm run lint`: check the repository with ESLint.
- `npm test`: run the Jest suite.

Rebuild after changing native dependencies, permissions, plugins, or app configuration; a Metro refresh is not sufficient.

## Coding Style & Naming Conventions

Use JavaScript/JSX with two-space indentation, single quotes, and trailing commas where surrounding code does. Name components and screens in `PascalCase`, variables and helpers in `camelCase`, and hooks with a `use` prefix. Prefer functional components and shared theme helpers over duplicated colors or dimensions. Use `react-native-safe-area-context` for safe areas. Preserve behavior on both iOS and Android, even when a defect is reported on one platform only.

## Testing Guidelines

Name tests `*.test.js` or `*.test.tsx`. Test user-visible behavior and data transformations; mock network, storage, file pickers, and payment calls instead of contacting live services. Run a focused test with `npx jest __tests__/payment.test.js --runInBand`, then run `npm run lint` and `npm test` before opening a PR.

## Commit & Pull Request Guidelines

Follow the existing Conventional Commit style, for example `fix(cart): restore unified converted total` or `feat(media): add favorites`. Keep commits focused and use imperative subjects. PRs should explain the change, link the issue when available, list commands run, identify iOS/Android coverage, and include screenshots or recordings for UI changes. Call out modifications to `app.json`, `eas.json`, `ios/`, or `android/` explicitly.

## Security & Configuration

Never log complete API responses: they may contain tokens, password hashes, or personal data. Log only allowlisted diagnostic fields, keep secrets out of Git, and review requested mobile permissions before release builds.
