# Role Connections, Routes & Application Status Documentation

## Overview

This document describes the complete connection structure between different user roles in EduSmartHub, including database relationships, API routes, frontend routes, and current/upcoming features.

---

## Role Hierarchy & Connections

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPER ADMIN (Platform Level)              │
│  - Manages all schools (tenants)                            │
│  - System-wide configuration                                │
│  - No tenant_id (global access)                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Creates & Manages
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              SCHOOL ADMIN (Tenant Level)                     │
│  - Manages one school (tenant_id)                            │
│  - Creates teachers, students, classes                       │
│  - Manages school operations                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Assigns & Manages
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    TEACHER (School Level)                    │
│  - Assigned to sections/subjects                             │
│  - Manages classes, attendance, grades                      │
│  - Communicates with parents                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Teaches & Manages
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    STUDENT (School Level)                    │
│  - Enrolled in sections                                      │
│  - Receives grades, attendance                              │
│  - Linked to parents                                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Linked via
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    PARENT (School Level)                     │
│  - Linked to students (children)                            │
│  - Views grades, attendance, timetable                       │
│  - Makes payments, receives notifications                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Relationships

### 1. Super Admin → School Admin Connection

**Database Tables:**
- `tenants` (schools) - Created by Super Admin
- `users` with `role_id` = 'school_admin' and `tenant_id` = school's ID

**Relationship:**
```sql
tenants (id)
  └── users (tenant_id, role_id = 'school_admin')
```

**Key Fields:**
- `users.tenant_id` → Links school admin to their school
- `users.role_id` → Defines role as school_admin
- `tenants.id` → School identifier

**Connection Method:**
- Super Admin creates `tenants` record
- Super Admin creates `users` record with `tenant_id` pointing to school
- School Admin can only access data where `tenant_id` matches their school

---

### 2. School Admin → Teacher Connection

**Database Tables:**
- `users` with `role_id` = 'teacher' and `tenant_id` = school's ID
- `teachers` table linked to `users`
- `teacher_assignments` - Links teachers to sections/subjects

**Relationship:**
```sql
tenants (id)
  └── users (tenant_id, role_id = 'teacher')
      └── teachers (user_id)
          └── teacher_assignments (teacher_id, section_id, subject_id)
```

**Key Fields:**
- `users.tenant_id` → Links teacher to school
- `teachers.user_id` → Links teacher profile to user account
- `teacher_assignments.section_id` → Links teacher to class sections
- `teacher_assignments.subject_id` → Links teacher to subjects

**Connection Method:**
- School Admin creates `users` record with `role_id = 'teacher'`
- School Admin creates `teachers` record linked to user
- School Admin creates `teacher_assignments` to assign teachers to sections/subjects

---

### 3. Teacher → Student Connection

**Database Tables:**
- `students` - Student records
- `sections` - Class sections
- `teacher_assignments` - Teacher's assigned sections
- `class_assignments` - Links teachers to sections/subjects

**Relationship:**
```sql
teachers (id)
  └── teacher_assignments (teacher_id, section_id)
      └── sections (id)
          └── students (current_section_id)
```

**Key Fields:**
- `teacher_assignments.teacher_id` → Teacher identifier
- `teacher_assignments.section_id` → Section identifier
- `students.current_section_id` → Links student to section
- `class_assignments` → Direct teacher-section-subject link

**Connection Method:**
- Teacher is assigned to a section via `teacher_assignments`
- Students are enrolled in sections via `students.current_section_id`
- Teacher can view all students in their assigned sections

---

### 4. Student → Parent Connection

**Database Tables:**
- `students` - Student records
- `users` with `role_id` = 'parent'
- `student_guardians` - Links students to parents

**Relationship:**
```sql
students (id)
  └── student_guardians (student_id, guardian_id)
      └── users (id = guardian_id, role_id = 'parent')
```

**Key Fields:**
- `student_guardians.student_id` → Links to student
- `student_guardians.guardian_id` → Links to parent user
- `student_guardians.relationship` → 'father', 'mother', 'guardian', etc.
- `student_guardians.is_primary` → Primary contact flag

