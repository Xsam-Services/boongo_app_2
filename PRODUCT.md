# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

Two equal audiences, both in the app:
- **Readers and learners** (students, researchers, general public) who discover and consume works: books, journals/magazines, maps, documents, audio and video.
- **Publishers and institutions** (authors, educational/academic establishments, government ministries and agencies) who register, publish works, share programs/events/official updates, and engage subscribers or citizens.

Context inferred from the repo: DR Congo / Francophone Africa, UI in French, English and Lingala; mobile-money and bank-card subscription flows. Not yet confirmed by the user.

## Product Purpose

Boongo ("the knowledge guide") is a mobile hub for knowledge: people find and read/listen/watch works, take notes, search, chat and follow organizations, while publishers and institutions digitize and distribute their content and talk to their audience. Success is readers finding trustworthy local knowledge easily, and publishers and institutions reaching them.

## Positioning

A local knowledge hub: Congolese/African works, institutions and government information in one place, in French, English and Lingala, with local payment (mobile money). A generic global e-reader or library could not truthfully claim this.

## Operating Context

- Usage is on phones, often with variable connectivity (app uses NetInfo and offline-capable storage via SQLite).
- Content types: documents/PDF, audio, images, video, external videos, maps, a dictionary.
- Organization types: publishers (works), educational establishments, government institutions.
- Account flows: email/phone OTP registration, subscriptions (mobile money, bank card), notifications, likes, comments, chat and chat circles, per-document notes.

## Capabilities and Constraints

- Expo / React Native app (JS/JSX), iOS and Android, portrait only, automatic light/dark.
- Three locales: `en`, `fr`, `ln` (Lingala) in `src/locales/`; copy must exist in all three.
- Both platforms must keep working even when a defect is reported on one (see AGENTS.md).
- Never log full API responses (tokens, personal data).
- Undecided: whether to adopt platform-native navigation patterns versus the current shared drawer/custom tab bar.

## Brand Commitments

- Name: Boongo. Slogan: "The knowledge guide!"
- Publisher company: Reborn.
- Existing icon at `assets/icon.png`; existing theme via `src/contexts/ThemeContext.js` and `src/hooks/useColors.js`.

## Evidence on Hand

- Real locale strings in `src/locales/`, API collection in `docs/Boongo.postman_collection.json`, existing screens and store screenshots in `../boongo-screenshot/`.
- No testimonials, usage numbers, or customer logos exist in the repo; do not fabricate them.

## Product Principles

1. Knowledge first: content is the hero, chrome recedes.
2. Local and multilingual by default: French, English and Lingala are equal citizens.
3. Serve both sides: every flow works for the reader and the publisher/institution without one feeling secondary.
4. Resilient on real networks: assume slow or intermittent connectivity and modest devices.
5. Trustworthy with money and identity: subscriptions, payments and accounts are clear and unsurprising.

## Accessibility & Inclusion

Multilingual readership including Lingala; support system dark mode and dynamic text. No further product-specific standard established.
