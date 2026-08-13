# Calculator Frontend

React + TypeScript (Vite), Tailwind CSS v4 (utility classes only, no shared
component-class layer), TanStack Query, an Orval-generated API client pulled
from a live backend spec, Jotai for persisted calculation history, and a
physical-keyboard input layer. Styled after iOS's Calculator app.

## Setup

Requires Node 20+, pnpm.

```bash
cd frontend
pnpm install
```

## Run

Backend must be running first (see `../backend/README.md`) — either
`go run ./cmd/server` (port 8080) or via `docker compose up backend` from the
repo root (port 8081, see `vite.config.ts`'s proxy target).

```bash
pnpm dev
# http://localhost:5173 (or next free port)
```

`/api/*` requests are proxied to the backend in dev (see `vite.config.ts`).

## Regenerate the API client

The API client is **not** committed to the backend's spec file directly —
instead it's pulled live from a running backend, then generated locally:

```bash
pnpm api:download   # fetches http://localhost:8080/openapi.yaml -> src/api/config/swagger.yaml
pnpm api:generate    # orval: swagger.yaml -> src/api/functions/*.ts + src/api/models/*.ts
```

Set `VITE_API_BASE_URL` (see `.env.example`) if the backend isn't on
`localhost:8080` for the download step. Never hand-edit generated files
(`src/api/functions/`, `src/api/models/`) — re-run the scripts instead. The
generated hooks (`useAdd`, `useDivide`, `useSqrt`, ...) are wired through a
shared axios mutator (`src/api/mutator/index.ts`), which also owns runtime
error typing (`ErrorType`) and the `{ error: string }` → user-facing message
mapping (`src/api/mutator/utils/error-message.ts`).

## Component structure

```
src/
  components/
    Calculator.tsx           # orchestrator: wires the engine + keyboard hook to the UI
    CalculatorTopBar.tsx      # history toggle icon button
    CalculatorDisplay.tsx     # expression + result readout
    CalculatorKeypad.tsx      # the button grid
    CalculatorButton.tsx      # single button, variant-driven (digit/function/operator)
    HistoryPanel.tsx          # full-screen history list overlay
    icons.tsx                 # small inline SVG icons
  hooks/
    useCalculatorEngine.ts    # all calculator state + backend calls, UI-agnostic
    useCalculatorKeyboard.ts  # binds window keydown to the engine's actions
  lib/format.ts                # number formatting (thousands separators, symbols)
  store/history.ts             # jotai atoms, localStorage-persisted
  api/                          # generated client + mutator (see above)
```

Every component takes plain props and has no direct knowledge of react-query
or the API layer — all of that is isolated in `useCalculatorEngine`, which is
the only thing that talks to the generated hooks. This keeps components
trivially testable and swappable independent of the API layer.

## Keyboard support

The calculator is fully operable without a mouse:

| Key | Action |
|---|---|
| `0`-`9` | digit entry |
| `.` | decimal point |
| `+` `-` `*` `/` `^` | operator (add/subtract/multiply/divide/power) |
| `Enter` / `=` | equals |
| `Backspace` | delete last digit |
| `Escape` / `c` | clear all (`AC`) |
| `%` | percent |

## Testing

Vitest + React Testing Library, with MSW mocking the backend's exact REST
contract (`src/test/msw-handlers.ts`) so tests exercise the real request/
response flow through axios and react-query rather than stubbing hooks.

```bash
pnpm test            # run once
pnpm test:watch       # watch mode
pnpm test:coverage    # coverage report (excludes generated api/functions, api/models)
```

Covers: pure formatting functions, `CalculatorButton` variants/interaction,
`useCalculatorEngine`'s state machine (digit entry, operator chaining,
equals, percent, sqrt, power, clear vs. clear-entry, backspace, history),
error surfacing on backend 422s, and full `Calculator` integration tests
including physical-keyboard-driven flows.

## Design decisions

- **Spec pulled from a live backend, not a static file copy**: `api:download`
  fetches `/openapi.yaml` from a running backend and writes it locally before
  `orval` generates from it. Decouples the frontend repo from needing a
  filesystem path into the backend repo, and matches how you'd wire this
  against a deployed API in a polyrepo setup.
- **One mutation hook per operation**: matches the backend's per-operation
  REST routes; each button/keyboard action maps directly to a generated hook.
- **No shared `.calc-btn`-style CSS classes**: styling lives inline as
  Tailwind utility classes on components, with variants expressed as small
  TypeScript objects (`CalculatorButton`'s `VARIANT_CLASSES`) rather than a
  parallel CSS file. Keeps style and markup co-located and typo-proof.
- **`useCalculatorEngine` as the single state machine**: mirrors a physical
  calculator's accumulator/pending-operator/overwrite model. All backend
  calls and error handling live here; every UI component is a thin, pure
  function of its props.
- **Fixed-height display row**: the result font shrinks for long numbers, but
  the display's height doesn't change with it — content changes never
  reflow the keypad below (avoids layout shift).
- **Jotai + `atomWithStorage` for history**: calculation history persists
  across reloads (localStorage) without a heavier state library. History
  entries are clickable to reload a past result, like a physical calculator's
  tape.
- **`AC` vs `C`**: `AC` (bottom row) clears everything — display, pending
  operator, accumulator. `C` (top row, disabled when there's nothing to
  clear) clears only the current entry, keeping any in-progress operation —
  matching the CE/AC distinction on physical calculators.

## Build

```bash
pnpm build
```
