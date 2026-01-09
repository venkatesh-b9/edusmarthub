-- ============================================
-- ASSESSMENT SYSTEM SCHEMA
-- ============================================

-- Assessment Types
CREATE TABLE IF NOT EXISTS assessment_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    default_weight DECIMAL(5,2) DEFAULT 0, -- Percentage weight in final grade
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(tenant_id, code)
);

-- Assessments
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    term_id UUID REFERENCES terms(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Assessment Details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assessment_type_id UUID NOT NULL REFERENCES assessment_types(id) ON DELETE CASCADE,
    assessment_type_code VARCHAR(50), -- exam, quiz, assignment, project, participation
    
    -- Scoring
    max_score DECIMAL(10,2) NOT NULL,
    passing_score DECIMAL(10,2),
    weight DECIMAL(5,2) NOT NULL, -- Percentage weight
    is_graded BOOLEAN DEFAULT true,
    
    -- Dates
    assigned_date DATE NOT NULL,
    due_date DATE,
    start_date TIMESTAMP, -- For timed assessments
    end_date TIMESTAMP,
    graded_date DATE,
    
    -- Settings
    allow_late_submission BOOLEAN DEFAULT false,
    late_penalty_percentage DECIMAL(5,2) DEFAULT 0,
    time_limit_minutes INTEGER, -- For timed assessments
    attempts_allowed INTEGER DEFAULT 1,
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft', -- draft, published, in_progress, completed, cancelled
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT valid_status CHECK (status IN ('draft', 'published', 'in_progress', 'completed', 'cancelled')),
    CONSTRAINT valid_weight CHECK (weight >= 0 AND weight <= 100)
);

-- Assessment Rubrics
CREATE TABLE IF NOT EXISTS assessment_rubrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    
    -- Rubric Structure
    rubric_data JSONB NOT NULL, -- Flexible rubric structure
    total_points DECIMAL(10,2),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(assessment_id)
);

-- Student Grades
CREATE TABLE IF NOT EXISTS student_grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    term_id UUID REFERENCES terms(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    
    -- Grade Details
    score DECIMAL(10,2) NOT NULL,
    max_score DECIMAL(10,2) NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    letter_grade VARCHAR(10),
    grade_points DECIMAL(4,2),
    
    -- Submission
    submitted_at TIMESTAMP,
    graded_at TIMESTAMP,
    graded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Late Submission
    is_late BOOLEAN DEFAULT false,
    late_penalty_applied DECIMAL(5,2) DEFAULT 0,
    original_score DECIMAL(10,2),
    
    -- Rubric Scores
    rubric_scores JSONB,
    
    -- Feedback
    teacher_feedback TEXT,
    student_notes TEXT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, submitted, graded, returned
    is_excused BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT valid_percentage CHECK (percentage >= 0 AND percentage <= 100),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'submitted', 'graded', 'returned', 'excused'))
) PARTITION BY RANGE (created_at);

-- Create partitions for student_grades (monthly partitions)
CREATE TABLE IF NOT EXISTS student_grades_2024_01 PARTITION OF student_grades
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE IF NOT EXISTS student_grades_2024_02 PARTITION OF student_grades
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Grade Components (Breakdown of final grade)
CREATE TABLE IF NOT EXISTS grade_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    term_id UUID REFERENCES terms(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    
    -- Component Details
    component_type VARCHAR(100) NOT NULL, -- exam, quiz, assignment, project, participation, homework
    component_name VARCHAR(255),
    total_score DECIMAL(10,2) NOT NULL,
    earned_score DECIMAL(10,2) NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    weight DECIMAL(5,2) NOT NULL,
    weighted_score DECIMAL(10,2),
    
    -- Metadata
    calculated_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(student_id, academic_year_id, term_id, subject_id, component_type)
);

-- Transcripts
CREATE TABLE IF NOT EXISTS transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    
    -- Transcript Details
    transcript_type VARCHAR(50) DEFAULT 'official', -- official, unofficial, progress
    cumulative_gpa DECIMAL(4,2),
    term_gpa DECIMAL(4,2),
    total_credits DECIMAL(5,2),
    earned_credits DECIMAL(5,2),
    
    -- Status
    is_official BOOLEAN DEFAULT false,
    issued_date DATE,
    issued_by UUID REFERENCES users(id),
    
    -- File
    file_url VARCHAR(500),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(student_id, academic_year_id, transcript_type)
);

-- Progress Reports
CREATE TABLE IF NOT EXISTS progress_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    term_id UUID REFERENCES terms(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    
    -- Report Details
    report_type VARCHAR(50) DEFAULT 'standard', -- standard, detailed, summary
    overall_grade VARCHAR(10),
    overall_percentage DECIMAL(5,2),
    rank INTEGER,
    total_students INTEGER,
    
    -- Subject-wise Performance
    subject_performance JSONB DEFAULT '[]',
    
    -- Comments
    teacher_comments TEXT,
    principal_comments TEXT,
    parent_acknowledgment BOOLEAN DEFAULT false,
    parent_acknowledged_at TIMESTAMP,
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft', -- draft, published, acknowledged
    published_at TIMESTAMP,
    published_by UUID REFERENCES users(id),
    
    -- File
    file_url VARCHAR(500),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(student_id, academic_year_id, term_id)
);

-- Indexes for Assessment System
CREATE INDEX idx_assessment_types_tenant_id ON assessment_types(tenant_id);
CREATE INDEX idx_assessment_types_code ON assessment_types(code);

CREATE INDEX idx_assessments_tenant_id ON assessments(tenant_id);
CREATE INDEX idx_assessments_academic_year_id ON assessments(academic_year_id);
CREATE INDEX idx_assessments_section_id ON assessments(section_id);
CREATE INDEX idx_assessments_subject_id ON assessments(subject_id);
CREATE INDEX idx_assessments_teacher_id ON assessments(teacher_id);
CREATE INDEX idx_assessments_status ON assessments(status);
CREATE INDEX idx_assessments_due_date ON assessments(due_date);

CREATE INDEX idx_student_grades_student_id ON student_grades(student_id);
CREATE INDEX idx_student_grades_tenant_id ON student_grades(tenant_id);
CREATE INDEX idx_student_grades_assessment_id ON student_grades(assessment_id);
CREATE INDEX idx_student_grades_academic_year_id ON student_grades(academic_year_id);
CREATE INDEX idx_student_grades_subject_id ON student_grades(subject_id);
CREATE INDEX idx_student_grades_status ON student_grades(status);
CREATE INDEX idx_student_grades_percentage ON student_grades(percentage);

CREATE INDEX idx_grade_components_student_id ON grade_components(student_id);
CREATE INDEX idx_grade_components_academic_year_id ON grade_components(academic_year_id);
CREATE INDEX idx_grade_components_subject_id ON grade_components(subject_id);

CREATE INDEX idx_transcripts_student_id ON transcripts(student_id);
CREATE INDEX idx_transcripts_academic_year_id ON transcripts(academic_year_id);

CREATE INDEX idx_progress_reports_student_id ON progress_reports(student_id);
CREATE INDEX idx_progress_reports_academic_year_id ON progress_reports(academic_year_id);
CREATE INDEX idx_progress_reports_term_id ON progress_reports(term_id);
CREATE INDEX idx_progress_reports_status ON progress_reports(status);
