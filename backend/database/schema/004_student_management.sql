-- ============================================
-- STUDENT MANAGEMENT SCHEMA
-- ============================================

-- Students Table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Student Information
    student_number VARCHAR(50) NOT NULL,
    admission_number VARCHAR(50),
    admission_date DATE,
    
    -- Academic Information
    current_section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
    current_grade_id UUID REFERENCES grades(id) ON DELETE SET NULL,
    current_academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL,
    enrollment_status VARCHAR(50) DEFAULT 'active', -- active, graduated, transferred, dropped, suspended
    
    -- Personal Information (if not linked to user)
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    date_of_birth DATE,
    gender VARCHAR(20),
    nationality VARCHAR(100),
    
    -- Contact Information
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    
    -- Additional Information
    blood_group VARCHAR(10),
    allergies TEXT[],
    medical_conditions TEXT[],
    special_needs TEXT[],
    transportation_mode VARCHAR(50), -- bus, car, walk, other
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    graduation_date DATE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,
    
    UNIQUE(tenant_id, student_number),
    CONSTRAINT valid_enrollment_status CHECK (enrollment_status IN ('active', 'graduated', 'transferred', 'dropped', 'suspended'))
);

-- Student Academic Records
CREATE TABLE IF NOT EXISTS student_academic_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    term_id UUID REFERENCES terms(id) ON DELETE CASCADE,
    section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
    
    -- Academic Performance
    total_credits DECIMAL(5,2) DEFAULT 0,
    earned_credits DECIMAL(5,2) DEFAULT 0,
    gpa DECIMAL(4,2),
    cumulative_gpa DECIMAL(4,2),
    rank INTEGER,
    total_students INTEGER,
    
    -- Attendance Summary
    total_days INTEGER DEFAULT 0,
    present_days INTEGER DEFAULT 0,
    absent_days INTEGER DEFAULT 0,
    late_days INTEGER DEFAULT 0,
    attendance_percentage DECIMAL(5,2),
    
    -- Status
    promotion_status VARCHAR(50), -- promoted, retained, conditional
    remarks TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(student_id, academic_year_id, term_id)
);

-- Student Attendance
CREATE TABLE IF NOT EXISTS student_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    term_id UUID REFERENCES terms(id) ON DELETE CASCADE,
    
    -- Attendance Details
    date DATE NOT NULL,
    status VARCHAR(50) NOT NULL, -- present, absent, late, excused, half_day
    method VARCHAR(50) DEFAULT 'manual', -- manual, biometric, rfid, facial_recognition
    marked_at TIMESTAMP DEFAULT NOW(),
    marked_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Additional Information
    arrival_time TIME,
    departure_time TIME,
    notes TEXT,
    is_regularized BOOLEAN DEFAULT false,
    regularized_at TIMESTAMP,
    regularized_by UUID REFERENCES users(id),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT valid_status CHECK (status IN ('present', 'absent', 'late', 'excused', 'half_day')),
    CONSTRAINT valid_method CHECK (method IN ('manual', 'biometric', 'rfid', 'facial_recognition')),
    UNIQUE(student_id, section_id, date)
) PARTITION BY RANGE (date);

-- Create partitions for student_attendance (monthly partitions)
CREATE TABLE IF NOT EXISTS student_attendance_2024_01 PARTITION OF student_attendance
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE IF NOT EXISTS student_attendance_2024_02 PARTITION OF student_attendance
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
-- Add more partitions as needed

-- Student Performance
CREATE TABLE IF NOT EXISTS student_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    term_id UUID REFERENCES terms(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    
    -- Performance Metrics
    average_score DECIMAL(5,2),
    total_assessments INTEGER DEFAULT 0,
    completed_assessments INTEGER DEFAULT 0,
    participation_score DECIMAL(5,2),
    homework_completion_rate DECIMAL(5,2),
    
    -- Trends
    improvement_trend VARCHAR(50), -- improving, stable, declining
    performance_category VARCHAR(50), -- excellent, good, average, needs_improvement
    
    -- Metadata
    calculated_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(student_id, academic_year_id, term_id, subject_id)
);

