/**
 * Travelpayouts partner embed strategies:
 *
 * All current WL widgets use **inline mount + CSS containment** — script and target
 * containers live inside a page-scoped `#…-mount` div; height follows document flow.
 * Reparent observers recover nodes if a partner script attaches them to `body`.
 *
 * - `flights` — Aviasales (`#tpwl-search`, `#tpwl-tickets`); inline mount + global CSS reset stripped on inject
 * - `insurance` — Cherehapa (`#che-new_wl`)
 * - `carRental` — LocalRent (`#mrc_wl_plhcrd`)
 */

export const WHITELABEL_STRATEGY = {
  flights: "inline",
  insurance: "inline",
  carRental: "inline",
} as const;
