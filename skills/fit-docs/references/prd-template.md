# PRD Template

## Structure

```markdown
# [Feature/Product Name] — Product Requirements Document

## Overview
One-paragraph summary: what this feature is, who it's for, and why it matters.

## Background & Problem Statement
- Current pain point or opportunity
- Evidence / data supporting the need
- What happens if we don't build this

## Goals & Non-Goals
**Goals:**
- [Measurable goal 1]
- [Measurable goal 2]

**Non-Goals:**
- [Explicitly out of scope item 1]

## User Stories
| As a... | I want to... | So that... |
|---------|-------------|------------|
| [persona] | [action] | [outcome] |

## Functional Requirements
### [Feature Area 1]
- FR-01: [Requirement description]
- FR-02: [Requirement description]

### [Feature Area 2]
- FR-03: [Requirement description]

## Non-Functional Requirements
- Performance: [e.g., p99 latency < 200ms]
- Reliability: [e.g., 99.9% uptime]
- Security: [e.g., data encrypted at rest]
- Accessibility: [e.g., WCAG 2.1 AA]

## User Flow
Describe or diagram the step-by-step user journey.

## Acceptance Criteria
| ID | Criterion | Priority |
|----|-----------|----------|
| AC-01 | [Testable criterion] | Must Have |
| AC-02 | [Testable criterion] | Should Have |

## Dependencies & Risks
| Item | Type | Mitigation |
|------|------|------------|
| [dependency] | External / Internal | [plan] |
| [risk] | Risk | [mitigation] |

## Timeline & Milestones
| Milestone | Target Date | Owner |
|-----------|-------------|-------|
| [milestone] | [date] | [team] |

## Open Questions
- [ ] [Unresolved question 1]
```

## Writing Guidelines

- Be specific: avoid vague terms like "fast", "easy", "user-friendly" — quantify everything
- Every requirement should be testable
- Distinguish Must Have / Should Have / Nice to Have
- Include negative cases (what the system must NOT do)
- Link to related docs, designs, or tickets when relevant
