-- Initial database schema for EduSmartHub

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  "passwordHash" VARCHAR(255) NOT NULL,
  "firstName" VARCHAR(255) NOT NULL,
  "lastName" VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  "schoolId" UUID,
  permissions JSONB DEFAULT '[]',
  "isActive" BOOLEAN DEFAULT true,
  "isEmailVerified" BOOLEAN DEFAULT false,
  "mfaEnabled" BOOLEAN DEFAULT false,
  "mfaSecret" VARCHAR(255),
  "phoneNumber" VARCHAR(20),
  "lastLoginAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_school_id ON users("schoolId");
CREATE INDEX idx_users_role ON users(role);

-- Schools table
CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  subdomain VARCHAR(100) UNIQUE NOT NULL,
  address TEXT,
  city VARCHAR(255),
  state VARCHAR(255),
  country VARCHAR(255),
  "postalCode" VARCHAR(20),
  phone VARCHAR(20),
  email VARCHAR(255),
  "logoUrl" VARCHAR(500),
  branding JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_schools_subdomain ON schools(subdomain);
CREATE INDEX idx_schools_code ON schools(code);

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "schoolId" UUID NOT NULL REFERENCES schools(id),
  name VARCHAR(255) NOT NULL,
  section VARCHAR(50),
  grade VARCHAR(50),
  "academicYear" VARCHAR(50),
  "teacherId" UUID REFERENCES users(id),
  capacity INTEGER DEFAULT 30,
  "currentEnrollment" INTEGER DEFAULT 0,
  subjects JSONB DEFAULT '[]',
  schedule JSONB DEFAULT '[]',
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_classes_school_id ON classes("schoolId");
CREATE INDEX idx_classes_teacher_id ON classes("teacherId");

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL REFERENCES users(id),
  "classId" UUID NOT NULL REFERENCES classes(id),
  "schoolId" UUID NOT NULL REFERENCES schools(id),
  date DATE NOT NULL,
  status VARCHAR(50) NOT NULL,
  method VARCHAR(50) NOT NULL,
  "markedBy" UUID NOT NULL REFERENCES users(id),
  notes TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("studentId", "classId", date)
);

CREATE INDEX idx_attendance_student_id ON attendance("studentId");
CREATE INDEX idx_attendance_class_id ON attendance("classId");
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_school_id ON attendance("schoolId");

-- Assessments table
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "schoolId" UUID NOT NULL REFERENCES schools(id),
  "classId" UUID NOT NULL REFERENCES classes(id),
  subject VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  "maxScore" DECIMAL(10,2) NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  "dueDate" TIMESTAMP,
  rubric JSONB,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_assessments_school_id ON assessments("schoolId");
CREATE INDEX idx_assessments_class_id ON assessments("classId");

-- Grades table
CREATE TABLE IF NOT EXISTS grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL REFERENCES users(id),
  "classId" UUID NOT NULL REFERENCES classes(id),
  subject VARCHAR(255) NOT NULL,
  "assessmentId" UUID NOT NULL REFERENCES assessments(id),
  score DECIMAL(10,2) NOT NULL,
  "maxScore" DECIMAL(10,2) NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  grade VARCHAR(10) NOT NULL,
  remarks TEXT,
  "gradedBy" UUID NOT NULL REFERENCES users(id),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_grades_student_id ON grades("studentId");
CREATE INDEX idx_grades_class_id ON grades("classId");
CREATE INDEX idx_grades_assessment_id ON grades("assessmentId");

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "senderId" UUID NOT NULL REFERENCES users(id),
  "recipientId" UUID NOT NULL REFERENCES users(id),
  "schoolId" UUID NOT NULL REFERENCES schools(id),
  subject VARCHAR(255),
  content TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  "isRead" BOOLEAN DEFAULT false,
  attachments JSONB DEFAULT '[]',
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_sender_id ON messages("senderId");
CREATE INDEX idx_messages_recipient_id ON messages("recipientId");
CREATE INDEX idx_messages_school_id ON messages("schoolId");

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "schoolId" UUID NOT NULL REFERENCES schools(id),
  "studentId" UUID NOT NULL REFERENCES users(id),
  "parentId" UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) NOT NULL,
  gateway VARCHAR(50) NOT NULL,
  "transactionId" VARCHAR(255),
  "invoiceId" UUID NOT NULL,
  "dueDate" TIMESTAMP NOT NULL,
  "paidAt" TIMESTAMP,
  metadata JSONB,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payments_school_id ON payments("schoolId");
CREATE INDEX idx_payments_student_id ON payments("studentId");
CREATE INDEX idx_payments_parent_id ON payments("parentId");
CREATE INDEX idx_payments_status ON payments(status);

-- File uploads table
CREATE TABLE IF NOT EXISTS file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "schoolId" UUID NOT NULL REFERENCES schools(id),
  "uploadedBy" UUID NOT NULL REFERENCES users(id),
  "fileName" VARCHAR(255) NOT NULL,
  "originalName" VARCHAR(255) NOT NULL,
  "mimeType" VARCHAR(100) NOT NULL,
  size BIGINT NOT NULL,
  url VARCHAR(500) NOT NULL,
  "s3Key" VARCHAR(500) NOT NULL,
  bucket VARCHAR(255) NOT NULL,
  version INTEGER DEFAULT 1,
  "isPublic" BOOLEAN DEFAULT false,
  "expiresAt" TIMESTAMP,
  metadata JSONB,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_file_uploads_school_id ON file_uploads("schoolId");
CREATE INDEX idx_file_uploads_uploaded_by ON file_uploads("uploadedBy");