-- Student Health Records
CREATE TABLE IF NOT EXISTS student_health_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Health Information
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    bmi DECIMAL(4,2),
    blood_group VARCHAR(10),
    blood_pressure VARCHAR(20),
    vision_left VARCHAR(20),
    vision_right VARCHAR(20),
    hearing_status VARCHAR(50),
    
    -- Medical Information
    allergies TEXT[],
    medical_conditions TEXT[],
    medications TEXT[],
    dietary_restrictions TEXT[],
    physical_limitations TEXT[],
    
    -- Emergency Medical Information
    doctor_name VARCHAR(255),
    doctor_phone VARCHAR(20),
    insurance_provider VARCHAR(255),
    insurance_policy_number VARCHAR(100),
    
    -- Vaccination Records
    vaccination_records JSONB DEFAULT '[]',
    
    -- Notes
    medical_notes TEXT,
    
    -- Metadata
    recorded_at TIMESTAMP DEFAULT NOW(),
    recorded_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(student_id)
);

-- Student Guardians (Parents/Guardians)
CREATE TABLE IF NOT EXISTS student_guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    guardian_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Guardian Information (if not a user)
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    relationship VARCHAR(50) NOT NULL, -- father, mother, guardian, other
    email VARCHAR(255),
    phone VARCHAR(20),
    alternate_phone VARCHAR(20),
    
    -- Address
    address TEXT,
    city VARCHAR(255),
    state VARCHAR(255),
    country VARCHAR(255),
    postal_code VARCHAR(20),
    
    -- Status
    is_primary BOOLEAN DEFAULT false,
    is_emergency_contact BOOLEAN DEFAULT false,
    can_pickup BOOLEAN DEFAULT true,
    receives_notifications BOOLEAN DEFAULT true,
    
    -- Employment
    occupation VARCHAR(255),
    employer VARCHAR(255),
    work_phone VARCHAR(20),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT valid_relationship CHECK (relationship IN ('father', 'mother', 'guardian', 'grandfather', 'grandmother', 'uncle', 'aunt', 'other'))
);

-- Student Documents
CREATE TABLE IF NOT EXISTS student_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Document Information
    document_type VARCHAR(100) NOT NULL, -- birth_certificate, transcript, medical_report, etc.
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),
    
    -- Status
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMP,
    verified_by UUID REFERENCES users(id),
    
    -- Metadata
    uploaded_at TIMESTAMP DEFAULT NOW(),
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for Student Management
CREATE INDEX idx_students_tenant_id ON students(tenant_id);
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_student_number ON students(student_number);
CREATE INDEX idx_students_current_section_id ON students(current_section_id);
CREATE INDEX idx_students_enrollment_status ON students(enrollment_status);
CREATE INDEX idx_students_is_active ON students(is_active);

CREATE INDEX idx_student_academic_records_student_id ON student_academic_records(student_id);
CREATE INDEX idx_student_academic_records_academic_year_id ON student_academic_records(academic_year_id);
CREATE INDEX idx_student_academic_records_term_id ON student_academic_records(term_id);

CREATE INDEX idx_student_attendance_student_id ON student_attendance(student_id);
CREATE INDEX idx_student_attendance_tenant_id ON student_attendance(tenant_id);
CREATE INDEX idx_student_attendance_section_id ON student_attendance(section_id);
CREATE INDEX idx_student_attendance_date ON student_attendance(date);
CREATE INDEX idx_student_attendance_status ON student_attendance(status);
CREATE INDEX idx_student_attendance_academic_year_id ON student_attendance(academic_year_id);

CREATE INDEX idx_student_performance_student_id ON student_performance(student_id);
CREATE INDEX idx_student_performance_academic_year_id ON student_performance(academic_year_id);
CREATE INDEX idx_student_performance_subject_id ON student_performance(subject_id);

CREATE INDEX idx_student_health_records_student_id ON student_health_records(student_id);
CREATE INDEX idx_student_guardians_student_id ON student_guardians(student_id);
CREATE INDEX idx_student_guardians_guardian_user_id ON student_guardians(guardian_user_id);
CREATE INDEX idx_student_guardians_is_primary ON student_guardians(is_primary);

CREATE INDEX idx_student_documents_student_id ON student_documents(student_id);
CREATE INDEX idx_student_documents_document_type ON student_documents(document_type);
CREATE INDEX idx_student_documents_is_verified ON student_documents(is_verified);
