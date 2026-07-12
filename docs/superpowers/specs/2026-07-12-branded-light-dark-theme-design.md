# Branded Light and Dark Theme Design

## Goal

Make the Best Day Movement Evaluation app visually match the supplied Best Day Fitness & Wellness logo. The existing theme toggle will keep its current behavior, but the light and dark palettes will become intentional brand themes rather than generic utility colors.

## Approved visual directions

The visual companion presented two directions. The selected design uses both:

- **Light theme:** full-color Best Day logo on a white header, with deep navy/blue text and orange/cyan accents.
- **Dark theme:** white Best Day logo on a deep royal-blue background, with a darker blue header surface and orange accents.

The visual companion selection was `white-logo-blue-dark`, and the user confirmed using both versions as the light and dark themes.

## UI behavior

- Replace the current text-only app heading with the Best Day logo treatment.
- Keep the assessment name, address, points, history, theme toggle, and workflow actions readable and touch-friendly.
- Preserve the existing theme toggle and persisted preference.
- Use the light logo treatment when the saved mode is light and the white logo treatment when the saved mode is dark.
- Apply the branded surface colors consistently to the assessment form, results, history, and trends shells where those views currently expose their own page background.
- Keep touch controls at or above the existing 44–48px sizing; color changes must not reduce contrast or usability.

## Palette

Use the logo colors as the source of truth, with these practical UI roles:

- Deep navy/royal blue: page and header backgrounds in dark mode; primary text and borders in light mode.
- White: dark-mode logo/header contrast and light-mode cards.
- Orange: primary action and selected-state accent.
- Bright cyan: interactive accent, progress, and links.
- Muted blue-gray: secondary text and inactive controls.

The exact token values should remain centralized in `ThemeContext.jsx`; components should continue to consume `C` tokens instead of adding one-off colors.

## Logo asset handling

Use the supplied `Artboard 3.jpg` as the source for the two treatments. The production implementation should expose only the selected logo crop for each mode, with meaningful alt text, and should avoid showing the artboard labels or unused alternate treatment inside the app header.

## Scope boundaries

In scope: theme tokens, branded header treatment, top-level view shells, responsive header sizing, logo accessibility, and visual verification at desktop and touch-sized widths.

Out of scope: assessment workflow changes, GoHighLevel behavior, scoring logic, new navigation, and a general component redesign.

## Verification

- Add or update a small test for the theme/brand mode mapping if the implementation introduces a pure helper.
- Run the existing Node test suite.
- Run the production build.
- Use the local browser to verify both modes at desktop and mobile/tablet widths, checking that the logo is fully visible and the controls remain readable.
- Confirm the working tree contains only the intended theme/header changes before publishing.