**Connection Method:**
- Parent user account created with `role_id = 'parent'`
- `student_guardians` record created linking student to parent
- Parent can view all their children via `student_guardians` relationship

---

## Frontend Routes & Navigation

### Super Admin Routes

| Route | Component | Description | Status |
|-------|-----------|-------------|--------|
| `/super-admin` | SuperAdminDashboard | Main dashboard | ✅ Active |
| `/super-admin/schools` | Schools | Manage all schools | ✅ Active |
| `/super-admin/students` | Students | View all students (all schools) | ✅ Active |
| `/super-admin/teachers` | Teachers | View all teachers (all schools) | ✅ Active |
| `/super-admin/analytics` | Analytics | System-wide analytics | ✅ Active |
| `/super-admin/system-health` | SystemHealth | System monitoring | ✅ Active |
| `/super-admin/audit-logs` | AuditLogs | System audit trail | ✅ Active |
| `/super-admin/settings` | Settings | Platform settings | ✅ Active |

**Navigation Flow:**
- Super Admin → Schools → Select School → View School Details
- Super Admin → Schools → Create School → Assign School Admin

---

### School Admin Routes

| Route | Component | Description | Status |
|-------|-----------|-------------|--------|
| `/school-admin` | SchoolAdminDashboard | Main dashboard | ✅ Active |
| `/school-admin/teachers` | SchoolAdminTeachers | Manage teachers | ✅ Active |
| `/school-admin/students` | SchoolAdminStudents | Manage students | ✅ Active |
| `/school-admin/classes` | SchoolAdminClasses | Manage classes/sections | ✅ Active |
| `/school-admin/timetable` | SchoolAdminTimetable | Timetable management | ✅ Active |
| `/school-admin/finances` | SchoolAdminFinances | Financial management | ✅ Active |
| `/school-admin/reports` | SchoolAdminReports | Generate reports | ✅ Active |
| `/school-admin/settings` | SchoolAdminSettings | School settings | ✅ Active |

**Navigation Flow:**
- School Admin → Teachers → Create Teacher → Assign to Sections
- School Admin → Students → Enroll Student → Link to Parents
- School Admin → Classes → Create Section → Assign Teachers
- School Admin → Timetable → Generate → Assign Teachers to Periods

---

### Teacher Routes

| Route | Component | Description | Status |
|-------|-----------|-------------|--------|
| `/teacher` | TeacherDashboard | Main dashboard | ✅ Active |
| `/teacher/classes` | TeacherClasses | View assigned classes | ✅ Active |
| `/teacher/attendance` | TeacherAttendance | Mark attendance | ✅ Active |
| `/teacher/assignments` | TeacherAssignments | Manage assignments | ✅ Active |
| `/teacher/grades` | TeacherGrades | Grade students | ✅ Active |
| `/teacher/schedule` | TeacherSchedule | View timetable | ✅ Active |
| `/teacher/messages` | TeacherMessages | Communicate with parents | ✅ Active |

**Navigation Flow:**
- Teacher → Classes → Select Class → View Students
- Teacher → Attendance → Select Class → Mark Attendance
- Teacher → Grades → Select Assessment → Grade Students
- Teacher → Messages → Send Message to Parents

---

### Parent Routes

| Route | Component | Description | Status |
|-------|-----------|-------------|--------|
| `/parent` | ParentDashboard | Main dashboard | ✅ Active |
| `/parent/children` | ParentChildren | View children | ✅ Active |
| `/parent/attendance` | ParentAttendance | View attendance | ✅ Active |
| `/parent/grades` | ParentGrades | View grades | ✅ Active |
| `/parent/messages` | ParentMessages | Messages from teachers | ✅ Active |
| `/parent/documents` | ParentDocuments | School documents | ✅ Active |
| `/parent/payments` | ParentPayments | Fee payments | ✅ Active |

