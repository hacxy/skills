# TDD Template

## Structure

```markdown
# [Feature/System Name] — Technical Design Document

## Overview
Brief technical summary: what is being built, which systems are involved, and the high-level approach.

## Background
- Business context and requirements reference (link to PRD if exists)
- Current system state and limitations
- Why this technical approach was chosen

## Goals
- [Technical goal 1 — e.g., reduce API latency by X%]
- [Technical goal 2 — e.g., support N concurrent users]

## Non-Goals
- [What this design explicitly does NOT cover]

## System Context
Describe how this fits into the existing architecture. Include a simple diagram if helpful.

## Detailed Design

### Module / Component Breakdown
| Component | Responsibility | Owner |
|-----------|----------------|-------|
| [ComponentA] | [what it does] | [team] |

### Data Model
```sql
-- or use JSON schema, TypeScript types, etc.
CREATE TABLE example (
  id          UUID PRIMARY KEY,
  created_at  TIMESTAMP NOT NULL,
  ...
);
```

### API / Interface Design
#### Endpoint: `POST /api/example`
**Request:**
```json
{
  "field": "value"
}
```
**Response:**
```json
{
  "id": "uuid",
  "status": "ok"
}
```
**Error codes:**
| Code | Meaning |
|------|---------|
| 400 | Invalid input |
| 404 | Resource not found |

### Core Algorithms / Business Logic
Step-by-step description of non-trivial logic, state machines, or decision trees.

### Data Flow
Describe request lifecycle: client → [service A] → [service B] → [database] → response.

## Infrastructure & Deployment
- Hosting environment
- Scaling strategy (horizontal / vertical)
- Configuration / environment variables

## Security Considerations
- Authentication & authorization model
- Sensitive data handling
- Threat model (if applicable)

## Performance & Scalability
- Expected load (RPS, data volume)
- Bottlenecks identified
- Caching strategy

## Error Handling & Observability
- Error response strategy
- Logging: what events to log and at what level
- Metrics: key indicators to monitor
- Alerting thresholds

## Testing Strategy
| Test Type | Coverage Target | Tools |
|-----------|-----------------|-------|
| Unit | [e.g., >80%] | [Jest] |
| Integration | [key paths] | [Supertest] |
| E2E | [critical flows] | [Playwright] |

## Migration Plan
Steps to safely roll out this change, including rollback procedure.

## Open Questions & Decisions
| Question | Decision | Rationale | Decided By |
|----------|----------|-----------|------------|
| [question] | [decision] | [why] | [person/team] |

## Alternatives Considered
| Option | Pros | Cons | Why Rejected |
|--------|------|------|--------------|
| [Alt A] | [...] | [...] | [...] |
```

## Writing Guidelines

- Favor concrete details over abstract descriptions
- Include actual code/schema examples, not just prose
- Document the "why" behind decisions, not just the "what"
- Every design decision should be traceable to a requirement
- Identify risks and unknowns explicitly
