# EduSmartHub Backend

Enterprise-grade School Management System Backend with Microservices Architecture.

## Architecture

The backend is built using a microservices architecture with the following services:

1. **Authentication Service** - JWT, RBAC, MFA, OAuth, SSO
2. **User Management Service** - User CRUD, bulk operations
3. **School Management Service** - Multi-tenant school management
4. **Attendance Service** - Real-time attendance tracking
5. **Academics Service** - Gradebook and assessments
6. **Communication Service** - Messaging and announcements
7. **Analytics Service** - Data aggregation and reporting
8. **File Management Service** - S3 file uploads
9. **Payment Service** - Multi-gateway payment processing

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Databases**: 
  - PostgreSQL (primary)
  - MongoDB (analytics)
  - Redis (caching)
  - TimescaleDB (time-series)
- **Message Queue**: RabbitMQ
- **Real-time**: Socket.io
- **File Storage**: AWS S3
- **Payment**: Stripe, PayPal, Razorpay

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- MongoDB 7+
- Redis 7+
- RabbitMQ 3+

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your configuration
```

### Database Setup

```bash
# Run migrations
npm run migrate

# Or using Docker
docker-compose up -d
```

### Development

```bash
# Start development server
npm run dev

# The server will run on http://localhost:3000
```

### Production

```bash
# Build
npm run build

# Start
npm start
```

## API Documentation

The API is versioned and accessible at `/api/v1/`.

### Endpoints

- `/api/v1/auth` - Authentication
- `/api/v1/users` - User management
- `/api/v1/schools` - School management
- `/api/v1/attendance` - Attendance tracking
- `/api/v1/academics` - Academics and grades
- `/api/v1/communication` - Messaging
- `/api/v1/files` - File management
- `/api/v1/payments` - Payment processing
- `/api/v1/analytics` - Analytics and reports

### Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Environment Variables

See `.env.example` for all required environment variables.

## Docker

```bash
# Build and start all services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f
```

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Project Structure

```
backend/
├── src/
│   ├── config/          # Database and service configurations
│   ├── services/        # Microservices
│   │   ├── auth/
│   │   ├── user/
│   │   ├── school/
│   │   ├── attendance/
│   │   ├── academics/
│   │   ├── communication/
│   │   ├── analytics/
│   │   ├── file/
│   │   └── payment/
│   ├── shared/          # Shared utilities and types
│   │   ├── middleware/
│   │   ├── types/
│   │   └── utils/
│   ├── database/        # Database migrations
│   └── index.ts         # Entry point
├── docker-compose.yml
├── Dockerfile
└── package.json
```

## Security Features

- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Multi-factor authentication (MFA)
- Rate limiting
- Input validation with Zod
- SQL injection prevention
- XSS and CSRF protection
- Password hashing with bcrypt
- Session management with Redis

## Performance

- Redis caching layer
- Database connection pooling
- Query optimization with indexes
- Compression middleware
- CDN-ready static assets

## Monitoring

- Structured logging with Winston
- Health check endpoints
- Error tracking ready (Sentry integration)
- Performance monitoring ready (Prometheus integration)

## License

MIT