**Navigation Flow:**
- Parent → Children → Select Child → View Details
- Parent → Grades → Select Child → View Academic Performance
- Parent → Attendance → Select Child → View Attendance History
- Parent → Messages → View Messages from Teachers

---

## API Routes & Endpoints

### Super Admin → School Admin APIs

**Base URL:** `/api/v1/schools`

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/schools` | Create new school | ✅ Active |
| GET | `/schools` | List all schools | ✅ Active |
| GET | `/schools/:id` | Get school details | ✅ Active |
| PUT | `/schools/:id` | Update school | ✅ Active |
| DELETE | `/schools/:id` | Delete school | ✅ Active |
| POST | `/schools/:id/admin` | Create school admin | ✅ Active |

**Connection Flow:**
1. Super Admin creates school: `POST /api/v1/schools`
2. Super Admin creates school admin user: `POST /api/v1/users` with `role: 'school-admin'` and `schoolId: <school_id>`
3. School Admin can now access their school's data

---

### School Admin → Teacher APIs

**Base URL:** `/api/v1/users` and `/api/v1/timetable`

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/users` | Create teacher user | ✅ Active |
| GET | `/users?role=teacher` | List teachers | ✅ Active |
| POST | `/timetable/teacher-availability` | Set teacher availability | ✅ Active |
| GET | `/timetable/teacher-availability/:teacherId` | Get availability | ✅ Active |

**Connection Flow:**
1. School Admin creates teacher: `POST /api/v1/users` with `role: 'teacher'`
2. School Admin assigns teacher to section: Via `class_assignments` table
3. School Admin sets availability: `POST /api/v1/timetable/teacher-availability`
4. Teacher can now access their assigned classes

---

### Teacher → Student APIs

**Base URL:** `/api/v1/attendance`, `/api/v1/academics`

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/attendance/class/:classId` | Get class attendance | ✅ Active |
| POST | `/attendance/bulk` | Mark bulk attendance | ✅ Active |
| GET | `/academics/grades/class/:classId` | Get class grades | ✅ Active |
| POST | `/academics/grades` | Create grade | ✅ Active |
| GET | `/academics/progress/student/:studentId` | Get student progress | ✅ Active |

**Connection Flow:**
1. Teacher views assigned classes: Via `teacher_assignments`
2. Teacher marks attendance: `POST /api/v1/attendance/bulk`
3. Teacher grades students: `POST /api/v1/academics/grades`
4. Data flows to parent dashboard automatically

---

### Student → Parent APIs

**Base URL:** `/api/v1/students`, `/api/v1/academics`, `/api/v1/attendance`

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/students/:studentId` | Get student details | ✅ Active |
| GET | `/attendance/student/:studentId` | Get attendance | ✅ Active |
| GET | `/attendance/student/:studentId/stats` | Get attendance stats | ✅ Active |
| GET | `/academics/grades/student/:studentId` | Get grades | ✅ Active |
| GET | `/academics/progress/student/:studentId` | Get progress | ✅ Active |

**Connection Flow:**
1. Parent logs in → System identifies children via `student_guardians`
2. Parent views child data: `GET /api/v1/students/:studentId`
3. Parent views attendance: `GET /api/v1/attendance/student/:studentId`
4. Parent views grades: `GET /api/v1/academics/grades/student/:studentId`

---

## Data Flow Diagram

```
┌──────────────┐
│ Super Admin  │
└──────┬───────┘
       │ Creates
       ▼
┌──────────────┐     ┌──────────────┐
│   School     │─────▶│School Admin │
│  (Tenant)    │      └──────┬───────┘
└──────────────┘             │ Creates
                             ▼
                    ┌──────────────┐
                    │   Teacher    │
                    └──────┬───────┘
                           │ Assigned to
                           ▼
                    ┌──────────────┐
                    │   Section    │
                    └──────┬───────┘
                           │ Contains
                           ▼
                    ┌──────────────┐
                    │   Student    │
                    └──────┬───────┘
                           │ Linked to
                           ▼
                    ┌──────────────┐
                    │   Parent    │
                    └──────────────┘
```

