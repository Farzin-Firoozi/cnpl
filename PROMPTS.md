# 🤖 AI Prompts Used

## Tooling

- **Agent**: [Claude Code](https://claude.com/claude-code), Anthropic's CLI coding agent.
- **Model**: Claude **Sonnet 5**, medium reasoning effort.
- **Plugin**: [oh-my-claudecode (OMC)](https://github.com/oh-my-claudecode) — a multi-agent orchestration layer on top of Claude Code.

## Workflow

This wasn't single-shot "write a calculator" prompting. Every phase followed the same loop: **direct the architecture → let the agent execute → verify against a running system → iterate on real gaps**, not on guesses.

- **Spec-first, not vibes-first**: backend design was settled (per-op REST routes vs. a generic `/calculate` endpoint, `chi` vs. stdlib) *before* a line of implementation code, by asking the agent to argue trade-offs and defend a recommendation, not just generate something.
- **Nothing shipped unverified**: every backend change ran through `go test`/`go vet`/`gofmt`; every frontend change through `vitest`/`tsc`; every full-stack change was rebuilt in Docker and hit with live `curl` against the running containers, plus headless-Chrome screenshots to catch real layout bugs (a CLS regression, a broken grid row, a clipped display) that only show up at runtime, not in a diff.
- **Bugs were diagnosed from behavior, not patched from symptoms**: e.g. "percentage is not working" was traced to the actual formula (`(a/100)*b` with `b=100` is a no-op identity), then corrected to match how real calculators branch `%` behavior by pending operator (`+`/`−` vs `×`/`÷`/`^`) — not just tweaked until a number looked right.
- **Design decisions were interrogated, not accepted**: e.g. rejecting a first-pass `overwrite ? accumulator : display` ternary in `equals()` once it was shown to silently break the percent flow, in favor of a simpler invariant (`display` always holds the right operand) that the agent could prove correct instead of special-casing.
- **Test coverage was scenario-driven**, requested explicitly as "all interactions and edge cases" and delivered as a real matrix (digit entry, backspace, sign toggle, operator switching, repeated `=`, `%` per operator, sqrt/power chaining, `AC` vs `C`, error recovery, history persistence/capping) — not a token happy-path test per function.
- **Iteration was tight and specific**, not vague re-prompts: "the result changes causes CLS, make its height static" and "when I press equal it should redo the last operation, am I right?" are diagnoses, not just "fix it."

## Planning

- "Build a full-stack calculator application with a React frontend and a backend microservice..." (the assignment brief itself). First create a plan in a markdown file. I want OpenAPI generation on the backend. Backend only for now, ignore the frontend.

## Backend (Go)

- Why chi (router choice)? — Discussion, no code change.
- Only one endpoint? — Discussion of generic `/calculate` vs. per-operation routes.
- Which one is best practice? — Recommended and switched the plan to per-operation REST routes.
- "Update it" — applied the per-op routes change to the plan.
- "Implement it" — scaffolded the Go backend: `go.mod`, `oapi-codegen` config, `openapi.yaml`, `internal/calculator` (pure arithmetic + unit tests), `internal/api` (generated types/routes + handler + tests), `cmd/server/main.go`, README, Dockerfile.
- "Try it once again" — full clean rebuild/verification pass of the backend.

## Frontend scaffold

- "On the frontend add tailwind and react query + orval. Script for automatic API generation using orval and react query hooks. Then implement a glassy modern calculator."
- "Add jotai atom for history persistence of calculations. I want it to be like a real calculator."
- "Run the backend on docker, orbstack is up and running."
- "The frontend I updated the API flow, check it again, and update the use cases." (user had hand-edited the orval config/mutator to pull the OpenAPI spec live from a running backend instead of a static file copy — fixed resulting breakage: missing deps, a mutator typing bug, a wrong error-field mapping, wrong base URL default.)
- "Run it once again" — full rebuild/endpoint sweep.

## Docker

- "Make the frontend dockerized as well, create the compose too. Should it be on the root level?"
- "Run the backend on docker."
- "Optimize the Dockerfiles to be multi-stage to have smaller image size."
- "Base URL should be set for it to connect to the real backend."

## UI rebuild — component architecture, keyboard, tests

- "Remove the predefined classes from the CSS file and use inline Tailwind classes, create components and use them here. Also let the user type with keyboard to work with the calculator — operations on the keyboard (+ - / \*) should affect it too. Check the frontend as a senior project, break different parts into components. Also add tests for it. Make the design like this [iOS Calculator screenshot]."
- "Implement it" (after a plan/clarification round).
- "Try it once again" (visual/functional verification, screenshots via headless Chrome).

## Iterative refinement

- "If I press the equal button, it should do the last operation that was done — am I right about the action?" → "Apply it." (repeated-`=` behavior, like a physical calculator.)
- "Place the history button as a calculator button in the top row at the end empty place." Also mid-turn: "add a row for exponential operations," "for the body add #111 color so this calculator box is separated from the whole page," "the result changes causes CLS, make its height static," "also make it responsive to be full height and width on mobile," "when the number is long show it with an e sign in the middle," "make the clock icon bigger," "percentage is not working as expected, it should be just like other calculators," then "when user hits percent it should show the percent action," "add a C button that clears the current value in the top row."
- "Check it once again with this [full assignment brief pasted again]."
- "What are the other normal calculator behaviours for percentage?" → "Update it to be like a real calculator." (fixed `%` to behave differently after `+`/`−` vs. `×`/`÷`/`^`, matching real calculator semantics.)
- "Use cn for the classnames joining."
- "Add tests for all types of interactions that can be done with a calculator, alllll the scenarios and edge cases." (expanded to 95 tests across engine state machine, keyboard bindings, history store, and full integration flows.)

## Wrap-up / deliverables

- "Based on the description I gave you, check it once again if anything is missing, also add a README for running it with all the details, emojify it too."
- "I wanna name it 'Calculate Now, Pay Later,' also download the favicon from https://sezzle.com/ and replace it here."
- "Also, in a md file, write down the summary of the prompts that was used." (this file.)

---

Throughout, most turns also included implicit "verify it actually works" follow-through (builds, `go test`/`vitest` runs, live `curl` checks against the running Docker stack, and headless-Chrome screenshots) rather than a separate explicit prompt for each — that verification loop was part of the working process, not requested turn-by-turn.
