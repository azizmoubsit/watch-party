# AI SESSION PROMPT

Read these files before doing any implementation:
- `00-MASTER-PROMPT.md`
- `AI-STATE.md`
- `<THE FEATURE FILE I GIVE YOU>`

You are working in an existing repository. Do not assume the repository matches the specification exactly. Inspect it first.

Your task is to implement only the requested feature.

Rules:
1. Preserve existing behavior.
2. Do not rewrite unrelated files.
3. Do not introduce new dependencies unless necessary; explain every new dependency.
4. Follow the master architecture and security rules.
5. Use current official documentation for framework/library APIs when available.
6. Validate external/untrusted input.
7. Enforce authorization outside the UI.
8. Add tests for important behavior.
9. Run lint/typecheck/build and relevant tests.
10. Fix errors before finishing.
11. Update `AI-STATE.md`.
12. Do not mark a feature complete if acceptance criteria are not satisfied.

Before coding, output a short implementation checklist based on the feature.
Then inspect the codebase and implement.

At the end, report:
- what was implemented
- files changed
- dependencies added/removed
- database migrations added
- RLS/realtime changes
- tests added/run
- validation results
- known limitations
- exact next feature to implement
