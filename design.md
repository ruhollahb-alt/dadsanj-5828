# Iran Delay Damages — Design

Desktop-first Iranian legal finance calculator, Persian RTL. The supplied reference guides the midnight-violet palette, narrow dividers, restrained purple glows and precise data panels; its content is not copied.

## Palette and type

- Canvas #090813, rail #0e0c1b, card #151327, inset #10101e, border #302b43.
- Text #f5f2ff, secondary #a39db5, accent #9e70ff, lavender #c8b0ff, positive #4dd3a6, warning #ffbc73.
- Vazirmatn for body and display Persian; IBM Plex Mono for numerical highlights. Self-hosted in `packages/web/public/fonts`.
- Type scale: 12px labels, 14px body, 22px card headers, 36px page heading, 40px result values. Tabular numerals with LTR isolation.

## Layout and components

- Right navigation rail (260px), top utility toolbar, content with 48px desktop gutters.
- Main 12-column workspace: calculator form (7) on right, result/audit (5) on left; stack under 1100px. Index manager uses a full-width dense table.
- Fine borders, 10px radii, 8px spacing rhythm, violet filled primary action, outlined secondary buttons, inset inputs and clear focus rings.
- Subtle violet radial haze and faint grid lines behind header. Restrained staggered entrance only; reduced-motion friendly.

## Pages and flows

- Standard: amount, Jalali start/end, ratio and itemized principal/damages/updated total.
- Partial payments: editable dated payments, chronological indexed stages, final outstanding amount and accounting identity.
- Installments: judgment, start/ruling dates, initial principal payment, fixed installment count or fixed principal amount, separately allocated damages, complete schedule.
- Cases: a compact case bar switches between independent matters; each case owns its index archive, forms, payments and result. New, rename, duplicate and delete live in the same bar, and the active case is persisted with the window.
- Index data: import/edit/export monthly user-supplied index rates as INI, yearly inflation column, coverage and missing-month guidance before calculation.
- Inputs: Jalali date picker with a Persian calendar popover, editable date text, and coverage warnings for gaps in the selected range.
- Reports: yearly damage breakdown, per-installment late damages, deterministic report fingerprint, and app/index-package versions in print and Excel output.

Desktop persists the multi-case workspace as one JSON file in Electron userData, written atomically with three rotating backups and an explicit restore action; browser preview uses local storage with the same backup policy, and legacy single-case INI files migrate into the first case. Per-case INI import/export still uses native file dialogs, and Excel on desktop uses the native save dialog and binary write. No official index is invented. Inputs and calculations are local-only, with no API or database tables. Calculation outputs are aids, not legal determinations.

## Verified index defaults
Preserve the existing visual identity. Show a compact source panel with links to the reproduced CBI letter and table, base 1395=100, coverage 1375/01–1405/07, retrieval date and a clear newer-months limitation. Table labels mean numerical agreement with reference, not certification of user-entered data. Missing-only initialization preserves custom values; an explicit non-destructive add-missing action is available. No API, automatic web synchronization or extrapolation.

## Calculation printing
Add an outlined printer action next to calculation in all three calculators; disabled until a valid current result exists. Keep the dark workspace unchanged. Print a separate white A4 Persian RTL report with plain-text inputs, Jalali dates, rial totals, formula, used monthly indices and reference-match status, itemized stages or complete installment schedule, and legal/rounding notes. Hide navigation, editable forms, actions, overlays and the platform badge only in print media. Repeat table headers on multipage reports; never clip long schedules. Browser uses its print dialog; Electron uses the native non-silent print dialog through IPC. No automatic printing or changes to indices/calculation rules.
