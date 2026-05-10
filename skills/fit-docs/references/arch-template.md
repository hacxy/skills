# Architecture Document Template

## Structure

```markdown
# [System Name] — Architecture Design Document

## Executive Summary
2-3 sentences: what the system does, its key architectural characteristics, and the primary design decisions made.

## System Overview

### Purpose
What problem does this system solve? Who are its users/consumers?

### Scope
What is in scope for this architecture? What external systems does it interact with?

### Key Requirements
| Requirement | Target |
|-------------|--------|
| Availability | [e.g., 99.9% uptime] |
| Throughput | [e.g., 10,000 RPS] |
| Latency | [e.g., p99 < 500ms] |
| Data retention | [e.g., 90 days] |

## Architecture Overview

### Diagram
[Include a high-level architecture diagram — C4 model context or container level recommended]

### Architectural Style
[e.g., Microservices / Monolith / Event-driven / Serverless / Layered]

Rationale: why this style fits the requirements.

## System Components

### Component: [Name]
- **Type**: Service / Database / Queue / Gateway / etc.
- **Responsibility**: What it does
- **Technology**: Chosen stack
- **Scaling**: How it scales
- **Persistence**: Data it owns

[Repeat for each major component]

## Data Architecture

### Data Stores
| Store | Type | Technology | Data Owned | Retention |
|-------|------|------------|------------|-----------|
| [DB name] | RDBMS / NoSQL / Cache | [Postgres / Redis] | [entities] | [period] |

### Data Flow
Describe how data moves through the system for key scenarios (e.g., write path, read path, event flow).

### Data Consistency Model
[e.g., Strong consistency within service, eventual consistency across services]

## Integration & APIs

### External Integrations
| System | Integration Type | Protocol | Auth Method |
|--------|-----------------|----------|-------------|
| [System A] | Inbound / Outbound | REST / gRPC / Event | API Key / OAuth |

### Internal Service Communication
[e.g., synchronous REST between A and B; async events via Kafka between B and C]

## Infrastructure & Deployment

### Deployment Environment
[Cloud provider, region strategy, on-prem components if any]

### Compute
| Service | Deployment Unit | Replicas | Resource Limits |
|---------|----------------|----------|-----------------|
| [Service A] | Kubernetes Pod | 3-10 (HPA) | 2 CPU / 4GB RAM |

### Networking
- Ingress strategy (Load balancer, API Gateway, CDN)
- Service-to-service networking (service mesh, VPC, firewall rules)
- DNS and certificate management

### CI/CD Pipeline
[Build → Test → Stage → Prod flow, deployment strategy: blue/green / canary / rolling]

## Security Architecture

### Authentication & Authorization
[Identity provider, token format, RBAC/ABAC model]

### Network Security
[TLS everywhere, network segmentation, WAF]

### Secrets Management
[How secrets are stored and rotated]

### Compliance Considerations
[Relevant standards: SOC2, GDPR, HIPAA, etc.]

## Observability

### Logging
- Log aggregation: [e.g., ELK, CloudWatch]
- Log levels and retention policy

### Metrics
- Metrics collection: [e.g., Prometheus + Grafana]
- Key dashboards: [list key dashboards]

### Tracing
- Distributed tracing: [e.g., Jaeger, OpenTelemetry]
- Trace sampling rate

### Alerting
| Alert | Condition | Severity | Response |
|-------|-----------|----------|----------|
| [High error rate] | error_rate > 1% | P1 | [on-call runbook] |

## Reliability & Resilience

### Failure Modes
| Failure | Impact | Mitigation |
|---------|--------|------------|
| [DB outage] | [write path down] | [read replica, retry, circuit breaker] |

### Disaster Recovery
- RTO (Recovery Time Objective): [e.g., < 1 hour]
- RPO (Recovery Point Objective): [e.g., < 5 minutes]
- Backup strategy and restore procedure

## Technology Decisions

| Decision | Options Considered | Chosen | Rationale |
|----------|--------------------|--------|-----------|
| [Message queue] | Kafka, RabbitMQ, SQS | Kafka | [high throughput, replay] |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| [Single point of failure in X] | Medium | High | [add redundancy] |

## Open Questions

- [ ] [Unresolved architectural question]

## Glossary

| Term | Definition |
|------|------------|
| [Term] | [Definition] |
```

## Writing Guidelines

- Architecture docs describe the system as it should be built — keep it forward-looking
- Every major decision must document alternatives considered
- Include failure modes and how the system handles them
- Diagrams are worth a thousand words — always include at least one
- Use precise numbers for NFRs, not vague terms like "fast" or "reliable"
