# 📚 Runbooks

This directory contains operational runbooks for the Practical Observability Blueprint stack.

## Overview

Runbooks provide step-by-step procedures for handling incidents, troubleshooting issues, and performing routine operations. They help reduce Mean Time to Recovery (MTTR) and ensure consistent incident handling.

## Directory Structure

```
runbooks/
├── README.md                          # This file
├── 01-incident-response.md            # General incident response procedures
├── 02-grafana-troubleshooting.md      # Grafana-specific issues
├── 03-prometheus-troubleshooting.md   # Prometheus-specific issues
├── 04-tempo-troubleshooting.md        # Tempo (tracing) issues
├── 05-api-service-issues.md           # API service troubleshooting
├── 06-worker-service-issues.md        # Worker service troubleshooting
└── 07-docker-compose-operations.md    # Container management operations
```

## Quick Links

| Runbook | Use When |
|---------|----------|
| [Incident Response](./01-incident-response.md) | Any production incident |
| [Grafana Troubleshooting](./02-grafana-troubleshooting.md) | Dashboard issues, login problems, data source errors |
| [Prometheus Troubleshooting](./03-prometheus-troubleshooting.md) | Metrics not appearing, scrape failures, high memory |
| [Tempo Troubleshooting](./04-tempo-troubleshooting.md) | Missing traces, trace correlation issues |
| [API Service Issues](./05-api-service-issues.md) | API errors, slow responses, connection issues |
| [Worker Service Issues](./06-worker-service-issues.md) | Worker failures, queue backlogs |
| [Docker Compose Operations](./07-docker-compose-operations.md) | Container management, restarts, logs |

## How to Use These Runbooks

1. **Identify the symptom** – What alert fired or what user reported?
2. **Find the relevant runbook** – Use the table above
3. **Follow the steps** – Execute each step in order
4. **Document deviations** – If you did something different, update the runbook
5. **Escalate if needed** – Each runbook has escalation procedures

## Contributing

When updating runbooks:
- Keep steps atomic and verifiable
- Include expected outputs
- Add troubleshooting tips for common errors
- Update the "Last Tested" date

---

*Last updated: 2026-01-23*