---

## Current Application Status

### ✅ **Fully Implemented Features**

#### **Authentication & Authorization**
- ✅ JWT-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Multi-factor authentication (MFA)
- ✅ Session management
- ✅ Protected routes

#### **Super Admin Features**
- ✅ School management (CRUD)
- ✅ User management across all schools
- ✅ System-wide analytics
- ✅ System health monitoring
- ✅ Audit logs
- ✅ Platform settings

#### **School Admin Features**
- ✅ Teacher management
- ✅ Student management
- ✅ Class/section management
- ✅ **Timetable management** (NEW)
  - AI-powered generation
  - Manual editing
  - Conflict detection
  - Multiple views (Class, Teacher, Room, Analytics)
- ✅ Financial management
- ✅ Report generation
- ✅ School settings

#### **Teacher Features**
- ✅ Class management
- ✅ Attendance tracking
- ✅ Assignment management
- ✅ Grade management
- ✅ Schedule viewing
- ✅ Messaging

#### **Parent Features**
- ✅ Children overview
- ✅ Attendance viewing
- ✅ Grade viewing
- ✅ Messaging
- ✅ Document access
- ✅ Payment management

#### **Timetable System** (NEW)
- ✅ School timing configuration
- ✅ Break schedule management
- ✅ Room/lab management
- ✅ Teacher availability
- ✅ AI-powered generation
- ✅ Manual period editing
- ✅ Conflict detection
- ✅ Multiple view modes
- ✅ Analytics dashboard

---

### 🚧 **Partially Implemented Features**

#### **Communication**
- ✅ Basic messaging
- ⚠️ Real-time notifications (Socket.io configured, needs enhancement)
- ⚠️ Email notifications (backend ready, needs configuration)
- ⚠️ SMS notifications (backend ready, needs gateway setup)

#### **Analytics**
- ✅ Basic analytics
- ⚠️ Advanced reporting (needs more chart types)
- ⚠️ Predictive analytics (AI service ready, needs integration)

#### **Timetable System**
- ✅ Core functionality
- ⚠️ Export/Import (PDF, Excel, CSV) - Backend ready, frontend pending
- ⚠️ Google Calendar sync - Not implemented
- ⚠️ Notification system - Backend ready, frontend pending

---

### 📋 **Upcoming Features** (Planned)

#### **Phase 1: Enhanced Communication** (Q1 2026)
- [ ] Real-time chat between teachers and parents
- [ ] Push notifications for mobile app
- [ ] Email templates and automation
- [ ] SMS gateway integration
- [ ] WhatsApp integration
- [ ] Announcement broadcasting

#### **Phase 2: Advanced Timetable Features** (Q1 2026)
- [ ] Export timetables to PDF with school letterhead
- [ ] Excel import/export functionality
- [ ] CSV bulk operations
- [ ] Google Calendar sync
- [ ] Timetable change notifications
- [ ] Substitute teacher management UI
- [ ] Multi-campus support
- [ ] Natural language timetable commands

#### **Phase 3: Enhanced Analytics** (Q2 2026)
- [ ] Predictive student performance analytics
- [ ] Attendance trend analysis
- [ ] Teacher workload optimization suggestions
- [ ] Resource utilization forecasting
- [ ] Custom report builder
- [ ] Scheduled report generation
- [ ] Data visualization enhancements

#### **Phase 4: Mobile Applications** (Q2 2026)
- [ ] iOS mobile app
- [ ] Android mobile app
- [ ] Push notifications
- [ ] Offline mode
- [ ] Mobile-optimized UI

#### **Phase 5: Advanced Features** (Q3 2026)
- [ ] Video conferencing integration
- [ ] Online exam proctoring
- [ ] AI-powered learning path recommendations
- [ ] Automated report card generation
- [ ] Fee payment reminders
- [ ] Bus tracking integration
- [ ] Library management
- [ ] Inventory management

---

## Route Access Matrix

