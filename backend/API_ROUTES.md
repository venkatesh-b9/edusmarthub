# Backend API Routes Documentation

## Base URL
- Development: `http://localhost:3000/api/v1`
- Production: `https://api.edusmarthub.com/api/v1`

## Authentication

All protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

For multi-tenant requests, include the school context:
```
X-School-Id: <school_id>
```

## API Endpoints

### Authentication Service (`/auth`)

#### POST `/auth/login`
Login with email and password
```json
{
  "email": "user@example.com",
  "password": "password123",
  "mfaCode": "123456" // Optional
}
```

#### POST `/auth/register`
Register a new user
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "teacher",
  "schoolId": "uuid" // Optional
}
```

#### POST `/auth/refresh`
Refresh access token
```json
{
  "refreshToken": "refresh_token_here"
}
```

#### POST `/auth/logout`
Logout current session

#### POST `/auth/mfa/setup`
Setup MFA
```json
{
  "method": "sms" // or "email", "authenticator"
}
```

#### POST `/auth/mfa/verify`
Verify MFA code
```json
{
  "code": "123456",
  "secret": "secret_here" // For authenticator apps
}
```

#### GET `/auth/oauth/:provider`
Initiate OAuth flow (Google, Microsoft)

---

### User Management Service (`/users`)

#### GET `/users`
Get all users (paginated)
Query params: `page`, `limit`, `schoolId`, `role`, `isActive`

#### GET `/users/:id`
Get user by ID

#### POST `/users`
Create new user
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "teacher",
  "schoolId": "uuid",
  "phoneNumber": "+1234567890"
}
```

#### PUT `/users/:id`
Update user

#### DELETE `/users/:id`
Delete user

#### POST `/users/bulk/import`
Bulk import users
```json
{
  "users": [
    {
      "email": "user1@example.com",
      "firstName": "User",
      "lastName": "One",
      "role": "student"
    }
  ]
}
```

#### GET `/users/bulk/export`
Export users (CSV/JSON)

---

### School Management Service (`/schools`)

#### GET `/schools`
Get all schools

#### GET `/schools/:id`
Get school by ID

#### POST `/schools`
Create new school
```json
{
  "name": "Example School",
  "code": "EXSCH",
  "subdomain": "example",
  "email": "admin@example.com",
  "phone": "+1234567890",
  "address": "123 Main St",
  "city": "City",
  "state": "State",
  "country": "US"
}
```

#### PUT `/schools/:id`
Update school

#### DELETE `/schools/:id`
Delete school

---

### Attendance Service (`/attendance`)

#### POST `/attendance`
Mark attendance
```json
{
  "studentId": "uuid",
  "classId": "uuid",
  "schoolId": "uuid",
  "date": "2024-01-15",
  "status": "present", // present, absent, late, excused, half_day
  "method": "manual", // manual, biometric, rfid, facial_recognition
  "notes": "Optional notes"
}
```

#### POST `/attendance/bulk`
Bulk mark attendance
```json
{
  "records": [
    {
      "studentId": "uuid",
      "status": "present"
    }
  ],
  "classId": "uuid",
  "schoolId": "uuid",
  "date": "2024-01-15",
  "method": "manual"
}
```

#### GET `/attendance/student/:studentId`
Get attendance by student
Query params: `startDate`, `endDate`

#### GET `/attendance/student/:studentId/stats`
Get attendance statistics

---

### Academics Service (`/academics`)

#### POST `/academics/assessments`
Create assessment
```json
{
  "schoolId": "uuid",
  "classId": "uuid",
  "subject": "Mathematics",
  "title": "Midterm Exam",
  "type": "exam",
  "maxScore": 100,
  "weight": 30,
  "dueDate": "2024-02-15",
  "rubric": {}
}
```

#### POST `/academics/grades`
Create grade
```json
{
  "studentId": "uuid",
  "classId": "uuid",
  "subject": "Mathematics",
  "assessmentId": "uuid",
  "score": 85,
  "maxScore": 100,
  "remarks": "Good work"
}
```

#### GET `/academics/grades/student/:studentId`
Get grades by student
Query params: `classId`, `subject`

#### GET `/academics/progress/student/:studentId`
Get student progress
Query params: `classId`

---

### Communication Service (`/communication`)

#### POST `/communication/messages`
Send message
```json
{
  "recipientId": "uuid",
  "schoolId": "uuid",
  "subject": "Subject",
  "content": "Message content",
  "type": "direct",
  "attachments": []
}
```

