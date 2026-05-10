# Evaluation Dimensions & Scoring Criteria

Each dimension is scored 1-10 (10 = best).

## 1. Readability

- Naming clarity (variables, functions, classes)
- Function/method length (recommended ≤40 lines)
- Comments where needed (complex logic, non-obvious decisions)
- File structure navigability

## 2. Robustness

- Boundary condition handling (null/undefined, empty arrays, edge values)
- Error handling (try/catch, error propagation, user-friendly messages)
- Type safety (TypeScript completeness, `any` overuse)
- Input validation at system boundaries

## 3. Maintainability

- Single Responsibility Principle adherence
- Code duplication (DRY violations)
- Module coupling (circular dependencies, tight coupling)
- Test coverage and test quality

## 4. Performance

- Algorithm complexity (obvious O(n²) scenarios)
- Unnecessary recomputation or re-renders
- Memory leak risks (uncleaned listeners, timers)
- DB/API query efficiency (N+1 problems)

## 5. Security

- SQL injection / XSS / CSRF risks
- Hardcoded secrets (keys, passwords, tokens)
- Missing authorization checks
- Dependency vulnerabilities (flag only, no deep scan)

## 6. Style Consistency

- Alignment with existing project conventions
- Formatting consistency (indentation, quotes, semicolons)
- File/directory naming conventions

## Severity Levels

| Level | Description |
|-------|-------------|
| 🔴 Critical | Affects correctness or security — must fix |
| 🟡 Warning  | Affects maintainability or performance — should fix |
| 🔵 Info     | Style or best-practice issue — optional |
