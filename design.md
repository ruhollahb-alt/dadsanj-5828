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
- Index data: import/edit/export monthly user-supplied index rates as INI, coverage and missing-data guidance.

Desktop automatically persists a single INI file in Electron userData; import/export uses native file dialogs. Browser preview uses local storage and downloadable INI as a fallback. No official index is invented. Inputs and calculations are local-only, with no API or database tables. Calculation outputs are aids, not legal determinations.
