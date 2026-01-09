# Database Architecture - EduSmartHub

## Overview

EduSmartHub uses a **multi-database architecture** optimized for different types of data and use cases.

---

## Primary Databases

### 1. **PostgreSQL 15** (Primary Database)
**Purpose**: Main relational database for all core application data

**Connection Details:**
- **Host**: `localhost` (default) or `postgres` (Docker)
- **Port**: `5432`
- **Database**: `edusmarthub`
- **User**: `postgres`
- **Password**: `postgres` (change in production)

**Technology**: Sequelize ORM with raw SQL queries

**Data Stored:**

#### **Tenant Management** (`001_tenant_management.sql`)
- **tenants** - School/organization information
  - School details (name, code, subdomain)
  - Contact information (email, phone, address)
  - Subscription details (tier, status, limits)
  - Branding (logo, colors, favicon)
  - Settings (timezone, locale, currency, date/time format)
  - Trial and activation status

#### **User Management** (`002_user_management.sql`)
- **roles** - User roles (super_admin, school_admin, teacher, parent, student)
- **permissions** - System permissions
- **role_permissions** - Role-permission mappings
- **users** - All system users
  - Authentication (email, password hash, MFA)
  - Personal information (name, DOB, gender, photo)
  - Contact details (phone, address, emergency contacts)
  - Role and permissions
  - Activity tracking (last login, login history)
  - Preferences and settings

#### **Academic Structure** (`003_academic_structure.sql`)
- **academic_years** - Academic year definitions (e.g., "2024-2025")
- **terms** - Semesters/terms within academic years
- **grades** - Grade levels (Kindergarten through Grade 12)
- **sections** - Class sections (A, B, C, etc.) per grade
- **subjects** - Subject catalog
- **curricula** - Curriculum definitions
- **curriculum_subjects** - Subject-curriculum mappings
- **timetables** - Timetable instances
- **timetable_periods** - Individual class periods
- **class_assignments** - Teacher-section-subject assignments

#### **Student Management** (`004_student_management.sql`)
- **students** - Student records
  - Student numbers and admission details
  - Academic information (current section, grade, academic year)
  - Personal information (name, DOB, gender, nationality)
  - Contact information
  - Medical information (blood group, allergies, special needs)
  - Transportation details
  - Enrollment status
- **student_academic_records** - Academic performance summaries
  - Credits, GPA, rankings
  - Attendance summaries
  - Promotion status
- **student_guardians** - Parent/guardian relationships
- **student_documents** - Document storage references
- **student_fees** - Fee records

#### **Staff Management** (`005_staff_management.sql`)
- **teachers** - Teacher records
  - Employee numbers and IDs
  - Employment details (type, hire date)
  - Qualifications and certifications
  - Department and subject areas
  - Years of experience
- **teacher_subject_expertise** - Teacher-subject proficiency
- **teacher_assignments** - Teaching assignments history
- **teacher_attendance** - Staff attendance records
- **teacher_salary** - Salary information
- **teacher_leaves** - Leave requests and records

#### **Assessment System** (`006_assessment_system.sql`)
- **assessments** - Tests, exams, assignments, projects
  - Subject, title, type, max score, weight
  - Due dates, rubrics
- **grades** - Student grades for assessments
  - Scores, percentages, letter grades
  - Grading remarks
- **grade_books** - Gradebook summaries
- **report_cards** - Generated report cards

#### **Communication & Resources** (`007_communication_resources.sql`)
- **messages** - Direct messages between users
- **announcements** - School-wide announcements
- **notifications** - System notifications
- **resources** - Shared resources (files, links)
- **events** - Calendar events

#### **Timetable System** (`008_timetable_system.sql`)
- **school_timings** - School schedule configuration
  - Start/end times, period duration, total periods
  - School days (bitmask)
  - Shift configuration
- **break_schedules** - Break/lunch schedules
- **rooms** - Classroom and lab inventory
  - Room numbers, buildings, floors
  - Capacity, equipment (projector, labs)
  - Availability status
