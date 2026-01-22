# ⚙️ Worker Service Troubleshooting Runbook

## Service Details
- **Port:** 4000
- **URL:** http://localhost:4000
- **Build Context:** ./services/worker
- **Traces sent to:** http://tempo:4318/v1/traces
- **Dependencies:** tempo

---

## Common Issues

### 1. Worker Service Not Starting

**Symptoms:**
- Container exits immediately
- Cannot reach http://localhost:4000

**Diagnosis:**
```bash
# Check container status
docker compose ps worker

# Check startup logs
docker compose logs worker
```

**Common Causes & Resolutions:**

**Missing dependencies:**
```bash
# Rebuild the container
docker compose build worker
docker compose up -d worker
```

**Port conflict:**
```bash
# Check what's using port 4000
lsof -i :4000
```

**Application error:**
```bash
# Check for specific errors
docker compose logs worker | grep -i "error\|exception\|failed"
```

---

### 2. Worker Not Processing Jobs

**Symptoms:**
- Jobs are queued but not being processed
- API requests that trigger worker jobs timeout

**Diagnosis:**
```bash
# Check if worker is healthy
curl http://localhost:4000/health

# Check worker logs for processing activity
docker compose logs --tail=100 worker

# Check if worker is connected to required services
docker compose exec worker wget -qO- http://tempo:4318/v1/traces --spider
```

**Resolution:**
```bash
# Restart worker to reconnect
docker compose restart worker

# If still not processing, check job queue configuration
# Look for queue connection errors in logs
```

---

### 3. Worker High CPU/Memory Usage

**Symptoms:**
- Worker consuming excessive resources
- Host system becoming slow
- OOM kills

**Diagnosis:**
```bash
# Check current resource usage
docker stats worker --no-stream

# Check for memory leaks in logs
docker compose logs worker | grep -i "memory\|heap\|gc"

# Monitor over time
watch -n 5 docker stats worker --no-stream
```

**Resolution:**
```yaml
# Add resource limits in docker-compose.yml
services:
  worker:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
```

```bash
# Restart to apply limits
docker compose up -d worker
```

---

### 4. Worker Cannot Connect to API

**Symptoms:**
- Worker logs show connection errors to API
- Cross-service operations failing

**Diagnosis:**
```bash
# Test connectivity from worker to API
docker compose exec worker wget -qO- http://api:3000/health

# Check DNS resolution
docker compose exec worker nslookup api

# Check API is running
docker compose ps api
```

**Resolution:**
```bash
# Restart both services
docker compose restart api worker

# If network issue persists
docker compose down
docker compose up -d
```

---

### 5. Trace Correlation Issues

**Symptoms:**
- Worker traces don't link to API traces
- Can't follow request flow in Grafana

**Diagnosis:**
```bash
# Check if worker receives trace context
docker compose logs worker | grep -i "traceId\|trace-id\|traceparent"

# Verify OTEL configuration
docker compose exec worker env | grep OTEL
```

**Resolution:**
1. Ensure trace context headers are passed from API to Worker
2. Verify both services use the same trace ID format
3. Check OpenTelemetry instrumentation in worker code

---

### 6. Job Processing Errors

**Symptoms:**
- Jobs fail with errors
- Dead letter queue filling up
- Retry loops

**Diagnosis:**
```bash
# Look for job-related errors
docker compose logs worker | grep -i "job\|task\|process" | grep -i "error\|fail"

# Check for specific error patterns
docker compose logs worker | tail -200
```

**Resolution:**
- If transient error: Retry the job
- If persistent error: Check job data and handler code
- If queue issues: Check queue service connectivity

---

## Health Check Commands

```bash
# Quick health check
curl http://localhost:4000/health

# Verbose health check with timing
curl -v -w "\nTime: %{time_total}s\n" http://localhost:4000/health

# Check worker can reach other services
docker compose exec worker ping -c 3 api
docker compose exec worker ping -c 3 tempo
```

---

## Monitoring Worker via Observability Stack

### Using Prometheus Metrics
```bash
# Check if worker exposes metrics
curl http://localhost:4000/metrics

# Query job metrics in Prometheus
# http://localhost:9090/graph
# Query: worker_jobs_processed_total
```

### Using Tempo Traces
1. Open Grafana: http://localhost:3001
2. Go to Explore → Tempo
3. Search by service name "worker"
4. Look for:
   - Job processing spans
   - Error spans (red)
   - Long duration spans

---

## Log Analysis

```bash
# View all logs
docker compose logs worker

# Follow logs in real-time
docker compose logs -f worker

# Filter for job processing events
docker compose logs worker | grep -i "job\|process\|complete"

# Filter for errors only
docker compose logs worker 2>&1 | grep -i "error\|exception\|fail"

# Save logs to file for analysis
docker compose logs worker > worker_debug.log 2>&1
```

---

## Restart Procedures

### Graceful Restart (Completes current job)
```bash
# If worker supports graceful shutdown
docker compose stop worker --timeout 30
docker compose up -d worker
```

### Standard Restart
```bash
docker compose restart worker
```

### Full Rebuild
```bash
docker compose build worker
docker compose up -d worker
```

---

## Debugging Inside Container

```bash
# Access container shell
docker compose exec worker /bin/sh

# Check environment variables
docker compose exec worker env

# Check running processes
docker compose exec worker ps aux

# Check network configuration
docker compose exec worker cat /etc/hosts

# Check disk usage
docker compose exec worker df -h
```

---

## Scaling Workers

If you need more worker capacity:

```bash
# Scale to 3 worker instances
docker compose up -d --scale worker=3

# Note: This requires port mapping changes
# Each worker needs a unique port or use internal networking only
```

**For scaling, update docker-compose.yml:**
```yaml
services:
  worker:
    # Remove fixed port mapping for scaling
    # ports:
    #   - "4000:4000"  # Comment this out
    expose:
      - "4000"  # Use expose instead
```

---

## Escalation

If issue persists after following this runbook:
1. Capture full logs: `docker compose logs worker > worker_debug.log`
2. Check traces in Tempo/Grafana for error patterns
3. Review recent code changes to worker service
4. Escalate to senior team member with collected data

---

*Last updated: 2026-01-23*
