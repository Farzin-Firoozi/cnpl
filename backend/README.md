# Calculator Backend

Go microservice exposing arithmetic operations (add, subtract, multiply, divide,
power, sqrt, percentage) as a REST API, spec-first via OpenAPI 3.0.

## Setup

Requires Go 1.23+.

```bash
cd backend
go mod tidy
```

## Run

```bash
go run ./cmd/server
# listens on :8080 (override with PORT env var)
```

## Test

```bash
go test ./... -cover
```

`internal/calculator` is pure arithmetic, unit tested independently of HTTP
(100% coverage). `internal/api` tests hit the generated router end-to-end via
`httptest`.

## Regenerate server code from the OpenAPI spec

The API is spec-first: `api/openapi.yaml` is the source of truth, and
`internal/api/gen.go` (types + chi strict-server interface) is generated from
it via [oapi-codegen](https://github.com/oapi-codegen/oapi-codegen). Never
edit `gen.go` by hand.

```bash
go generate ./...
```

## API

Base path: `/api/v1`. All operations are `POST` with a JSON body, returning
`{ "result": number }` on success.

| Endpoint | Body | Notes |
|---|---|---|
| `POST /api/v1/add` | `{"a": number, "b": number}` | |
| `POST /api/v1/subtract` | `{"a": number, "b": number}` | |
| `POST /api/v1/multiply` | `{"a": number, "b": number}` | |
| `POST /api/v1/divide` | `{"a": number, "b": number}` | `422` if `b == 0` |
| `POST /api/v1/power` | `{"base": number, "exponent": number}` | |
| `POST /api/v1/sqrt` | `{"a": number}` | `422` if `a < 0` |
| `POST /api/v1/percentage` | `{"a": number, "b": number}` | a% of b |
| `GET /api/v1/healthz` | — | liveness |
| `GET /openapi.yaml` | — | raw spec |
| `GET /docs` | — | Swagger UI |

### Examples

```bash
curl -X POST localhost:8080/api/v1/add -d '{"a": 2, "b": 3}'
# {"result":5}

curl -X POST localhost:8080/api/v1/divide -d '{"a": 1, "b": 0}'
# 422 {"error":"division by zero"}

curl -X POST localhost:8080/api/v1/sqrt -d '{"a": 9}'
# {"result":3}

curl localhost:8080/api/v1/healthz
# {"status":"ok"}
```

Malformed JSON or missing required fields → `400` with `{"error": "..."}`.

## Design decisions

- **Spec-first OpenAPI**: `openapi.yaml` is authored by hand; Go types and the
  chi strict-server interface are generated from it. Spec and implementation
  can't drift, and the compiler enforces every operation is implemented
  (`StrictServerInterface`).
- **Per-operation routes over one generic `/calculate` endpoint**: REST
  resource = the operation (a noun), not a verb passed in the body. Each op
  gets its own request schema in the spec (e.g. `sqrt` takes only `a`,
  `power` uses `base`/`exponent`) instead of one shared schema with
  conditionally-required fields.
- **`float64` for numbers**: simplest choice for a calculator demo. Standard
  IEEE-754 float limitations apply (not suited for currency); out of scope
  here.
- **Domain errors as `422`, not `500`/`NaN`**: division by zero and sqrt of a
  negative number are expected, well-defined error cases, not server
  failures. They're modeled explicitly in the OpenAPI spec per-operation.
- **`internal/calculator` separated from `internal/api`**: pure arithmetic
  functions have no HTTP dependency, so they're trivially unit-testable and
  reusable (e.g. by a future CLI or gRPC frontend).
- **chi router**: thin, idiomatic wrapper over `net/http`; matches
  oapi-codegen's `chi-server` generator, no framework magic.

## Project layout

```
backend/
  api/
    openapi.yaml     # source of truth spec
    codegen.yaml      # oapi-codegen config
  cmd/server/main.go  # entrypoint: router, docs, health
  internal/
    calculator/       # pure arithmetic + unit tests
    api/
      gen.go          # generated (do not edit)
      handler.go       # StrictServerInterface implementation
      handler_test.go
```
