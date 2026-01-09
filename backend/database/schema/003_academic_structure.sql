-- ============================================
-- ACADEMIC STRUCTURE SCHEMA
-- ============================================

-- Academic Years
CREATE TABLE IF NOT EXISTS academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g., "2024-2025"
    code VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(tenant_id, code),
    CONSTRAINT valid_dates CHECK (end_date > start_date)
);

-- Terms/Semesters
CREATE TABLE IF NOT EXISTS terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g., "Fall Semester", "Term 1"
    code VARCHAR(50) NOT NULL,
    term_number INTEGER NOT NULL, -- 1, 2, 3, etc.
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(tenant_id, academic_year_id, code),
    CONSTRAINT valid_term_dates CHECK (end_date > start_date),
    CONSTRAINT valid_term_number CHECK (term_number > 0)
);

-- Grades/Classes (Grade Levels)
CREATE TABLE IF NOT EXISTS grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g., "Grade 1", "Kindergarten"
    code VARCHAR(50) NOT NULL,
    level INTEGER NOT NULL, -- 0 = Kindergarten, 1 = Grade 1, etc.
    age_min INTEGER,
    age_max INTEGER,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(tenant_id, code)
);

-- Sections (Class Sections)
CREATE TABLE IF NOT EXISTS sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    grade_id UUID NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g., "Section A", "Section B"
    code VARCHAR(50) NOT NULL,
    capacity INTEGER DEFAULT 30,
    current_enrollment INTEGER DEFAULT 0,
    room_number VARCHAR(50),
    building VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(tenant_id, academic_year_id, grade_id, code),
    CONSTRAINT valid_capacity CHECK (capacity > 0),
    CONSTRAINT valid_enrollment CHECK (current_enrollment >= 0 AND current_enrollment <= capacity)
);

-- Subjects
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    category VARCHAR(100), -- core, elective, extracurricular
    description TEXT,
    credit_hours DECIMAL(4,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(tenant_id, code)
);

-- Curricula
CREATE TABLE IF NOT EXISTS curricula (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    version VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(tenant_id, code)
);

-- Curriculum Subjects (Many-to-Many)
CREATE TABLE IF NOT EXISTS curriculum_subjects (
    curriculum_id UUID NOT NULL REFERENCES curricula(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    grade_id UUID REFERENCES grades(id) ON DELETE CASCADE,
    is_required BOOLEAN DEFAULT true,
    credit_hours DECIMAL(4,2),
    sequence_order INTEGER,
    
    PRIMARY KEY (curriculum_id, subject_id, grade_id)
);

-- Timetables
CREATE TABLE IF NOT EXISTS timetables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    term_id UUID REFERENCES terms(id) ON DELETE CASCADE,
    name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Timetable Periods
CREATE TABLE IF NOT EXISTS timetable_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timetable_id UUID NOT NULL REFERENCES timetables(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL, -- 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    period_number INTEGER NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
    room_number VARCHAR(50),
    building VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    
    CONSTRAINT valid_day CHECK (day_of_week BETWEEN 0 AND 6),
    CONSTRAINT valid_period CHECK (period_number > 0),
    CONSTRAINT valid_time CHECK (end_time > start_time)
);

-- Class Assignments (Teacher-Section-Subject assignments)
CREATE TABLE IF NOT EXISTS class_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    term_id UUID REFERENCES terms(id) ON DELETE CASCADE,
    is_primary_teacher BOOLEAN DEFAULT false,
    assigned_at TIMESTAMP DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(section_id, subject_id, teacher_id, academic_year_id, term_id)
);

-- Indexes for Academic Structure
CREATE INDEX idx_academic_years_tenant_id ON academic_years(tenant_id);
CREATE INDEX idx_academic_years_is_current ON academic_years(is_current);
CREATE INDEX idx_academic_years_start_date ON academic_years(start_date);

CREATE INDEX idx_terms_tenant_id ON terms(tenant_id);
CREATE INDEX idx_terms_academic_year_id ON terms(academic_year_id);
CREATE INDEX idx_terms_is_current ON terms(is_current);

CREATE INDEX idx_grades_tenant_id ON grades(tenant_id);
CREATE INDEX idx_grades_level ON grades(level);

CREATE INDEX idx_sections_tenant_id ON sections(tenant_id);
CREATE INDEX idx_sections_academic_year_id ON sections(academic_year_id);
CREATE INDEX idx_sections_grade_id ON sections(grade_id);

CREATE INDEX idx_subjects_tenant_id ON subjects(tenant_id);
CREATE INDEX idx_subjects_category ON subjects(category);

CREATE INDEX idx_curricula_tenant_id ON curricula(tenant_id);
CREATE INDEX idx_curriculum_subjects_curriculum_id ON curriculum_subjects(curriculum_id);
CREATE INDEX idx_curriculum_subjects_subject_id ON curriculum_subjects(subject_id);

CREATE INDEX idx_timetables_tenant_id ON timetables(tenant_id);
CREATE INDEX idx_timetables_section_id ON timetables(section_id);
CREATE INDEX idx_timetable_periods_timetable_id ON timetable_periods(timetable_id);
CREATE INDEX idx_timetable_periods_day_of_week ON timetable_periods(day_of_week);
CREATE INDEX idx_timetable_periods_teacher_id ON timetable_periods(teacher_id);

CREATE INDEX idx_class_assignments_tenant_id ON class_assignments(tenant_id);
CREATE INDEX idx_class_assignments_section_id ON class_assignments(section_id);
CREATE INDEX idx_class_assignments_subject_id ON class_assignments(subject_id);
CREATE INDEX idx_class_assignments_teacher_id ON class_assignments(teacher_id);
CREATE INDEX idx_class_assignments_academic_year_id ON class_assignments(academic_year_id);
