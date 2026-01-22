# 📈 Prometheus Troubleshooting Runbook

## Service Details
- **Port:** 9090
- **URL:** http://localhost:9090
- **Config:** ./observability/prometheus/prometheus.yml
- **Image:** prom/prometheus:latest

---

## Common Issues

### 1. Prometheus Not Starting

**Symptoms:**
- Container exits immediately
- Cannot access Prometheus UI

**Diagnosis:**
```bash
# Check container status
docker compose ps prometheus

# Check exit logs
docker compose logs prometheus
```

**Common Causes & Resolutions:**

**Config syntax error:**
```bash
# Validate Prometheus config
docker run --rm -v $(pwd)/observability/prometheus:/etc/prometheus \
  prom/prometheus:latest promtool check config /etc/prometheus/prometheus.yml
```

**Port already in use:**
```bash
# Check what's using port 9090
lsof -i :9090

# Kill the process or change the port in docker-compose.yml
```

---

### 2. Targets Not Being Scraped

**Symptoms:**
- Target shows as "DOWN" in Prometheus UI
- Metrics from specific service missing

**Diagnosis:**
```bash
# Open Prometheus targets page
# http://localhost:9090/targets

# Or via API
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {scrapePool: .scrapePool, health: .health, lastError: .lastError}'
```

**Resolution by Error Type:**

**"Connection refused":**
- Target service is not running
- Wrong port configured
```bash
# Verify the target service is running
docker compose ps

# Check if the target endpoint is accessible from Prometheus container
docker compose exec prometheus wget -qO- http://<service>:<port>/metrics
```

**"Context deadline exceeded":**
- Target is too slow to respond
- Increase scrape timeout in prometheus.yml

**"No route to host":**
- Network issue between containers
- Verify both services are on the same Docker network

---

### 3. High Memory Usage

**Symptoms:**
- Prometheus consuming excessive RAM
- OOM killed by Docker

**Diagnosis:**
```bash
# Check current memory usage
docker stats prometheus --no-stream

# Check retention and storage
curl -s http://localhost:9090/api/v1/status/tsdb | jq
```

**Resolution:**
```yaml
# Add memory limits to docker-compose.yml
services:
  prometheus:
    deploy:
      resources:
        limits:
          memory: 1G
```

```yaml
# Reduce retention (in prometheus.yml command)
command:
  - "--config.file=/etc/prometheus/prometheus.yml"
  - "--storage.tsdb.retention.time=7d"  # Keep only 7 days
  - "--storage.tsdb.retention.size=1GB" # Or limit by size
```

---

### 4. Metrics Not Appearing in Queries

**Symptoms:**
- Metric exists in target but not queryable
- "metric not found" errors

**Diagnosis:**
```bash
# Check if metric exists
curl -s "http://localhost:9090/api/v1/label/__name__/values" | jq '.data[]' | grep <metric_name>

# Query the metric directly
curl -s "http://localhost:9090/api/v1/query?query=<metric_name>" | jq
```

**Common Causes:**
- Metric hasn't been scraped yet (wait for scrape interval)
- Metric name is different than expected
- Labels are filtering it out

---

### 5. Prometheus UI Not Loading

**Symptoms:**
- Browser shows error or blank page
- API endpoints work but UI doesn't

**Resolution:**
```bash
# Force restart
docker compose restart prometheus

# Check for JavaScript console errors in browser DevTools

# Verify Prometheus is healthy
curl http://localhost:9090/-/healthy
```

---

### 6. Storage/Disk Issues

**Symptoms:**
- "no space left on device" errors
- Prometheus stops ingesting data

**Diagnosis:**
```bash
# Check disk usage
docker system df

# Check Prometheus data directory size
docker compose exec prometheus du -sh /prometheus
```

**Resolution:**
```bash
# Clean up Docker system
docker system prune -f

# Or reduce retention period (see High Memory section)

# Delete old Prometheus data (nuclear option)
docker compose down prometheus
docker volume rm practical-observability-blueprint_prometheus-data  # if using named volume
docker compose up -d prometheus
```

---

## Configuration Reference

### Sample prometheus.yml Structure
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'api'
    static_configs:
      - targets: ['api:3000']

  - job_name: 'worker'
    static_configs:
      - targets: ['worker:4000']
```

### Useful Prometheus API Endpoints
| Endpoint | Description |
|----------|-------------|
| `/api/v1/targets` | List all targets and their status |
| `/api/v1/query?query=up` | Execute instant query |
| `/api/v1/labels` | List all label names |
| `/api/v1/status/config` | Current config |
| `/api/v1/status/tsdb` | TSDB statistics |
| `/-/healthy` | Health check |
| `/-/ready` | Readiness check |
| `/-/reload` | Reload configuration |

---

## Useful Commands

```bash
# View Prometheus logs
docker compose logs -f prometheus

# Reload Prometheus config without restart
curl -X POST http://localhost:9090/-/reload

# Access Prometheus container shell
docker compose exec prometheus /bin/sh

# Validate config syntax
docker compose exec prometheus promtool check config /etc/prometheus/prometheus.yml
```

---

## Escalation

If issue persists after following this runbook:
1. Capture full logs: `docker compose logs prometheus > prometheus_debug.log`
2. Export TSDB status: `curl http://localhost:9090/api/v1/status/tsdb > tsdb_status.json`
3. Check Prometheus GitHub issues
4. Escalate to senior team member

---

*Last updated: 2026-01-23*
