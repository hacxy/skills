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

## Value Proposition
### User Value
- What pain does this eliminate or what new capability does it unlock for the user?
- How does it compare to existing alternatives (including doing nothing)?

### Business Value
- Impact on growth, retention, revenue, or operational efficiency
- Expected ROI or success indicators

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

## User Experience Design
### User Journey
Describe the full journey from trigger to outcome:
1. **Entry** — How does the user discover / arrive at this feature?
2. **Core interaction** — What does the user do, step by step?
3. **Completion** — How does the user know they succeeded? What happens next?

### Friction & Delight
- Potential friction points and how to mitigate them
- Opportunities for delight (speed, clarity, surprise, aesthetics)

### Edge Cases & Error Handling
- What happens when things go wrong? What does the user see?
- Recovery paths — can the user fix it themselves without contacting support?

## Product Closure
Verify the product loop is complete:
- [ ] Every user entry point leads to a meaningful flow
- [ ] Every action produces visible feedback (success, progress, or error)
- [ ] Error states provide recovery paths, not dead ends
- [ ] Post-completion: the user has a clear next step or satisfying endpoint
- [ ] The feature connects back to the broader product (e.g., results appear in dashboards, trigger notifications, or feed into other workflows)

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
- Always articulate the "why" behind each requirement — a requirement without a clear purpose should be questioned
- Think from the user's perspective: describe what the user experiences, not just what the system does
- Verify product closure: every flow should have a beginning, middle, and end — no dead ends
