# 🐳 Docker Compose Operations Runbook

## Overview
This runbook covers common Docker Compose operations for managing the observability stack.

---

## Quick Reference

| Action | Command |
|--------|---------|
| Start all services | `docker compose up -d` |
| Stop all services | `docker compose down` |
| Restart all services | `docker compose restart` |
| View all logs | `docker compose logs` |
| Check service status | `docker compose ps` |
| Rebuild and start | `docker compose up --build -d` |

---

## Starting Services

### Start All Services (Detached)
```bash
cd /home/raqib/cloud-devops-projects/practical-observability-blueprint
docker compose up -d
```

### Start with Build
```bash
docker compose up --build -d
```

### Start Specific Service
```bash
docker compose up -d api
docker compose up -d worker
```

### Start with Logs Visible
```bash
docker compose up
# Press Ctrl+C to stop
```

---

## Stopping Services

### Stop All Services (Preserve Data)
```bash
docker compose stop
```

### Stop and Remove Containers
```bash
docker compose down
```

### Stop and Remove Everything (Including Volumes)
```bash
# ⚠️ WARNING: This deletes all data!
docker compose down -v
```

### Stop Specific Service
```bash
docker compose stop api
docker compose stop worker
```

---

## Restarting Services

### Restart All Services
```bash
docker compose restart
```

### Restart Specific Service
```bash
docker compose restart api
docker compose restart grafana
```

### Hard Restart (Recreate Containers)
```bash
docker compose up -d --force-recreate
```

---

## Viewing Logs

### All Service Logs
```bash
docker compose logs
```

### Follow Logs in Real-Time
```bash
docker compose logs -f
```

### Logs for Specific Service
```bash
docker compose logs api
docker compose logs -f prometheus
```

### Last N Lines
```bash
docker compose logs --tail=100 api
```

### Logs with Timestamps
```bash
docker compose logs -t api
```

### Save Logs to File
```bash
docker compose logs > all_logs.txt 2>&1
docker compose logs api > api_logs.txt 2>&1
```

---

## Checking Status

### Service Status
```bash
docker compose ps
```

**Expected Output:**
```
NAME                    IMAGE                      STATUS
api                     practical-...-api          Up
worker                  practical-...-worker       Up
prometheus              prom/prometheus:latest     Up
grafana                 grafana/grafana:latest     Up
tempo                   grafana/tempo:2.4.1        Up
```

### Resource Usage
```bash
docker stats --no-stream
```

### Detailed Container Info
```bash
docker compose ps -a
```

---

## Building and Rebuilding

### Build All Services
```bash
docker compose build
```

### Build Specific Service
```bash
docker compose build api
docker compose build worker
```

### Build Without Cache
```bash
docker compose build --no-cache
```

### Build and Start
```bash
docker compose up --build -d
```

---

## Accessing Containers

### Shell Access
```bash
# For Node.js services
docker compose exec api /bin/sh
docker compose exec worker /bin/sh

# For Prometheus/Grafana
docker compose exec prometheus /bin/sh
docker compose exec grafana /bin/sh
```

### Run Command in Container
```bash
docker compose exec api env
docker compose exec prometheus promtool check config /etc/prometheus/prometheus.yml
```

---

## Cleanup Operations

### Remove Stopped Containers
```bash
docker compose rm
```

### Remove Unused Docker Resources
```bash
# Safe cleanup
docker system prune -f

# More aggressive cleanup (removes unused images too)
docker system prune -a -f
```

### Check Docker Disk Usage
```bash
docker system df
```

### Remove All Volumes (⚠️ Dangerous)
```bash
# This will delete all data!
docker volume prune -f
```

---

## Troubleshooting

### Service Won't Start
```bash
# Check what's wrong
docker compose logs <service_name>

# Try building fresh
docker compose build --no-cache <service_name>
docker compose up -d <service_name>
```

### Port Already in Use
```bash
# Find what's using the port
lsof -i :<port_number>

# Or
netstat -tlnp | grep <port_number>

# Kill the process or change port in docker-compose.yml
```

### Network Issues Between Containers
```bash
# Check network
docker network ls
docker network inspect practical-observability-blueprint_default

# Recreate network
docker compose down
docker compose up -d
```

### Disk Space Issues
```bash
# Check usage
docker system df

# Clean up
docker system prune -a -f
docker volume prune -f
```

### Container Keeps Restarting
```bash
# Check exit code
docker compose ps -a

# Check logs around restart
docker compose logs --tail=50 <service_name>

# Check events
docker events --filter 'container=<service_name>' --since 1h
```

---

## Backup and Restore

### Export Container Logs
```bash
docker compose logs > backup_logs_$(date +%Y%m%d).txt 2>&1
```

### Export Docker Compose Config
```bash
docker compose config > full_config.yml
```

### List All Volumes
```bash
docker volume ls
```

---

## Configuration Verification

### Validate docker-compose.yml
```bash
docker compose config
```

### Check Service Dependencies
```bash
docker compose config --services
```

### View Effective Configuration
```bash
docker compose config --format json | jq
```

---

## Service Endpoints Reference

| Service | URL | Purpose |
|---------|-----|---------|
| API | http://localhost:3000 | Main API service |
| Worker | http://localhost:4000 | Background worker |
| Grafana | http://localhost:3001 | Dashboards & visualization |
| Prometheus | http://localhost:9090 | Metrics & alerting |
| Tempo (OTLP) | http://localhost:4318 | Trace ingestion |
| Tempo (Query) | http://localhost:3200 | Trace queries |

---

## Emergency Procedures

### Complete Stack Reset
```bash
# Stop everything and remove all data
docker compose down -v

# Remove any orphan containers
docker compose down --remove-orphans

# Clean Docker system
docker system prune -a -f

# Start fresh
docker compose up --build -d
```

### Kill All Containers (Last Resort)
```bash
# Stop all containers on the system
docker kill $(docker ps -q)

# Remove all containers
docker rm $(docker ps -aq)

# Start fresh
docker compose up --build -d
```

---

*Last updated: 2026-01-23*