- **teacher_availability** - Teacher availability constraints
- **timetable_versions** - Version control for timetables
- **timetable_templates** - Reusable timetable templates
- **timetable_conflicts** - Conflict detection and tracking
- **substitute_assignments** - Substitute teacher assignments
- **timetable_notifications** - Schedule change notifications
- **timetable_generation_logs** - AI generation history
- **timetable_statistics** - Analytics and metrics

---

### 2. **TimescaleDB** (Time-Series Database)
**Purpose**: Optimized for time-series data (attendance trends, performance metrics over time)

**Connection Details:**
- **Port**: `5433`
- **Database**: `timeseries`
- **User**: `postgres`
- **Password**: `postgres`

**Data Stored:**
- Real-time attendance data
- Performance metrics over time
- System usage statistics
- Time-based analytics

---

### 3. **MongoDB 7** (Document Database)
**Purpose**: Analytics, logs, and flexible document storage

**Connection Details:**
- **Port**: `27017`
- **Database**: `edusmarthub`
- **User**: `admin`
- **Password**: `admin`

**Data Stored:**
- **Analytics Data** - Aggregated analytics metrics
  - Daily/weekly/monthly summaries
  - Student performance trends
  - Attendance rates
  - Revenue metrics
- **Application Logs** - System and application logs
- **Audit Trails** - User action logs
- **Flexible Documents** - JSON documents that don't fit relational schema

---

### 4. **Redis 7** (In-Memory Cache)
**Purpose**: Caching, sessions, and real-time data

**Connection Details:**
- **Port**: `6379`
- **No authentication** (development)

**Data Stored:**
- **Session Data** - User sessions
- **Cache** - Frequently accessed data
  - User permissions
  - School settings
  - Timetable data
- **Rate Limiting** - API rate limit counters
- **Real-time Data** - Live updates and notifications

---

### 5. **Elasticsearch 8.11** (Search Engine)
**Purpose**: Full-text search and advanced queries

**Connection Details:**
- **Port**: `9200` (HTTP), `9300` (Transport)
- **Security**: Disabled (development)

**Data Stored:**
- **Search Indexes** - Searchable content
  - Student records
  - Teacher profiles
  - Documents
  - Messages and announcements
- **Analytics Queries** - Complex search and aggregation

---

### 6. **RabbitMQ 3** (Message Queue)
**Purpose**: Asynchronous task processing and messaging

**Connection Details:**
- **Port**: `5672` (AMQP), `15672` (Management UI)
- **User**: `admin`
- **Password**: `admin`

**Used For:**
- **Background Jobs** - Timetable generation, report generation
- **Email Notifications** - Sending emails asynchronously
- **SMS Notifications** - Sending SMS messages
- **File Processing** - Image processing, document conversion
- **Analytics Processing** - Data aggregation tasks

---

## Data Flow

### **Write Operations:**
1. **User Actions** → PostgreSQL (immediate write)
2. **Analytics** → MongoDB (aggregated writes)
3. **Time-Series Data** → TimescaleDB (optimized writes)
4. **Cache Updates** → Redis (fast access)

### **Read Operations:**
1. **Check Redis** → If cached, return immediately
2. **Query PostgreSQL** → Primary data source
3. **Search Queries** → Elasticsearch
4. **Time-Series Queries** → TimescaleDB
5. **Analytics** → MongoDB

---

## Database Schema Summary

### **Core Tables (PostgreSQL):**

| Category | Tables | Key Data |
|----------|--------|----------|
| **Tenants** | 1 | Schools, subscriptions, branding |
| **Users** | 4 | Users, roles, permissions, sessions |
| **Academic** | 8 | Years, terms, grades, sections, subjects, curricula |
| **Students** | 5 | Student records, academic records, guardians, documents, fees |
| **Staff** | 6 | Teachers, expertise, assignments, attendance, salary, leaves |
| **Assessments** | 4 | Assessments, grades, gradebooks, report cards |
| **Communication** | 5 | Messages, announcements, notifications, resources, events |
| **Timetable** | 12 | Timings, breaks, rooms, availability, timetables, periods, conflicts, versions, templates, substitutes, notifications, logs, statistics |

