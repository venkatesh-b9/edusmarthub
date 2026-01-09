# Realtime Service - EduSmartHub

Real-time service using Node.js and Socket.io for live features in the EduSmartHub platform.

## Features

### 1. Live Classroom Monitoring Dashboard
- Real-time student activity tracking
- Teacher monitoring actions
- Engagement metrics and statistics
- Live participation tracking

### 2. Real-time Document Collaboration
- Collaborative document editing
- Operational transforms for conflict resolution
- Cursor position tracking
- Real-time synchronization

### 3. Instant Notification Delivery
- Real-time push notifications
- Role-based notification routing
- Offline notification queuing
- Notification persistence

### 4. Live Polling and Quiz
- Real-time polls during classes
- Interactive quizzes with instant results
- Vote tracking and result visualization
- Time-limited quizzes

### 5. Screen Sharing and Whiteboard
- WebRTC-based screen sharing
- Collaborative whiteboard with drawing tools
- Real-time element synchronization
- History management

### 6. Real-time Bus Location Tracking
- GPS-based location updates
- Route tracking
- Speed and heading monitoring
- Location history

### 7. Live Exam Proctoring Alerts
- Real-time proctoring alerts
- Multiple alert types (face detection, tab switch, etc.)
- Severity-based alerting
- Alert acknowledgment system

### 8. Emergency Broadcast System
- Priority-based emergency broadcasts
- Role and school-based targeting
- Acknowledgment tracking
- Escalation mechanisms

### 9. Parent-Teacher Chat
- Real-time messaging
- File sharing
- Typing indicators
- Message read receipts
- Chat history

### 10. Real-time Dashboard Updates
- Data streaming for analytics
- Live attendance updates
- Grade updates
- System status monitoring

## Architecture

### Connection Management
- Redis adapter for horizontal scaling
- Connection tracking and monitoring
- Heartbeat mechanism
- Automatic reconnection handling

### Room-based Architecture
- Dynamic room creation
- Room capacity management
- Participant tracking
- Room-based message routing

### Message Persistence
- PostgreSQL storage for messages
- Configurable retention period
- Automatic cleanup of old messages
- Message history retrieval

### Scalability
- Redis adapter for multi-server support
- Horizontal scaling capability
- Load balancing ready
- Connection pooling

### Failover Mechanisms
- Heartbeat monitoring
- Automatic failover detection
- Connection recovery
- State synchronization

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your configuration
```

## Running

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## Docker

```bash
# Build
docker build -t realtime-service .

# Run
docker run -p 3001:3001 -p 3002:3002 realtime-service
```

## Configuration

Key configuration options in `.env`:

- `PORT`: HTTP server port (default: 3001)
- `SOCKET_PORT`: Socket.io port (default: 3002)
- `REDIS_HOST`: Redis host for adapter
- `ENABLE_MESSAGE_PERSISTENCE`: Enable message storage
- `MESSAGE_RETENTION_DAYS`: Days to keep messages

## API Events

### Client Events

- `join_room` - Join a room
- `leave_room` - Leave a room
- `send_message` - Send a message
- `subscribe_notifications` - Subscribe to notifications
- `create_poll` - Create a poll
- `vote_poll` - Vote on a poll
- `start_screen_share` - Start screen sharing
- `whiteboard_draw` - Draw on whiteboard
- `update_bus_location` - Update bus location
- `proctoring_alert` - Report proctoring alert
- `create_emergency_broadcast` - Create emergency broadcast

### Server Events

- `room_joined` - Confirmation of room join
- `new_message` - New message received
- `notification` - New notification
- `poll_created` - Poll created
- `poll_updated` - Poll results updated
- `screen_share_started` - Screen share started
- `whiteboard_element_added` - Whiteboard element added
- `bus_location_update` - Bus location updated
- `proctoring_alert` - Proctoring alert
- `emergency_broadcast` - Emergency broadcast
- `dashboard_update` - Dashboard data update

## Integration

The service integrates with:
- Main backend API for authentication
- PostgreSQL for message persistence
- Redis for caching and adapter
- MongoDB (optional) for additional storage

## Security

- JWT-based authentication
- Room-based access control
- Rate limiting
- Input validation
- CORS configuration

## Monitoring

- Health check endpoint: `/health`
- Structured logging with Winston
- Connection metrics
- Room statistics
- Message throughput

## License

MIT
