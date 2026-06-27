# Contributing to Motazin

First off, thank you for considering contributing to Motazin! It is people like you who make this a smart and reliable tool for everyone.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:
- Be respectful and professional.
- Focus on constructive feedback and collaboration.
- Ensure type safety, security, and performance standards are met in all contributions.

## How Can I Contribute?

### 1. Reporting Bugs

Before submitting a bug report, please check the existing issues or the `CHANGELOG.md` to see if it has already been addressed.
When reporting a bug, please include:
- A clear description of the issue.
- Steps to reproduce the behavior.
- Expected vs. actual results.
- Environment details (browser version, OS, etc.).

### 2. Suggesting Enhancements

If you have ideas for new features or UX improvements:
- Describe the problem you want to solve.
- Explain the proposed solution and how it benefits users.
- Provide mockups or screenshots if applicable.

### 3. Submitting Code Changes

We follow a structured workflow for code contributions:

1. **Fork and Clone:**
   Fork the repository and clone it locally.
2. **Branching Strategy:**
   Create a feature branch from the `main` branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Local Setup:**
   Install dependencies and run the development server:
   ```bash
   npm install
   # Generate PWA assets
   node scratch/generate_pwa_icons.cjs
   # Run local dev
   npm run dev
   ```
4. **Code Quality Standards:**
   - Keep files modular. Extract large components out of `App.tsx` and place them in `src/components/`.
   - Maintain strict type safety. Avoid using `any` and define proper TypeScript interfaces in `src/types/`.
   - Keep translation keys updated in all 10 language JSON files under `src/locales/`.
   - Provide JSDoc/TSDoc comments for any new public utility functions.
   - Wrap non-dynamic components in `React.memo` to optimize performance.
5. **Testing Changes:**
   Ensure all tests pass and write new tests for your features:
   ```bash
   npm run test
   ```
6. **Production Build Check:**
   Verify that the production build completes successfully:
   ```bash
   npm run build
   ```
7. **Commit Guidelines:**
   Use clear and descriptive commit messages (e.g., `feat: integrate router link navigation`).
8. **Pull Requests:**
   Submit a PR against the `main` branch. Provide a detailed description of the changes, verification results, and any relevant screenshots.

Thank you for helping us keep Motazin robust and balanced!
