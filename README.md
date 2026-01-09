# EduSmartHub - Complete School Management System

Enterprise-grade School Management System with React, TypeScript, Node.js, and AI-powered features.

## 🚀 Features

- **Complete Integration Layer** - Master orchestration connecting all components
- **AI-Powered Services** - Timetable optimization, performance prediction, attendance analysis
- **Real-Time Updates** - WebSocket-based real-time notifications and data sync
- **Workflow Automation** - Complete workflow integration across all components
- **Production Monitoring** - Comprehensive monitoring with AI-powered insights
- **Multi-Role Support** - Super Admin, School Admin, Teacher, Parent roles
- **Complete Data Flow** - Seamless data synchronization with conflict resolution

## 📦 Project Structure

```
EduSmartHub/
├── frontend/              # React + TypeScript frontend
│   ├── src/
│   │   ├── core/         # Core orchestration components
│   │   ├── integrations/ # Integration layer
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   └── lib/          # Utilities and services
│   ├── Dockerfile        # Frontend Docker configuration
│   └── nginx.conf        # Nginx configuration
├── backend/              # Node.js + TypeScript backend
│   ├── src/              # Backend source code
│   ├── ai-service/       # Python AI services
│   ├── Dockerfile        # Backend Docker configuration
│   └── docker-compose.yml
├── docker-compose.production.yml  # Production deployment
└── README.md
```

## 🛠️ Quick Start

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- Git

### Development

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
npm install
npm run dev
```

### Production Deployment

```bash
# Build and start all services
docker-compose -f docker-compose.production.yml up -d

# Or build individually
docker build -t edusmarthub-frontend -f frontend/Dockerfile frontend/
docker build -t edusmarthub-backend -f backend/Dockerfile backend/
```

## 🔗 Integration Components

### Core Orchestration
- **MasterOrchestrator** - Master service orchestrator
- **IntegrationManager** - Service initialization and health monitoring
- **DataSyncManager** - Real-time data synchronization
- **GlobalEventSystem** - Unified event bus
- **WorkflowEngine** - Workflow execution engine

### Integration Layer
- **DataFlowOrchestrator** - Seamless data flow
- **RealTimeEventBus** - Real-time event routing
- **WorkflowIntegrator** - Complete workflow integration
- **ProductionMonitorService** - Comprehensive monitoring

## 📚 Documentation

- [Complete Integration Orchestration](./COMPLETE_INTEGRATION_ORCHESTRATION.md)
- [Production Deployment Guide](./PRODUCTION_DEPLOYMENT.md)
- [Database Architecture](./DATABASE_ARCHITECTURE.md)
- [Role Connections and Routes](./ROLE_CONNECTIONS_AND_ROUTES.md)

## 🌐 Environment Variables

### Frontend
```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_SOCKET_URL=http://localhost:3001
VITE_AI_SERVICE_URL=http://localhost:5000/api/v1/ai
```

### Backend
```env
DATABASE_URL=postgresql://user:password@localhost:5432/edusmarthub
REDIS_URL=redis://localhost:6379
AI_SERVICE_URL=http://localhost:5000
```

## 🧪 Testing

```bash
# Run verification script
chmod +x verify-build.sh
./verify-build.sh
```

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines first.

## 📧 Support

For issues and questions, please open an issue on GitHub.
