# Production Deployment Guide

## Overview

This guide covers the complete production deployment setup for EduSmartHub with all integrated services.

## Prerequisites

- Docker and Docker Compose installed
- NVIDIA GPU drivers (for AI services, optional)
- SSL certificates for HTTPS
- Environment variables configured

## Architecture

```
┌─────────────┐
│   Nginx     │ (Load Balancer)
└──────┬──────┘
       │
       ├─── Frontend (React)
       │
       ├─── Backend API (Node.js) ──┐
       │                            │
       ├─── AI Services (Python)    │
       │                            │
       ├─── Real-time Service       │
       │                            │
       ├─── PostgreSQL ─────────────┤
       │                            │
       └─── Redis ──────────────────┘
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://user:password@postgres:5432/edusmarthub
DB_NAME=edusmarthub
DB_USER=postgres
DB_PASSWORD=your_secure_password

# Redis
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=your_redis_password

# API URLs
API_BASE_URL=https://api.edusmarthub.in
WS_URL=wss://ws.edusmarthub.in
AI_SERVICE_URL=http://ai-services:5000
FRONTEND_URL=https://edusmarthub.in

# Frontend Environment
VITE_API_BASE_URL=https://api.edusmarthub.in
VITE_WS_URL=wss://ws.edusmarthub.in
VITE_AI_SERVICE_URL=https://ai.edusmarthub.in

# AI Services
GPU_ENABLED=true
GPU_COUNT=1

# Monitoring
GRAFANA_PASSWORD=your_grafana_password

# Security
ALLOWED_ORIGINS=https://edusmarthub.in,https://www.edusmarthub.in
SENTRY_DSN=your_sentry_dsn
```

## Deployment Steps

### 1. Build Images

```bash
docker-compose -f docker-compose.production.yml build
```

### 2. Start Services

```bash
docker-compose -f docker-compose.production.yml up -d
```

### 3. Verify Services

```bash
# Check service status
docker-compose -f docker-compose.production.yml ps

# Check logs
docker-compose -f docker-compose.production.yml logs -f

# Health check
curl http://localhost/health
```

### 4. Initialize Database

```bash
# Run migrations
docker-compose -f docker-compose.production.yml exec app npm run migrate

# Seed initial data (if needed)
docker-compose -f docker-compose.production.yml exec app npm run seed
```

## Service Configuration

### Nginx Configuration

Create `nginx/nginx.conf`:

```nginx
upstream backend {
    least_conn;
    server app:3000;
}

upstream frontend {
    server frontend:80;
}

server {
    listen 80;
    server_name edusmarthub.in;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name edusmarthub.in;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend API
    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Monitoring

### Access Grafana

- URL: `http://your-server:3001`
- Default username: `admin`
- Password: Set in `GRAFANA_PASSWORD` environment variable

### Health Checks

All services expose health check endpoints:

- Backend: `GET /health`
- AI Services: `GET /health`
- Real-time: `GET /health`

## Scaling

### Horizontal Scaling

```bash
# Scale backend services
docker-compose -f docker-compose.production.yml up -d --scale app=5
```

### Vertical Scaling

Adjust resource limits in `docker-compose.production.yml`:

```yaml
deploy:
  resources:
    limits:
      cpus: '4'
      memory: 4G
```

## Backup

### Database Backup

```bash
# Create backup
docker-compose -f docker-compose.production.yml exec postgres pg_dump -U postgres edusmarthub > backup.sql

# Restore backup
docker-compose -f docker-compose.production.yml exec -T postgres psql -U postgres edusmarthub < backup.sql
```

### Volume Backup

```bash
# Backup volumes
docker run --rm -v edusmarthub_postgres-data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz /data
```

## Security

1. **SSL/TLS**: Always use HTTPS in production
2. **Firewall**: Restrict access to necessary ports only
3. **Secrets**: Use Docker secrets or environment variable management
4. **Updates**: Regularly update base images and dependencies
5. **Monitoring**: Enable security monitoring and alerting

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose -f docker-compose.production.yml logs service-name

# Check service status
docker-compose -f docker-compose.production.yml ps
```

### Database Connection Issues

```bash
# Test database connection
docker-compose -f docker-compose.production.yml exec app npm run test:db
```

### AI Service Issues

```bash
# Check AI service health
curl http://localhost:5000/health

# Check GPU availability (if using GPU)
docker-compose -f docker-compose.production.yml exec ai-services nvidia-smi
```

## Performance Optimization

1. **Caching**: Enable Redis caching for frequently accessed data
2. **CDN**: Use CDN for static assets
3. **Compression**: Enable gzip compression in Nginx
4. **Database**: Optimize database queries and indexes
5. **Monitoring**: Monitor and optimize slow queries

## Maintenance

### Update Services

```bash
# Pull latest images
docker-compose -f docker-compose.production.yml pull

# Rebuild and restart
docker-compose -f docker-compose.production.yml up -d --build
```

### Clean Up

```bash
# Remove unused containers and images
docker system prune -a

# Remove unused volumes (careful!)
docker volume prune
```

## Support

For issues or questions:
1. Check service logs
2. Review health check endpoints
3. Consult monitoring dashboards
4. Review error logs in backend
