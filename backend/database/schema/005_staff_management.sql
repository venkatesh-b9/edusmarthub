-- ============================================
-- STAFF MANAGEMENT SCHEMA
-- ============================================

-- Teachers Table
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Teacher Information
    employee_number VARCHAR(50) NOT NULL,
    employee_id VARCHAR(50),
    hire_date DATE,
    employment_type VARCHAR(50) DEFAULT 'full_time', -- full_time, part_time, contract, substitute
    
    -- Qualifications
    qualification VARCHAR(255),
    specialization TEXT[],
    certifications TEXT[],
    years_of_experience INTEGER,
    
    -- Department/Subject Area
    department VARCHAR(100),
    subject_area VARCHAR(255),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    termination_date DATE,
    termination_reason TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,
    
    UNIQUE(tenant_id, employee_number),
    CONSTRAINT valid_employment_type CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'substitute'))
);

-- Teacher Subject Expertise
CREATE TABLE IF NOT EXISTS teacher_subject_expertise (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    expertise_level VARCHAR(50) DEFAULT 'intermediate', -- beginner, intermediate, advanced, expert
    years_teaching INTEGER DEFAULT 0,
    is_primary_subject BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(teacher_id, subject_id)
);

-- Teacher Assignments (Historical)
CREATE TABLE IF NOT EXISTS teacher_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    term_id UUID REFERENCES terms(id) ON DELETE CASCADE,
    
    -- Assignment Details
    assignment_type VARCHAR(50) DEFAULT 'teaching', -- teaching, substitute, assistant
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    assigned_at TIMESTAMP DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Teacher Attendance
CREATE TABLE IF NOT EXISTS teacher_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Attendance Details
    date DATE NOT NULL,
    status VARCHAR(50) NOT NULL, -- present, absent, late, leave, sick
    check_in_time TIME,
    check_out_time TIME,
    method VARCHAR(50) DEFAULT 'manual', -- manual, biometric, rfid
    marked_at TIMESTAMP DEFAULT NOW(),
    marked_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Leave Information
    leave_type VARCHAR(50), -- sick, personal, vacation, other
    leave_reason TEXT,
    is_approved BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    
    -- Notes
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT valid_status CHECK (status IN ('present', 'absent', 'late', 'leave', 'sick')),
    UNIQUE(teacher_id, date)
) PARTITION BY RANGE (date);

-- Create partitions for teacher_attendance (monthly partitions)
CREATE TABLE IF NOT EXISTS teacher_attendance_2024_01 PARTITION OF teacher_attendance
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE IF NOT EXISTS teacher_attendance_2024_02 PARTITION OF teacher_attendance
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Teacher Performance
CREATE TABLE IF NOT EXISTS teacher_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    term_id UUID REFERENCES terms(id) ON DELETE CASCADE,
    
    -- Performance Metrics
    student_satisfaction_score DECIMAL(4,2), -- 1-5 scale
    peer_review_score DECIMAL(4,2),
    supervisor_rating DECIMAL(4,2),
    overall_rating DECIMAL(4,2),
    
    -- Teaching Metrics
    classes_taught INTEGER DEFAULT 0,
    students_taught INTEGER DEFAULT 0,
    average_student_performance DECIMAL(5,2),
    attendance_rate DECIMAL(5,2),
    
    -- Professional Development
    training_hours DECIMAL(5,2) DEFAULT 0,
    certifications_earned INTEGER DEFAULT 0,
    
    -- Evaluation
    evaluation_date DATE,
    evaluated_by UUID REFERENCES users(id),
    evaluation_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(teacher_id, academic_year_id, term_id)
);

-- Staff Members (Non-teaching staff)
CREATE TABLE IF NOT EXISTS staff_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Staff Information
    employee_number VARCHAR(50) NOT NULL,
    employee_id VARCHAR(50),
    hire_date DATE,
    employment_type VARCHAR(50) DEFAULT 'full_time',
    
    -- Department
    department VARCHAR(100) NOT NULL, -- administration, maintenance, security, cafeteria, etc.
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    termination_date DATE,
    termination_reason TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,
    
    UNIQUE(tenant_id, employee_number)
);

-- Staff Roles
CREATE TABLE IF NOT EXISTS staff_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_member_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
    role_name VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for Staff Management
CREATE INDEX idx_teachers_tenant_id ON teachers(tenant_id);
CREATE INDEX idx_teachers_user_id ON teachers(user_id);
CREATE INDEX idx_teachers_employee_number ON teachers(employee_number);
CREATE INDEX idx_teachers_is_active ON teachers(is_active);
CREATE INDEX idx_teachers_department ON teachers(department);

CREATE INDEX idx_teacher_subject_expertise_teacher_id ON teacher_subject_expertise(teacher_id);
CREATE INDEX idx_teacher_subject_expertise_subject_id ON teacher_subject_expertise(subject_id);

CREATE INDEX idx_teacher_assignments_teacher_id ON teacher_assignments(teacher_id);
CREATE INDEX idx_teacher_assignments_section_id ON teacher_assignments(section_id);
CREATE INDEX idx_teacher_assignments_subject_id ON teacher_assignments(subject_id);
CREATE INDEX idx_teacher_assignments_academic_year_id ON teacher_assignments(academic_year_id);

CREATE INDEX idx_teacher_attendance_teacher_id ON teacher_attendance(teacher_id);
CREATE INDEX idx_teacher_attendance_tenant_id ON teacher_attendance(tenant_id);
CREATE INDEX idx_teacher_attendance_date ON teacher_attendance(date);
CREATE INDEX idx_teacher_attendance_status ON teacher_attendance(status);

CREATE INDEX idx_teacher_performance_teacher_id ON teacher_performance(teacher_id);
CREATE INDEX idx_teacher_performance_academic_year_id ON teacher_performance(academic_year_id);

CREATE INDEX idx_staff_members_tenant_id ON staff_members(tenant_id);
CREATE INDEX idx_staff_members_user_id ON staff_members(user_id);
CREATE INDEX idx_staff_members_department ON staff_members(department);
CREATE INDEX idx_staff_members_is_active ON staff_members(is_active);

CREATE INDEX idx_staff_roles_staff_member_id ON staff_roles(staff_member_id);
