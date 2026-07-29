# WP-025 dependency audit exception

Date: 2026-07-29. Review deadline: 2026-08-12. Issue: `P1-GA-019`.

## Evidence and scope

- `npm audit --omit=dev --audit-level=high` reports zero production vulnerabilities.
- The full audit reports nine high findings, all derived from advisory `1124334` (`brace-expansion` unbounded expansion length) through the ESLint/minimatch development graph.
- Direct roots `eslint`, `eslint-config-next` and `@eslint/eslintrc` are development dependencies. They do not ship in the production Next.js bundle.
- Current lint commands receive repository-controlled paths and configuration. The residual risk is CI/developer process denial of service, not a demonstrated public runtime path.

## Why no forced fix is applied

The latest supported `eslint-plugin-react`, `eslint-plugin-import` and `eslint-plugin-jsx-a11y` still depend on minimatch 3. Patched `brace-expansion@5.0.8` changes its CommonJS export from a callable function to `{ expand }`, while minimatch 3 calls the module directly. A global npm override therefore breaks the upstream contract. Upgrading Next.js 15 to 16 and ESLint 9 to 10 does not remove those plugin branches, while it also changes the runtime/build contract (`next lint` removal, Turbopack default, middleware/proxy migration). `npm audit fix --force` and incompatible overrides are rejected.

## Blocking policy

`npm run audit:deps:policy` executes both production and full audits. It fails when:

- production has any vulnerability;
- the package set, advisory source or severity differs from the reviewed graph;
- a direct ESLint root moves into production dependencies;
- the upstream graph becomes clean but the exception remains;
- the deadline passes.

The policy runs in `audit:security` and the blocking static release gate. Removal requires an upstream plugin graph on patched minimatch/brace-expansion plus `npm ci`, full audit, lint, tests and protected build evidence.