**Total: ~45+ core tables** in PostgreSQL

---

## Environment Variables

```env
# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=edusmarthub
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# MongoDB
MONGODB_URI=mongodb://admin:admin@localhost:27017/edusmarthub?authSource=admin

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# TimescaleDB
TIMESCALEDB_HOST=localhost
TIMESCALEDB_PORT=5433

# Elasticsearch
ELASTICSEARCH_HOST=localhost
ELASTICSEARCH_PORT=9200

# RabbitMQ
RABBITMQ_URL=amqp://admin:admin@localhost:5672
```

---

## Setup Instructions

### **Using Docker Compose (Recommended):**
```bash
cd backend
docker-compose up -d
```

This starts all databases:
- PostgreSQL on port 5432
- TimescaleDB on port 5433
- MongoDB on port 27017
- Redis on port 6379
- Elasticsearch on port 9200
- RabbitMQ on port 5672 (Management UI: http://localhost:15672)

### **Manual Setup:**
1. Install PostgreSQL 15
2. Install MongoDB 7
3. Install Redis 7
4. Install Elasticsearch 8.11
5. Install RabbitMQ 3
6. Run schema files in order:
   ```bash
   psql -U postgres -d edusmarthub -f database/schema/001_tenant_management.sql
   psql -U postgres -d edusmarthub -f database/schema/002_user_management.sql
   # ... continue for all schema files
   ```

---

## Data Relationships

```
Tenants (Schools)
  ├── Users (All users)
  │   ├── Teachers
  │   ├── Students
  │   └── Parents
  ├── Academic Years
  │   ├── Terms
  │   └── Grades
  │       └── Sections
  │           ├── Students
  │           ├── Timetables
  │           └── Class Assignments
  ├── Subjects
  │   ├── Curricula
  │   └── Teacher Expertise
  ├── Assessments
  │   └── Grades
  └── Timetables
      ├── Periods
      ├── Conflicts
      └── Statistics
```

---

## Key Features

1. **Multi-Tenancy**: Each school (tenant) has isolated data
2. **Version Control**: Timetables support versioning
3. **Audit Trail**: All changes tracked
4. **Soft Deletes**: Data marked as deleted, not removed
5. **Indexes**: Optimized for common queries
6. **Constraints**: Data integrity enforced at database level
7. **JSONB Support**: Flexible JSON data where needed

---

## Backup & Recovery

### **PostgreSQL:**
```bash
pg_dump -U postgres edusmarthub > backup.sql
pg_restore -U postgres -d edusmarthub backup.sql
```

### **MongoDB:**
```bash
mongodump --uri="mongodb://admin:admin@localhost:27017/edusmarthub"
mongorestore --uri="mongodb://admin:admin@localhost:27017/edusmarthub"
```

### **Redis:**
```bash
redis-cli SAVE  # Creates dump.rdb
```

---

## Performance Considerations

1. **PostgreSQL**: Primary database with indexes on foreign keys and frequently queried columns
2. **Redis**: Caches frequently accessed data (user sessions, permissions)
3. **MongoDB**: Stores aggregated analytics (reduces load on PostgreSQL)
4. **Elasticsearch**: Handles complex search queries
5. **TimescaleDB**: Optimized for time-series queries (attendance trends)

---

## Security

- **Production**: Change all default passwords
- **SSL/TLS**: Enable for PostgreSQL in production
- **Authentication**: Enable for MongoDB, Redis, Elasticsearch
- **Network**: Restrict database access to application servers only
- **Backups**: Encrypt backups before storage

---

**Last Updated**: 2026-01-09
**Version**: 1.0.0