#### GET `/communication/messages`
Get messages
Query params: `type`, `isRead`, `limit`, `offset`

#### PUT `/communication/messages/:id/read`
Mark message as read

#### POST `/communication/announcements`
Create announcement
```json
{
  "schoolId": "uuid",
  "subject": "Announcement Title",
  "content": "Announcement content",
  "targetRoles": ["teacher", "student"],
  "targetClasses": ["uuid"]
}
```

---

### Analytics Service (`/analytics`)

#### GET `/analytics/aggregate`
Aggregate analytics data
Query params: `schoolId`, `startDate`, `endDate`

#### GET `/analytics`
Get analytics data
Query params: `schoolId`, `startDate`, `endDate`

#### GET `/analytics/reports/:type`
Generate report
Query params: `schoolId`, `startDate`, `endDate`
Types: `attendance`, `academic`, `financial`

---

### File Management Service (`/files`)

#### POST `/files/upload`
Upload file (multipart/form-data)
- `file`: File object
- `metadata`: JSON string (optional)

#### GET `/files/files`
Get files
Query params: `uploadedBy`, `mimeType`, `limit`, `offset`

#### GET `/files/files/:id/url`
Get signed URL for file
Query params: `expiresIn` (seconds)

#### DELETE `/files/files/:id`
Delete file

---

### Payment Service (`/payments`)

#### POST `/payments`
Create payment
```json
{
  "schoolId": "uuid",
  "studentId": "uuid",
  "parentId": "uuid",
  "amount": 1000.00,
  "currency": "USD",
  "invoiceId": "uuid",
  "dueDate": "2024-02-15",
  "gateway": "stripe"
}
```

#### POST `/payments/:id/process`
Process payment

#### GET `/payments`
Get payments
Query params: `parentId`, `studentId`

---

## Real-time Service (Socket.io)

### Connection
```typescript
const socket = io('http://localhost:3001', {
  auth: {
    token: 'access_token',
    userId: 'user_id'
  }
});
```

### Events

#### Client → Server
- `join_classroom_monitoring` - Join classroom monitoring
- `join_document` - Join document collaboration
- `subscribe_notifications` - Subscribe to notifications
- `create_poll` - Create poll
- `vote_poll` - Vote on poll
- `start_screen_share` - Start screen sharing
- `join_whiteboard` - Join whiteboard
- `whiteboard_draw` - Draw on whiteboard
- `subscribe_bus_tracking` - Subscribe to bus tracking
- `start_exam_proctoring` - Start exam proctoring
- `subscribe_emergency` - Subscribe to emergency broadcasts
- `join_chat` - Join chat room
- `send_message` - Send message
- `subscribe_dashboard` - Subscribe to dashboard updates

#### Server → Client
- `student_activity_update` - Student activity update
- `classroom_status` - Classroom status change
- `document_operation` - Document operation
- `notification` - New notification
- `poll_updated` - Poll update
- `whiteboard_element_added` - Whiteboard element added
- `bus_location_update` - Bus location update
- `proctoring_alert` - Exam proctoring alert
- `emergency_broadcast` - Emergency broadcast
- `new_message` - New chat message
- `dashboard_update` - Dashboard data update

---

## AI Service Endpoints

Base URL: `http://localhost:5000/api/v1/ai`

### POST `/ai/performance/predict`
Predict student performance

### POST `/ai/early-warning/assess`
Assess student risk

### POST `/ai/early-warning/detect-batch`
Detect at-risk students (batch)

### POST `/ai/essay-grading/grade`
Grade essay

### POST `/ai/essay-grading/plagiarism`
Check plagiarism

### POST `/ai/sentiment/analyze`
Analyze sentiment

### POST `/ai/learning-path/recommend`
Recommend learning path

### POST `/ai/anomaly/attendance`
Detect attendance anomalies

### POST `/ai/chatbot/chat`
Chat with AI assistant

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format",
      "code": "INVALID_EMAIL"
    }
  ]
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [
    // Array of items
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

---

## Rate Limiting

- General API: 100 requests per minute per IP
- Authentication: 5 requests per minute per IP
- File upload: 10 requests per minute per user

Rate limit headers:
- `X-RateLimit-Limit`: Maximum requests
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time (Unix timestamp)

---

## Error Codes

- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `429` - Too Many Requests
- `500` - Internal Server Error
- `503` - Service Unavailable
