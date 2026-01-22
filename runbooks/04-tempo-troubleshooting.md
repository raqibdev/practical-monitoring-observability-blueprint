# 🔍 Tempo Troubleshooting Runbook

## Service Details
- **OTLP HTTP Port:** 4318 (for receiving traces)
- **Query Port:** 3200 (for Grafana/API access)
- **Config:** ./observability/tempo/tempo.yaml
- **Image:** grafana/tempo:2.4.1

---

## Common Issues

### 1. Tempo Not Starting

**Symptoms:**
- Container exits or keeps restarting
- Cannot access Tempo endpoints

**Diagnosis:**
```bash
# Check container status
docker compose ps tempo

# Check logs for errors
docker compose logs tempo
```

**Common Causes & Resolutions:**

**Config syntax error:**
```bash
# View the config file for syntax issues
cat observability/tempo/tempo.yaml

# Test config by running tempo with verbose output
docker compose logs tempo | grep -i "error\|failed\|invalid"
```

**Port conflict:**
```bash
# Check if ports 4318 or 3200 are in use
lsof -i :4318
lsof -i :3200
```

---

### 2. Traces Not Appearing

**Symptoms:**
- Services are running but no traces in Grafana
- Tempo shows no recent traces

**Diagnosis:**
```bash
# Verify Tempo is ready to receive traces
curl http://localhost:3200/ready

# Check if OTLP endpoint is accessible
curl -I http://localhost:4318/v1/traces

# Check Tempo metrics for ingestion
curl -s http://localhost:3200/metrics | grep tempo_distributor_spans_received_total
```

**Resolution Checklist:**

**Step 1: Verify service is sending traces**
```bash
# Check if API/Worker has correct OTEL endpoint
docker compose exec api env | grep OTEL
# Should show: OTEL_EXPORTER_OTLP_ENDPOINT=http://tempo:4318/v1/traces
```

**Step 2: Check for trace export errors in application logs**
```bash
docker compose logs api | grep -i "trace\|otel\|export"
docker compose logs worker | grep -i "trace\|otel\|export"
```

**Step 3: Verify network connectivity**
```bash
# From API container, test connection to Tempo
docker compose exec api wget -qO- http://tempo:4318/v1/traces --spider
```

---

### 3. 404 Error on Tempo Endpoints

**Symptoms:**
- http://localhost:3200/ returns 404
- Grafana cannot connect to Tempo

**Diagnosis:**
```bash
# Check Tempo health endpoints
curl http://localhost:3200/ready
curl http://localhost:3200/status

# Verify the config exposes the right ports
cat observability/tempo/tempo.yaml | grep -A5 "http:"
```

**Resolution:**
Tempo doesn't have a web UI at root. Use these endpoints instead:
- Health: `http://localhost:3200/ready`
- Status: `http://localhost:3200/status`
- Metrics: `http://localhost:3200/metrics`

For Grafana data source, use: `http://tempo:3200`

---

### 4. Trace Search Not Working in Grafana

**Symptoms:**
- Cannot search traces by service name or trace ID
- "No traces found" even though traces exist

**Diagnosis:**
```bash
# Test trace query API directly
curl "http://localhost:3200/api/search?serviceName=api-service&limit=10"

# Check if traces are being indexed
curl http://localhost:3200/status | jq
```

**Resolution:**
1. Verify the service name matches exactly (case-sensitive)
2. Check the time range in Grafana (traces might be outside selected window)
3. Ensure Tempo has enough time to index new traces (can take a few seconds)

---

### 5. High Memory/Storage Usage

**Symptoms:**
- Tempo consuming excessive resources
- Out of memory errors

**Diagnosis:**
```bash
# Check resource usage
docker stats tempo --no-stream

# Check storage usage
docker compose exec tempo du -sh /tmp/tempo
```

**Resolution (in tempo.yaml):**
```yaml
storage:
  trace:
    backend: local
    local:
      path: /tmp/tempo/blocks
    wal:
      path: /tmp/tempo/wal
    block:
      bloom_filter_false_positive: 0.05
    pool:
      max_workers: 50
      queue_depth: 2000
compactor:
  compaction:
    block_retention: 48h  # Reduce retention to 48 hours
```

---

### 6. Trace Correlation Issues

**Symptoms:**
- API trace doesn't link to Worker trace
- Trace context not propagating

**Diagnosis:**
```bash
# Check that trace context headers are being passed
# In application logs, look for trace ID consistency

docker compose logs api | grep "traceId"
docker compose logs worker | grep "traceId"
```

**Resolution:**
Ensure trace context is propagated in HTTP headers:
- `traceparent` header should be passed between services
- Both services must use the same trace ID format
- Check OpenTelemetry SDK configuration in both services

---

## Configuration Reference

### OTLP Endpoint Configuration
Services should send traces to:
```
OTEL_EXPORTER_OTLP_ENDPOINT=http://tempo:4318/v1/traces
```

### Grafana Tempo Data Source
```yaml
type: tempo
url: http://tempo:3200
access: proxy
```

### Key Tempo Endpoints
| Endpoint | Description |
|----------|-------------|
| `GET /ready` | Readiness probe |
| `GET /status` | Service status |
| `GET /metrics` | Prometheus metrics |
| `POST /v1/traces` | OTLP HTTP receiver |
| `GET /api/traces/{traceID}` | Get trace by ID |
| `GET /api/search` | Search traces |

---

## Useful Commands

```bash
# View Tempo logs in real-time
docker compose logs -f tempo

# Access Tempo container shell
docker compose exec tempo /bin/sh

# Check Tempo is ready
curl http://localhost:3200/ready

# Search for traces (last 1 hour)
curl "http://localhost:3200/api/search?limit=20"

# Get a specific trace by ID
curl "http://localhost:3200/api/traces/<trace-id>"

# Check ingestion metrics
curl -s http://localhost:3200/metrics | grep -E "tempo_(ingester|distributor)"
```

---

## Testing Trace Ingestion

**Send a test trace manually:**
```bash
curl -X POST http://localhost:4318/v1/traces \
  -H "Content-Type: application/json" \
  -d '{
    "resourceSpans": [{
      "resource": {
        "attributes": [{"key": "service.name", "value": {"stringValue": "test-service"}}]
      },
      "scopeSpans": [{
        "spans": [{
          "traceId": "5B8EFFF798038103D269B633813FC60C",
          "spanId": "EEE19B7EC3C1B174",
          "name": "test-span",
          "startTimeUnixNano": "1544712660000000000",
          "endTimeUnixNano": "1544712661000000000"
        }]
      }]
    }]
  }'
```

---

## Escalation

If issue persists after following this runbook:
1. Capture full logs: `docker compose logs tempo > tempo_debug.log`
2. Export metrics: `curl http://localhost:3200/metrics > tempo_metrics.txt`
3. Check Grafana Tempo GitHub issues
4. Escalate to senior team member

---

*Last updated: 2026-01-23*
