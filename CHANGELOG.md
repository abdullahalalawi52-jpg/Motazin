# Changelog

All notable changes to the **Motazin (مُتّزِن)** Balance Sheet Calculator will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] - 2026-06-27

### Added
- **Internationalization (i18n) JSON Structure:** Split the translation engine. Extracted all localization data into 10 separate JSON dictionaries under `src/locales/` for simplified maintenance and reduced bundle size.
- **Translation Completeness:** Fully localized all 247+ strings for Japanese (`ja`), Chinese Simplified (`zh`), Russian (`ru`), and Portuguese (`pt`), eliminating fallback duplicates.
- **Extended Integration Tests:** Added 4 new integration tests covering Routing Link Navigation, Language Toggling, Theme Toggling, and Undo/Redo operations.
- **PWA Asset Generation:** Created a Node.js generation script using `sharp` to compile vector SVG assets into:
  - 180x180 standard size icon (`apple-touch-icon.png` / `pwa-180x180.png`) for iOS devices.
  - 512x512 custom padded icon (`pwa-maskable.png`) centering the logo inside the PWA safe-zone.
- **Accessibility & Testability Labels:** Added `aria-label` attributes to theme toggle, Undo, and Redo buttons.
- **Documentation Overhaul:** Created professional project standards files: `LICENSE` (MIT), `CONTRIBUTING.md`, and this `CHANGELOG.md`.

### Changed
- **React Router Direct Navigation:** Replaced state-based intermediate navigation (`setCurrentView`) with native `<Link>` and `<NavLink>` tags across Desktop Header, Mobile Drawer Menu, and Bottom Mobile Bar.
- **Localized Error Boundary:** Localized `ErrorBoundary.tsx` to dynamically render Arabic (RTL) or English (LTR) error descriptions based on user settings.
- **Performance Optimization (Memoization):** Wrapped `AboutUsView`, `MotazinLogo`, `ContactUsView`, `DocPreviewModal`, and `ConfirmationModal` in `React.memo` to eliminate redundant rendering cycles.
- **Optimized Fonts Import:** Reduced loaded Google Font weights for both Inter and Tajawal to 4 major variants (400, 500, 700, 900), improving initial page loading speeds.

### Fixed
- **Infinite Loop Protection:** Hardened the recurring transactions calculation logic in `App.tsx` by adding a maximum limit of 100 iterations per check and a date progression verification check.
- **Hardcoded Language Warnings:** Replaced direct `language === 'ar'` checks in `addCustomAccount` with standard `t('accountExists')` and `t('accountAdded')` translations.
- **Type Safety Enhancements:** Replaced `any` with `ParsedRow[]` and `Transaction[]` inside `SnapshotsModal.tsx`, `PdfScanner.tsx`, and `App.tsx`.

---

## [1.1.0] - 2026-06-26

### Added
- **Declarative Router Navigation:** Integrated `react-router-dom` to replace state-based view flags with route paths (`/`, `/equation`, `/income`, `/cashflow`, `/about`, `/contact`).
- **Glassmorphic Confirmation Modal:** Created a custom reusable popup dialog replacing insecure browser default `confirm()` and `alert()` calls.
- **Secure ID Generation:** Replaced `Math.random()` with `crypto.randomUUID()` to generate collision-free unique IDs for transactions.

### Changed
- **Modular Component Refactoring:** Split the monolithic `App.tsx` (~3,882 lines) into 13 dedicated modular sub-components.
- **Hardened Security Headers:** Cleaned up CORS wildcards and configured strict CSP headers in `vercel.json` and `index.html`.

### Fixed
- **Floating Point Precision:** Resolved decimal precision issues in double-entry totals calculations.