| Route | Super Admin | School Admin | Teacher | Parent | Student |
|-------|-------------|--------------|---------|--------|---------|
| `/super-admin/*` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/school-admin/*` | ❌ | ✅ | ❌ | ❌ | ❌ |
| `/teacher/*` | ❌ | ❌ | ✅ | ❌ | ❌ |
| `/parent/*` | ❌ | ❌ | ❌ | ✅ | ❌ |
| `/profile` | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Connection Workflows

### **Workflow 1: Super Admin Creates School & School Admin**

```
1. Super Admin → POST /api/v1/schools
   └── Creates tenant record
   
2. Super Admin → POST /api/v1/users
   └── Creates user with:
       - role: 'school-admin'
       - tenant_id: <school_id>
       - email, password, etc.
   
3. School Admin logs in → JWT token includes tenant_id
   └── All subsequent requests filtered by tenant_id
```

### **Workflow 2: School Admin Creates Teacher**

```
1. School Admin → POST /api/v1/users
   └── Creates user with:
       - role: 'teacher'
       - tenant_id: <school_id>
   
2. School Admin → Creates teacher_assignments
   └── Links teacher to sections/subjects
   
3. Teacher logs in → Sees only assigned classes
   └── Can access students in assigned sections
```

### **Workflow 3: School Admin Enrolls Student & Links Parent**

```
1. School Admin → POST /api/v1/users (if parent doesn't exist)
   └── Creates parent user with role: 'parent'
   
2. School Admin → POST /api/v1/students
   └── Creates student record
       - current_section_id: <section>
       - Links to user account (optional)
   
3. School Admin → Creates student_guardians record
   └── Links student to parent
       - student_id: <student_id>
       - guardian_id: <parent_user_id>
       - relationship: 'father'/'mother'/'guardian'
   
4. Parent logs in → System queries student_guardians
   └── Shows all linked children
```

### **Workflow 4: Teacher → Student → Parent Data Flow**

```
1. Teacher → POST /api/v1/attendance/bulk
   └── Marks attendance for students
   └── Data stored in student_attendance table
   
2. Parent → GET /api/v1/attendance/student/:studentId
   └── Retrieves attendance data
   └── Real-time updates via Socket.io
   
3. Teacher → POST /api/v1/academics/grades
   └── Creates grade for student
   └── Data stored in grades table
   
4. Parent → GET /api/v1/academics/grades/student/:studentId
   └── Retrieves grade data
   └── Notification sent to parent
```

---

## API Endpoint Summary

### **Super Admin Endpoints**

```
POST   /api/v1/schools                    - Create school
GET    /api/v1/schools                    - List all schools
GET    /api/v1/schools/:id                - Get school details
PUT    /api/v1/schools/:id                - Update school
DELETE /api/v1/schools/:id                - Delete school
GET    /api/v1/users                      - List all users (all schools)
POST   /api/v1/users                      - Create user (any school)
GET    /api/v1/analytics                  - System-wide analytics
```

### **School Admin Endpoints**

```
GET    /api/v1/users?role=teacher         - List teachers
POST   /api/v1/users                      - Create teacher/student/parent
GET    /api/v1/users?role=student         - List students
GET    /api/v1/users?role=parent          - List parents
POST   /api/v1/timetable/school-timings    - Configure school timing
POST   /api/v1/timetable/rooms            - Create room
POST   /api/v1/timetable/teacher-availability - Set teacher availability
POST   /api/v1/timetable/generate         - Generate timetable
GET    /api/v1/timetable/timetables/:id   - Get timetable
```

### **Teacher Endpoints**

```
GET    /api/v1/attendance/class/:classId  - Get class attendance
POST   /api/v1/attendance/bulk            - Mark bulk attendance
GET    /api/v1/academics/grades/class/:classId - Get class grades
POST   /api/v1/academics/grades           - Create grade
GET    /api/v1/academics/progress/student/:studentId - Get progress
GET    /api/v1/timetable/timetables/section/:sectionId - Get schedule
POST   /api/v1/communication/messages     - Send message
```

### **Parent Endpoints**

```
GET    /api/v1/students/:studentId       - Get child details
GET    /api/v1/attendance/student/:studentId - Get attendance
GET    /api/v1/attendance/student/:studentId/stats - Get stats
GET    /api/v1/academics/grades/student/:studentId - Get grades
GET    /api/v1/academics/progress/student/:studentId - Get progress
GET    /api/v1/communication/messages    - Get messages
GET    /api/v1/payments?studentId=:id    - Get payments
```

---

## Real-time Connections (Socket.io)

### **Events by Role**

#### **Super Admin Events**
- `system_health_update` - System metrics
- `school_created` - New school notification
- `alert_system_wide` - System alerts

#### **School Admin Events**
- `teacher_assigned` - Teacher assignment notification
- `student_enrolled` - New student enrollment
- `timetable_generated` - Timetable generation complete
- `conflict_detected` - Timetable conflict alert

#### **Teacher Events**
- `attendance_reminder` - Attendance marking reminder
- `assignment_submitted` - Student submission
- `message_received` - Message from parent/admin
- `schedule_changed` - Timetable update

#### **Parent Events**
- `attendance_updated` - Child attendance update
- `grade_posted` - New grade notification
- `message_received` - Message from teacher
- `payment_due` - Payment reminder
- `announcement` - School announcement

---

## Security & Access Control

### **Multi-Tenancy**
- Each school (tenant) has isolated data
- Users can only access data from their `tenant_id`
- Super Admin bypasses tenant restrictions

### **Role-Based Permissions**
- Permissions defined in `permissions` table
- Roles linked to permissions via `role_permissions`
- API endpoints check permissions before access

### **Data Isolation**
```sql
-- School Admin can only see their school's data
WHERE tenant_id = :user_tenant_id

-- Teacher can only see assigned classes
WHERE section_id IN (SELECT section_id FROM teacher_assignments WHERE teacher_id = :teacher_id)

-- Parent can only see their children
WHERE student_id IN (SELECT student_id FROM student_guardians WHERE guardian_id = :parent_id)
```

---

## Integration Points

### **Between Roles**

1. **Super Admin ↔ School Admin**
   - School creation and management
   - User account provisioning
   - Subscription management

2. **School Admin ↔ Teacher**
   - Teacher assignment to sections
   - Timetable generation and assignment
   - Performance monitoring

3. **Teacher ↔ Student**
   - Attendance marking
   - Grade entry
   - Assignment distribution

4. **Teacher ↔ Parent**
   - Messaging system
   - Grade notifications
   - Attendance alerts

5. **Student ↔ Parent**
   - Automatic data sharing
   - Notification forwarding
   - Payment processing

---

## Current Implementation Status

### ✅ **Completed**
- [x] Role hierarchy and database relationships
- [x] Authentication and authorization
- [x] All frontend routes
- [x] Core API endpoints
- [x] Timetable management system
- [x] Basic communication
- [x] Attendance tracking
- [x] Grade management
- [x] Parent portal

### 🚧 **In Progress**
- [ ] Export/Import functionality
- [ ] Advanced notifications
- [ ] Mobile app development
- [ ] Enhanced analytics

### 📋 **Planned**
- [ ] Video conferencing
- [ ] Advanced AI features
- [ ] Multi-campus support
- [ ] Bus tracking
- [ ] Library management

---

## Next Steps for Development

1. **Complete Export/Import** (Priority: High)
   - PDF export with school branding
   - Excel import/export
   - CSV bulk operations

2. **Enhance Notifications** (Priority: High)
   - Email notifications
   - SMS gateway integration
   - Push notifications

3. **Mobile App** (Priority: Medium)
   - React Native app
   - Push notifications
   - Offline mode

4. **Advanced Features** (Priority: Low)
   - Video conferencing
   - Online exams
   - Bus tracking

---

**Last Updated**: 2026-01-09
**Version**: 1.0.0
**Status**: Core functionality complete, enhancements in progress
