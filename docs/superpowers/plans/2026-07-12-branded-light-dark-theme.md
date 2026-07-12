# Branded Light/Dark Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic light/dark styling with the approved Best Day Fitness & Wellness logo treatments and deeper blue dark theme, then publish the verified result to Railway through `master`.

**Architecture:** Keep the existing `ThemeContext.jsx` as the single source of color tokens. Add one shared `BrandHeader` that reads the current theme mode and renders the matching crop of the supplied logo artboard, then reuse it in the form, results, history, and trends views. Avoid new UI dependencies and preserve existing touch-sized controls and persisted theme preference.

**Tech Stack:** React 18, inline styles, Vite, Node test runner, existing in-app browser.

## Global Constraints

- Use the full-color logo on a white/light header and the white logo on a deep royal-blue/dark header.
- Keep exact theme values centralized in `ThemeContext.jsx`.
- Keep controls at or above the existing 44–48px touch sizing.
- Do not change assessment workflow, GoHighLevel behavior, scoring, or navigation.
- Use the supplied `Artboard 3.jpg` as the logo source without exposing its artboard labels in the app.

---

### Task 1: Add the tested brand-mode mapping

**Files:**
- Create: `src/utils/brand.js`
- Create: `tests/brand.test.mjs`

**Interfaces:**
- Produces `brandLogoVariant(mode)`, returning `'white'` for dark mode and `'full-color'` for light mode.

- [ ] **Step 1: Write the failing test**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { brandLogoVariant } from '../src/utils/brand.js'

test('uses the white logo in dark mode and full-color logo in light mode', () => {
  assert.equal(brandLogoVariant('dark'), 'white')
  assert.equal(brandLogoVariant('light'), 'full-color')
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/brand.test.mjs`

Expected: FAIL because `src/utils/brand.js` and `brandLogoVariant` do not exist yet.

- [ ] **Step 3: Write the minimal implementation**

```js
export function brandLogoVariant(mode) {
  return mode === 'dark' ? 'white' : 'full-color'
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/brand.test.mjs`

Expected: 1 test passes with 0 failures.

- [ ] **Step 5: Commit**

```bash
git add src/utils/brand.js tests/brand.test.mjs
git commit -m "Add brand theme logo mapping"
```

### Task 2: Add the shared branded header and source asset

**Files:**
- Create: `public/brand/best-day-logo-artboard.jpg`
- Create: `src/components/BrandHeader.jsx`
- Modify: `src/App.jsx`
- Modify: `src/views/Trends.jsx`

**Interfaces:**
- `BrandHeader({ subtitle, address })` renders a responsive, accessible logo header using `useTheme()` and `brandLogoVariant(mode)`.
- The logo crop uses `/brand/best-day-logo-artboard.jpg`, with the full-color crop for light mode and white crop for dark mode.

- [ ] **Step 1: Copy the supplied source asset**

Copy `C:\Users\chris\Desktop\All Folders\ESC\BEST DAY\Best Day New Logos 2026\Artboard 3.jpg` to `public/brand/best-day-logo-artboard.jpg`.

- [ ] **Step 2: Implement the shared header**

Use a semantic `<header>` with a centered responsive crop frame, meaningful `role="img"`/`aria-label`, the existing assessment subtitle/address, and the current theme colors. The crop frame must hide the artboard’s `SECONDARY LOGO` text and unused alternate logo.

- [ ] **Step 3: Replace repeated top branding**

Use `<BrandHeader subtitle="Senior Movement Assessment" address="6619 1st Ave South, St. Petersburg, FL" />` in the form, results, history, and trends shells. Remove the old text-only `BEST DAY FITNESS` heading where it duplicates the new header. Leave workflow controls and page-specific actions in their existing toolbars.

- [ ] **Step 4: Build the app**

Run: `npm run build`

Expected: Vite completes successfully and emits the new brand asset/header bundle.

### Task 3: Apply the approved light and dark palettes

**Files:**
- Modify: `src/ThemeContext.jsx`

**Interfaces:**
- Existing components continue consuming `C.bg`, `C.card`, `C.accent`, `C.accentDim`, `C.border`, `C.text`, `C.dim`, `C.muted`, `C.stickyBg`, and action tokens without one-off replacements.

- [ ] **Step 1: Update the light token values**

Use a white/light surface, deep navy text, royal-blue accents, cyan interactive states, and orange action/selection accents while preserving readable borders and muted text.

- [ ] **Step 2: Update the dark token values**

Use deep royal blue for `bg`, a darker blue for `card`/`stickyBg`, a bright cyan primary interactive accent, white text, and orange selected/action accents. Keep danger/success semantics distinct.

- [ ] **Step 3: Run the full tests**

Run: `node --test`

Expected: all existing tests plus the brand mapping test pass with 0 failures.

- [ ] **Step 4: Run the production build**

Run: `npm run build`

Expected: exit code 0 with no build errors.

### Task 4: Verify visually and publish

**Files:**
- Modify only files from Tasks 1–3.

- [ ] **Step 1: Run whitespace validation**

Run: `git diff --check`

Expected: no output and exit code 0.

- [ ] **Step 2: Verify both themes in the browser**

Open the local app at desktop and touch-sized widths. Confirm:

- light mode shows the full-color logo on white;
- dark mode shows the white logo on deep blue;
- no artboard labels appear;
- logo and subtitle remain readable on mobile;
- history, results, and trends retain usable contrast;
- theme toggle still persists after reload.

- [ ] **Step 3: Commit the implementation**

```bash
git add public/brand/best-day-logo-artboard.jpg src/components/BrandHeader.jsx src/utils/brand.js src/App.jsx src/views/Trends.jsx src/ThemeContext.jsx tests/brand.test.mjs
git commit -m "Apply Best Day branded light and dark themes"
```

- [ ] **Step 4: Push to production branch**

```bash
git push origin master
```

- [ ] **Step 5: Verify the pushed branch**

Run: `git rev-parse HEAD` and `git ls-remote origin refs/heads/master`

Expected: both hashes match. Then reload the Railway URL and verify the branded header in both modes.
