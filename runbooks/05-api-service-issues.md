# 🌐 API Service Troubleshooting Runbook

## Service Details
- **Port:** 3000
- **URL:** http://localhost:3000
- **Build Context:** ./services/api
- **Traces sent to:** http://tempo:4318/v1/traces
- **Dependencies:** tempo

---

## Common Issues

### 1. API Service Not Starting

**Symptoms:**
- Container exits immediately after starting
- Cannot reach http://localhost:3000

**Diagnosis:**
```bash
# Check container status
docker compose ps api

# Check startup logs
docker compose logs api
```

**Common Causes & Resolutions:**

**Missing dependencies:**
```bash
# Rebuild the container
docker compose build api
docker compose up -d api
```

**Port already in use:**
```bash
# Check what's using port 3000
lsof -i :3000

# Kill the process or change the port
```

**Application error:**
```bash
# Check for JavaScript/Node errors
docker compose logs api | grep -i "error\|exception\|failed"
```

---

### 2. API Returns 5xx Errors

**Symptoms:**
- 500 Internal Server Error
- 502 Bad Gateway
- 503 Service Unavailable

**Diagnosis:**
```bash
# Check application logs for errors
docker compose logs --tail=50 api | grep -i error

# Check resource usage
docker stats api --no-stream

# Test API health endpoint
curl -v http://localhost:3000/health
```

**Resolution:**
```bash
# Restart the service
docker compose restart api

# If persists, check for code issues
docker compose logs api

# Check if dependencies (tempo) are running
docker compose ps tempo
```

---

### 3. API Slow Response Times

**Symptoms:**
- Requests taking > 1s to complete
- Timeout errors on client side

**Diagnosis:**
```bash
# Measure response time
time curl http://localhost:3000/health

# Check CPU/Memory usage
docker stats api --no-stream

# Check for blocking operations in logs
docker compose logs api | grep -i "slow\|timeout\|blocked"
```

**Using Tempo for diagnosis:**
1. Open Grafana: http://localhost:3001
2. Go to Explore → Select Tempo data source
3. Search for slow traces by service name "api"
4. Look for spans with high duration

**Resolution:**
```bash
# If resource constrained, increase limits in docker-compose.yml
# services:
#   api:
#     deploy:
#       resources:
#         limits:
#           cpus: '1.0'
#           memory: 512M
```

---

### 4. Cannot Connect to Worker Service

**Symptoms:**
- API logs show connection errors to worker
- Distributed operations failing

**Diagnosis:**
```bash
# Check if worker is running
docker compose ps worker

# Test connectivity from API to Worker
docker compose exec api wget -qO- http://worker:4000/health

# Check worker logs
docker compose logs worker
```

**Resolution:**
```bash
# Restart worker
docker compose restart worker

# If network issue, restart both
docker compose restart api worker
```

---

### 5. Traces Not Being Sent to Tempo

**Symptoms:**
- API is running but no traces appear in Tempo/Grafana
- OpenTelemetry export errors in logs

**Diagnosis:**
```bash
# Check OTEL environment variable
docker compose exec api env | grep OTEL

# Check for OTEL export errors
docker compose logs api | grep -i "otel\|trace\|export"

# Verify Tempo is accessible
docker compose exec api wget -qO- http://tempo:4318/v1/traces --spider
```

**Resolution:**
```bash
# Verify Tempo is running
docker compose ps tempo
docker compose restart tempo

# Restart API to reconnect
docker compose restart api
```

---

### 6. Application Crashes / OOM

**Symptoms:**
- Container exits with code 137 (OOM killed)
- Container restarts frequently

**Diagnosis:**
```bash
# Check exit code
docker compose ps api

# Check Docker events for OOM
docker events --filter 'container=api' --since 1h | grep -i oom

# Check memory usage over time
docker stats api
```

**Resolution:**
```yaml
# Add memory limits in docker-compose.yml
services:
  api:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

---

## Health Check Commands

```bash
# Quick health check
curl http://localhost:3000/health

# Verbose health check with timing
curl -v -w "\nTime: %{time_total}s\n" http://localhost:3000/health

# Check if API can reach other services
docker compose exec api ping -c 3 tempo
docker compose exec api ping -c 3 worker
```

---

## Log Analysis

```bash
# View all logs
docker compose logs api

# Follow logs in real-time
docker compose logs -f api

# Filter for errors only
docker compose logs api 2>&1 | grep -i "error\|exception\|fail"

# View last N lines
docker compose logs --tail=100 api

# Save logs to file for analysis
docker compose logs api > api_debug.log 2>&1
```

---

## Restart Procedures

### Soft Restart (Preserves state)
```bash
docker compose restart api
```

### Hard Restart (Clean restart)
```bash
docker compose stop api
docker compose rm -f api
docker compose up -d api
```

### Full Rebuild (Code changes)
```bash
docker compose build api
docker compose up -d api
```

---

## Debugging Inside Container

```bash
# Access container shell
docker compose exec api /bin/sh

# Check environment variables
docker compose exec api env

# Check running processes
docker compose exec api ps aux

# Check network configuration
docker compose exec api cat /etc/hosts
```

---

## Escalation

If issue persists after following this runbook:
1. Capture full logs: `docker compose logs api > api_debug.log`
2. Export container inspect: `docker inspect $(docker compose ps -q api) > api_inspect.json`
3. Check trace data in Tempo/Grafana
4. Escalate to senior team member with collected data

---

*Last updated: 2026-01-23*
