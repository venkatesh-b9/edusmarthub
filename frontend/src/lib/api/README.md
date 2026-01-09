# Frontend-Backend API Integration

This directory contains all API service integrations between the frontend and backend services.

## Structure

```
api/
├── config.ts              # Axios client configuration with interceptors
├── types.ts               # Common TypeScript types
├── index.ts               # Main export file
└── services/
    ├── auth.service.ts           # Authentication & Authorization
    ├── user.service.ts           # User Management
    ├── school.service.ts         # School Management
    ├── attendance.service.ts     # Attendance Management
    ├── academics.service.ts     # Academic & Grade Management
    ├── communication.service.ts  # Messaging & Announcements
    ├── analytics.service.ts     # Analytics & Reporting
    ├── file.service.ts          # File Upload & Management
    ├── payment.service.ts        # Payment Processing
    ├── ai.service.ts            # AI Service Integration
    └── realtime.service.ts      # Real-time Service Integration
```

## Usage

### Basic API Call

```typescript
import { authService } from '@/lib/api';

// Login
const response = await authService.login({
  email: 'user@example.com',
  password: 'password123'
});
```

### With Error Handling

```typescript
import { userService } from '@/lib/api';

try {
  const users = await userService.getUsers({
    page: 1,
    limit: 10,
    role: 'teacher'
  });
} catch (error) {
  console.error('Failed to fetch users:', error);
}
```

### Real-time Services

```typescript
import { realtimeService } from '@/lib/api';

// Subscribe to notifications
const unsubscribe = realtimeService.onNotification((notification) => {
  console.log('New notification:', notification);
});

// Later, cleanup
unsubscribe();
```

## Environment Variables

Create a `.env` file in the frontend root:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_SOCKET_URL=http://localhost:3001
VITE_AI_SERVICE_URL=http://localhost:5000/api/v1/ai
```

## Authentication

The API client automatically:
- Adds JWT tokens to requests from localStorage
- Refreshes tokens on 401 errors
- Redirects to login on authentication failure
- Includes school context (X-School-Id header)

## Services Overview

### Auth Service
- Login/Logout
- Registration
- Token refresh
- MFA setup/verification
- OAuth integration

### User Service
- CRUD operations
- Bulk import/export
- User profile management

### School Service
- School CRUD
- School configuration
- Branding management

### Attendance Service
- Mark attendance (single/bulk)
- Get attendance records
- Attendance statistics

### Academics Service
- Assessment management
- Grade entry/retrieval
- Student progress tracking

### Communication Service
- Send messages
- Create announcements
- Notification management

### Analytics Service
- Data aggregation
- Report generation
- Analytics dashboard data

### File Service
- File upload
- File retrieval
- Signed URL generation

### Payment Service
- Payment processing
- Invoice management
- Payment history

### AI Service
- Performance prediction
- Early warning system
- Essay grading
- Sentiment analysis
- Learning path recommendations

### Realtime Service
- Classroom monitoring
- Document collaboration
- Live notifications
- Polling & quizzes
- Screen sharing
- Bus tracking
- Exam proctoring
- Emergency broadcasts
- Parent-teacher chat

## Error Handling

All services use the centralized error handler in `config.ts`:
- 401: Auto token refresh or redirect to login
- 500+: Shows toast notification
- Network errors: Shows connection error message

## TypeScript Support

All services are fully typed. Import types from service files:

```typescript
import { User, CreateUserData } from '@/lib/api/services/user.service';
```
