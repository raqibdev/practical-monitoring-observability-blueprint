# 🚨 Incident Response Runbook

## Purpose
General procedures for responding to any production incident in the observability stack.

---

## Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| **SEV1** | Complete outage | Immediate | All services down, data loss |
| **SEV2** | Partial outage | < 15 min | One critical service down |
| **SEV3** | Degraded service | < 1 hour | Slow responses, intermittent errors |
| **SEV4** | Minor issue | < 4 hours | Non-critical feature broken |

---

## Initial Response (First 5 Minutes)

### Step 1: Acknowledge the Incident
```bash
# Check all service statuses
cd /home/raqib/cloud-devops-projects/practical-observability-blueprint
docker compose ps
```

**Expected output:** All services should show "Up" status.

### Step 2: Quick Health Check
```bash
# Check if services are responding
curl -s http://localhost:3000/health || echo "API is DOWN"
curl -s http://localhost:4000/health || echo "Worker is DOWN"
curl -s http://localhost:9090/-/healthy || echo "Prometheus is DOWN"
curl -s http://localhost:3001/api/health || echo "Grafana is DOWN"
curl -s http://localhost:3200/ready || echo "Tempo is DOWN"
```

### Step 3: Check Recent Logs
```bash
# View logs from all services (last 100 lines)
docker compose logs --tail=100

# Or check a specific service
docker compose logs --tail=100 api
docker compose logs --tail=100 worker
docker compose logs --tail=100 prometheus
docker compose logs --tail=100 tempo
docker compose logs --tail=100 grafana
```

---

## Diagnosis Checklist

- [ ] Which service(s) are affected?
- [ ] When did the issue start?
- [ ] Were there any recent deployments or config changes?
- [ ] Is this affecting all users or specific ones?
- [ ] Are there any error messages in the logs?
- [ ] What do the Grafana dashboards show?

---

## Common Quick Fixes

### Restart a Specific Service
```bash
docker compose restart <service_name>
# Example: docker compose restart api
```

### Restart All Services
```bash
docker compose down
docker compose up -d
```

### Force Rebuild and Restart
```bash
docker compose down
docker compose up --build -d
```

### Check Resource Usage
```bash
docker stats --no-stream
```

---

## Escalation Procedures

### When to Escalate
- Issue persists after 15 minutes of troubleshooting
- Multiple services are affected
- Data loss is suspected
- Security incident detected

### Escalation Path
1. **Level 1:** On-call engineer (you)
2. **Level 2:** Senior SRE / DevOps lead
3. **Level 3:** Platform team / Service owners

---

## Post-Incident Actions

### Immediate (Within 24 hours)
- [ ] Document the incident timeline
- [ ] Capture relevant logs and metrics
- [ ] Notify stakeholders of resolution

### Follow-up (Within 1 week)
- [ ] Conduct post-mortem meeting
- [ ] Identify root cause
- [ ] Create action items to prevent recurrence
- [ ] Update runbooks if needed

---

## Incident Documentation Template

```markdown
## Incident Report: [TITLE]

**Date:** YYYY-MM-DD
**Duration:** HH:MM - HH:MM (X hours)
**Severity:** SEV1/SEV2/SEV3/SEV4
**On-call:** [Name]

### Summary
Brief description of what happened.

### Timeline
- HH:MM - Alert received
- HH:MM - Investigation started
- HH:MM - Root cause identified
- HH:MM - Fix applied
- HH:MM - Service restored

### Root Cause
What caused the incident.

### Resolution
What was done to fix it.

### Action Items
- [ ] Action 1 (Owner, Due date)
- [ ] Action 2 (Owner, Due date)
```

---

*Last updated: 2026-01-23*
