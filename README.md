# 🧮 Calculate Now, Pay Later

A full-stack calculator — a **Go** REST API and a **React + TypeScript** frontend styled after the iOS Calculator app, wired together end-to-end with a generated, type-safe API client.

| | |
|---|---|
| 🖥️ **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, TanStack Query, Jotai |
| ⚙️ **Backend** | Go, chi router, spec-first OpenAPI 3.0 (`oapi-codegen`) |
| 🔌 **API glue** | `orval` generates React Query hooks straight from the backend's live OpenAPI spec |
| 🐳 **Deployment** | Multi-stage Dockerfiles for both services + one `docker-compose.yml` |
| ✅ **Testing** | Go: `go test` (100% on core logic) · Frontend: Vitest + Testing Library + MSW (95 tests, ~94% coverage) |

---

## 🚀 Quickstart (Docker — fastest path)

Requires [Docker](https://www.docker.com/) / OrbStack running.

```bash
docker compose up -d --build
```

| Service | URL |
|---|---|
| 🖥️ Frontend | http://localhost:3000 |
| ⚙️ Backend API | http://localhost:8081/api/v1 |
| 📖 Swagger UI | http://localhost:8081/docs |
| 📄 Raw OpenAPI spec | http://localhost:8081/openapi.yaml |

The frontend container's nginx reverse-proxies `/api/*` to the backend container, so everything works out of the box with zero config.

Stop it with:

```bash
docker compose down
```

---

## 🛠️ Manual setup (without Docker)

### 1. Backend (Go 1.23+)

```bash
cd backend
go mod tidy
go run ./cmd/server
# 🟢 listening on :8080 (override with PORT env var)
```

### 2. Frontend (Node 20+, pnpm)

```bash
cd frontend
pnpm install
pnpm dev
# 🟢 http://localhost:5173 (proxies /api/* to localhost:8081 — see vite.config.ts)
```

> ⚠️ If running the backend manually (not via Docker) on port `8080`, update the proxy target in `frontend/vite.config.ts` from `8081` to `8080`, or set `VITE_API_BASE_URL` — see `frontend/.env.example`.

Full details, including regenerating the API client and keyboard shortcuts, live in [`frontend/README.md`](./frontend/README.md) and [`backend/README.md`](./backend/README.md).

---

## 📡 API examples

Base path: `/api/v1`. Every operation is a `POST` with a JSON body, returning `{ "result": number }` on success.

```bash
# ➕ Addition
curl -X POST localhost:8081/api/v1/add -d '{"a": 2, "b": 3}'
# {"result":5}

# ➗ Division by zero → 422, not a crash
curl -X POST localhost:8081/api/v1/divide -d '{"a": 1, "b": 0}'
# 422 {"error":"division by zero"}

# 🧮 Exponentiation
curl -X POST localhost:8081/api/v1/power -d '{"base": 2, "exponent": 10}'
# {"result":1024}

# √ Square root of a negative → 422
curl -X POST localhost:8081/api/v1/sqrt -d '{"a": -4}'
# 422 {"error":"cannot take square root of a negative number"}

# 💯 Percentage (a% of b)
curl -X POST localhost:8081/api/v1/percentage -d '{"a": 10, "b": 200}'
# {"result":20}

# 💓 Health check
curl localhost:8081/api/v1/healthz
# {"status":"ok"}
```

| Endpoint | Body | Notes |
|---|---|---|
| `POST /api/v1/add` | `{a, b}` | |
| `POST /api/v1/subtract` | `{a, b}` | |
| `POST /api/v1/multiply` | `{a, b}` | |
| `POST /api/v1/divide` | `{a, b}` | `422` if `b == 0` |
| `POST /api/v1/power` | `{base, exponent}` | |
| `POST /api/v1/sqrt` | `{a}` | `422` if `a < 0` |
| `POST /api/v1/percentage` | `{a, b}` | `a`% of `b` |
| `GET /api/v1/healthz` | — | liveness |
| `GET /openapi.yaml` / `GET /docs` | — | spec + Swagger UI |

Malformed JSON or a missing required field → `400 {"error": "..."}`.

---

## ✅ Testing & coverage

### Backend

```bash
cd backend
go test ./... -cover
```

`internal/calculator` (pure arithmetic) is **100% covered**; `internal/api` is tested end-to-end via `httptest` against the generated router (success + validation + `422` edge cases for every operation).

### Frontend

```bash
cd frontend
pnpm test              # run once
pnpm test:coverage      # coverage report
```

**95 tests** across the API mutator, format utilities, the `useCalculatorEngine` state machine, the keyboard binding, the history store (jotai + localStorage persistence), and full `Calculator` integration tests (button clicks *and* physical keyboard input) — **~94% statement coverage** on hand-written code (generated API client excluded from the report).

Covers: digit/decimal entry edge cases, backspace, sign toggle, operator chaining and switching, repeated `=` (real-calculator "redo last op"), `%` semantics that differ by pending operator (fraction vs. percent-of-accumulator — see design decisions below), sqrt/power chaining, `AC` vs `C` (clear vs clear-entry), backend `422` error surfacing and recovery, and history persistence/capping.

---

## 🎨 Design decisions

- **Spec-first backend, generated frontend client** — `backend/api/openapi.yaml` is hand-authored and is the single source of truth. Go types/handlers (`oapi-codegen`) *and* the frontend's React Query hooks (`orval`, pulling the spec live from a running backend via `pnpm api:download`) are both generated from it, so frontend and backend can't drift apart.
- **Per-operation REST routes**, not one generic `/calculate` endpoint — `POST /add`, `POST /divide`, etc. Each operation gets its own request schema (e.g. `sqrt` takes only `a`; `power` uses `base`/`exponent`) instead of one shared schema with conditionally-required fields. More RESTful, self-documenting, and matches how public math APIs are usually shaped.
- **Domain errors as `422`, not `500`** — division by zero and `sqrt` of a negative number are well-defined, expected error cases, modeled explicitly per-operation in the OpenAPI spec, not server failures.
- **`useCalculatorEngine` as a single state machine** — mirrors a physical calculator (accumulator / pending operator / overwrite flag). Every UI component is a thin, pure function of props; only this one hook talks to the backend, which makes the whole engine trivially unit-testable without a DOM.
- **`%` behavior matches real calculators, not naive math** — standalone, `%` is a plain fraction (`50% → 0.5`); after `+`/`−` it's "percent of the accumulator" (`200 + 10% → 220`); after `×`/`÷`/`^` it's a plain fraction again (`200 × 10% → 20`, not `4000`). This is genuinely how iOS/most physical calculators behave and is easy to get wrong.
- **Repeated `=` redoes the last operation** — `5 + 3 =` → `8`, `=` → `11`, `=` → `14`, matching physical calculators, along with `5 + =` reusing `5` as both operands.
- **`AC` vs `C`** — `AC` clears everything (display, pending op, accumulator, repeat-memory); `C` clears only the current entry, keeping an in-progress expression — the classic CE/AC distinction.
- **Fixed-height display row** — the result font shrinks for long numbers and switches to scientific notation past a threshold, but the display's own height never changes, so content updates don't reflow the keypad below (no layout shift).
- **Mobile-first layout** — the calculator fills the full viewport edge-to-edge on small screens (`h-dvh`, safe-area insets for notches/home indicator) and only becomes a centered, rounded card at `sm:` breakpoints and up.
- **No shared `.btn`-style CSS classes** — styling lives as inline Tailwind utility classes on components; variants are small TypeScript objects, not a parallel CSS file, keeping markup and style co-located.

---

## 📁 Repo structure

```
.
├── docker-compose.yml       # runs both services together
├── backend/                  # Go REST API — see backend/README.md
│   ├── api/openapi.yaml       # source-of-truth spec
│   ├── cmd/server/            # entrypoint
│   └── internal/
│       ├── calculator/         # pure arithmetic + unit tests
│       └── api/                 # generated types/routes + handlers + tests
└── frontend/                 # React app — see frontend/README.md
    └── src/
        ├── components/          # Calculator, Display, Keypad, Button, HistoryPanel
        ├── hooks/                # useCalculatorEngine, useCalculatorKeyboard
        ├── api/                  # orval-generated client + axios mutator
        └── store/                # jotai history atom
```

---

## 🤖 AI tooling

This project was built with **Claude Code**. Prompts used are shared separately per the assignment instructions.
