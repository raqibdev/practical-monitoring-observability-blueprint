# 📊 Grafana Troubleshooting Runbook

## Service Details
- **Port:** 3001 (mapped to container port 3000)
- **URL:** http://localhost:3001
- **Default Credentials:** admin / admin
- **Image:** grafana/grafana:latest

---

## Common Issues

### 1. Cannot Access Grafana Dashboard

**Symptoms:**
- Browser shows "Connection refused" or timeout
- Grafana container not responding

**Diagnosis:**
```bash
# Check if container is running
docker compose ps grafana

# Check container logs
docker compose logs --tail=50 grafana

# Check if port is listening
curl -I http://localhost:3001
```

**Resolution:**
```bash
# If container is not running
docker compose up -d grafana

# If container is unhealthy, restart it
docker compose restart grafana

# If still failing, check for port conflicts
lsof -i :3001
```

---

### 2. Login Failed / Forgot Password

**Symptoms:**
- Unable to login with admin credentials
- Password reset needed

**Resolution:**
```bash
# Reset admin password to 'admin'
docker compose exec grafana grafana-cli admin reset-admin-password admin

# Or set a new password
docker compose exec grafana grafana-cli admin reset-admin-password <new_password>
```

**Note:** Default credentials are set in docker-compose.yml:
- `GF_SECURITY_ADMIN_USER=admin`
- `GF_SECURITY_ADMIN_PASSWORD=admin`

---

### 3. Data Source Connection Failed

**Symptoms:**
- "Data source is not working" error
- No data appearing in dashboards
- Red exclamation mark on data source settings

**Diagnosis for Prometheus Data Source:**
```bash
# Test Prometheus from inside Grafana container
docker compose exec grafana wget -qO- http://prometheus:9090/-/healthy

# Check Prometheus is running
docker compose ps prometheus
docker compose logs --tail=20 prometheus
```

**Diagnosis for Tempo Data Source:**
```bash
# Test Tempo from inside Grafana container
docker compose exec grafana wget -qO- http://tempo:3200/ready

# Check Tempo is running
docker compose ps tempo
docker compose logs --tail=20 tempo
```

**Resolution:**
1. Ensure the data source URL uses the Docker service name (e.g., `http://prometheus:9090`)
2. Verify the target service is running
3. Check network connectivity between containers

---

### 4. Dashboards Not Loading / Slow

**Symptoms:**
- Dashboards take too long to load
- Panels show "loading" indefinitely
- Timeout errors

**Diagnosis:**
```bash
# Check Grafana resource usage
docker stats grafana --no-stream

# Check Grafana logs for errors
docker compose logs --tail=100 grafana | grep -i error
```

**Resolution:**
```bash
# Increase container resources (if needed, add to docker-compose.yml)
# services:
#   grafana:
#     deploy:
#       resources:
#         limits:
#           memory: 512M

# Restart Grafana
docker compose restart grafana
```

---

### 5. Dashboard Not Showing Data

**Symptoms:**
- Panels show "No data"
- Time range appears correct

**Diagnosis Checklist:**
- [ ] Is the data source configured and working?
- [ ] Is the time range correct? (Check top-right corner)
- [ ] Are the queries valid?
- [ ] Is the underlying service (Prometheus/Tempo) receiving data?

**For Prometheus metrics:**
```bash
# Check if Prometheus has the metric
curl -s "http://localhost:9090/api/v1/query?query=up" | jq
```

**For Tempo traces:**
```bash
# Check Tempo is receiving traces
curl -s http://localhost:3200/ready
```

---

### 6. Provisioned Dashboards Not Appearing

**Symptoms:**
- Custom dashboards from provisioning not visible
- Dashboard folder is empty

**Resolution:**
```bash
# Check provisioning directory in container
docker compose exec grafana ls -la /etc/grafana/provisioning/dashboards/

# Check for provisioning errors in logs
docker compose logs grafana | grep -i provision
```

---

## Configuration Reference

### Environment Variables (from docker-compose.yml)
```yaml
environment:
  - GF_SECURITY_ADMIN_USER=admin
  - GF_SECURITY_ADMIN_PASSWORD=admin
```

### Common Data Source URLs
| Service | URL (from inside Docker network) |
|---------|----------------------------------|
| Prometheus | http://prometheus:9090 |
| Tempo | http://tempo:3200 |
| Loki | http://loki:3100 |

---

## Useful Commands

```bash
# View Grafana logs in real-time
docker compose logs -f grafana

# Access Grafana container shell
docker compose exec grafana /bin/sh

# Check Grafana version
docker compose exec grafana grafana-cli --version

# List installed plugins
docker compose exec grafana grafana-cli plugins ls
```

---

## Escalation

If issue persists after following this runbook:
1. Capture full logs: `docker compose logs grafana > grafana_debug.log`
2. Check Grafana community forums or GitHub issues
3. Escalate to senior team member

---

*Last updated: 2026-01-23*
