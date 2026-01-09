# EduSmartHub - Frontend

This is the frontend application for the EduSmartHub School Management System.

## Project Structure

```
frontend/
├── src/
│   ├── components/        # React components
│   ├── pages/            # Page components (routing)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility libraries and configurations
│   ├── store/            # Redux store and slices
│   └── contexts/         # React contexts
├── public/               # Static assets
├── index.html           # Entry HTML file
├── package.json         # Dependencies and scripts
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
└── tailwind.config.ts   # Tailwind CSS configuration
```

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:8080`

### Build

```bash
npm run build
```

## Routes

All routes are configured in `src/App.tsx`:

### Public Routes
- `/` - Landing page (Index)

### Super Admin Routes
- `/super-admin` - Dashboard
- `/super-admin/schools` - School management
- `/super-admin/students` - Student management
- `/super-admin/teachers` - Teacher management
- `/super-admin/analytics` - Analytics dashboard
- `/super-admin/system-health` - System health monitoring
- `/super-admin/audit-logs` - Audit logs viewer
- `/super-admin/settings` - Settings

### School Admin Routes
- `/school-admin` - Dashboard
- `/school-admin/teachers` - Teacher management
- `/school-admin/students` - Student management
- `/school-admin/classes` - Class management
- `/school-admin/finances` - Financial management
- `/school-admin/reports` - Reports
- `/school-admin/settings` - Settings

### Teacher Routes
- `/teacher` - Dashboard
- `/teacher/classes` - Class management
- `/teacher/attendance` - Attendance tracking
- `/teacher/assignments` - Assignment management
- `/teacher/grades` - Gradebook
- `/teacher/schedule` - Schedule
- `/teacher/messages` - Messages

### Parent Routes
- `/parent` - Dashboard
- `/parent/children` - Children overview
- `/parent/attendance` - Attendance tracking
- `/parent/grades` - Grade tracking
- `/parent/messages` - Messages
- `/parent/documents` - Documents
- `/parent/payments` - Payments

## Features

- ✅ Real-time notifications with Socket.io
- ✅ Instant messaging with typing indicators
- ✅ Collaborative document editing
- ✅ Real-time attendance marking
- ✅ Online status indicators
- ✅ Exam monitoring interface
- ✅ Live meeting scheduler
- ✅ Grade update notifications
- ✅ Announcement broadcast system
- ✅ Advanced data visualizations
- ✅ Multi-language support (i18n)
- ✅ Dark/Light mode theme
- ✅ Redux state management
- ✅ React Query for server state

## Technologies

- React 18
- TypeScript
- Vite
- React Router
- Redux Toolkit
- Socket.io Client
- Recharts / D3.js
- Tailwind CSS
- shadcn/ui
- React Query
