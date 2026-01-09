-- ============================================
-- TIMETABLE SYSTEM SCHEMA
-- ============================================

-- School Timing Configuration
CREATE TABLE IF NOT EXISTS school_timings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    
    -- Basic Timing
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    period_duration_minutes INTEGER NOT NULL DEFAULT 45,
    total_periods INTEGER NOT NULL DEFAULT 8,
    
    -- School Days (bitmask: 1=Sunday, 2=Monday, 4=Tuesday, 8=Wednesday, 16=Thursday, 32=Friday, 64=Saturday)
    school_days INTEGER NOT NULL DEFAULT 62, -- Monday-Saturday by default
    
    -- Shift Configuration
    shift_name VARCHAR(100), -- Morning, Afternoon, Evening
    shift_number INTEGER DEFAULT 1,
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(tenant_id, academic_year_id, shift_number),
    CONSTRAINT valid_period_duration CHECK (period_duration_minutes > 0),
    CONSTRAINT valid_total_periods CHECK (total_periods > 0),
    CONSTRAINT valid_time CHECK (end_time > start_time)
);

-- Break Schedule
CREATE TABLE IF NOT EXISTS break_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    school_timing_id UUID NOT NULL REFERENCES school_timings(id) ON DELETE CASCADE,
    
    -- Break Details
    name VARCHAR(255) NOT NULL, -- Morning Break, Lunch Break, etc.
    break_type VARCHAR(50) NOT NULL DEFAULT 'break', -- break, activity, special_period, assembly
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (end_time - start_time)) / 60
    ) STORED,
    
    -- Days (bitmask like school_days)
    days INTEGER NOT NULL DEFAULT 62, -- All school days by default
    
    -- Special Settings
    is_optional BOOLEAN DEFAULT false,
    requires_attendance BOOLEAN DEFAULT false,
    location VARCHAR(255),
    
    -- Metadata
    sequence_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT valid_break_time CHECK (end_time > start_time),
    CONSTRAINT valid_break_type CHECK (break_type IN ('break', 'activity', 'special_period', 'assembly'))
);

-- Timetable Versions (for version control)
CREATE TABLE IF NOT EXISTS timetable_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timetable_id UUID NOT NULL REFERENCES timetables(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    name VARCHAR(255),
    description TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP,
    
    UNIQUE(timetable_id, version_number)
);

-- Timetable Templates
CREATE TABLE IF NOT EXISTS timetable_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_type VARCHAR(50) NOT NULL DEFAULT 'weekly', -- weekly, exam, summer_camp, hybrid
    
    -- Template Configuration
    school_timing_id UUID REFERENCES school_timings(id) ON DELETE SET NULL,
    period_structure JSONB, -- Custom period structure
    break_structure JSONB, -- Custom break structure
    
    -- Usage
    is_default BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    CONSTRAINT valid_template_type CHECK (template_type IN ('weekly', 'exam', 'summer_camp', 'hybrid', 'custom'))
);

-- Teacher Availability
CREATE TABLE IF NOT EXISTS teacher_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    
    -- Availability Window
    day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, ..., 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Constraints
    max_periods_per_day INTEGER,
    max_periods_per_week INTEGER,
    preferred_time_slots JSONB, -- Array of preferred time ranges
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT valid_availability_day CHECK (day_of_week BETWEEN 0 AND 6),
    CONSTRAINT valid_availability_time CHECK (end_time > start_time)
);

-- Room/Lab Management
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Room Details
    room_number VARCHAR(50) NOT NULL,
    building VARCHAR(100),
    floor INTEGER,
    room_type VARCHAR(50) NOT NULL DEFAULT 'classroom', -- classroom, lab, library, auditorium, gym, etc.
    capacity INTEGER,
    
    -- Special Features
    has_projector BOOLEAN DEFAULT false,
    has_computer_lab BOOLEAN DEFAULT false,
    has_science_lab BOOLEAN DEFAULT false,
    special_equipment TEXT[],
    
    -- Availability
    is_available BOOLEAN DEFAULT true,
    maintenance_schedule JSONB, -- Maintenance windows
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(tenant_id, room_number, building)
);

-- Room Bookings (for timetable periods)
CREATE TABLE IF NOT EXISTS room_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    timetable_period_id UUID REFERENCES timetable_periods(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Booking Details
    booking_date DATE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    day_of_week INTEGER,
    
    -- Booking Type
    booking_type VARCHAR(50) DEFAULT 'regular', -- regular, maintenance, special_event, exam
    reason TEXT,
    
    -- Status
    is_confirmed BOOLEAN DEFAULT true,
    cancelled_at TIMESTAMP,
    cancelled_by UUID REFERENCES users(id),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT valid_booking_day CHECK (day_of_week IS NULL OR (day_of_week BETWEEN 0 AND 6)),
    CONSTRAINT valid_booking_time CHECK (end_time > start_time)
);

-- Timetable Conflicts
CREATE TABLE IF NOT EXISTS timetable_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    timetable_id UUID REFERENCES timetables(id) ON DELETE CASCADE,
    
    -- Conflict Details
    conflict_type VARCHAR(50) NOT NULL, -- teacher_overlap, room_double_booking, subject_concentration, teacher_overwork, special_needs_violation
    severity VARCHAR(20) NOT NULL DEFAULT 'warning', -- info, warning, error, critical
    
    -- Affected Entities
    affected_teacher_id UUID REFERENCES users(id),
    affected_section_id UUID REFERENCES sections(id),
    affected_subiod_id UUID REFERENCES timetable_periods(id),
    affected_room_id UUID REFERENCES rooms(id),
    
    -- Conflict Data
    conflict_data JSONB, -- Detailed conflict information
    conflicting_periods UUID[], -- Array of conflicting period IDs
    
    -- Resolution
    is_resolved BOOLEAN DEFAULT false,
    resolution_notes TEXT,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP,
    
    -- Metadata
    detected_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT valid_conflict_type CHECK (conflict_type IN (
        'teacher_overlap', 'room_double_booking', 'subject_concentration', 
        'teacher_overwork', 'special_needs_violation', 'break_violation', 
        'availability_violation', 'capacity_exceeded'
    )),
    CONSTRAINT valid_severity CHECK (severity IN ('info', 'warning', 'error', 'critical'))
);

-- Substitute Teacher Management
CREATE TABLE IF NOT EXISTS substitute_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    original_teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    substitute_teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    timetable_period_id UUID NOT NULL REFERENCES timetable_periods(id) ON DELETE CASCADE,
    
    -- Assignment Details
    start_date DATE NOT NULL,
    end_date DATE,
    reason VARCHAR(255), -- leave, sick, training, etc.
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, active, completed, cancelled
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    
    -- Notification
    notification_sent BOOLEAN DEFAULT false,
    notification_sent_at TIMESTAMP,
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT valid_substitute_status CHECK (status IN ('pending', 'approved', 'active', 'completed', 'cancelled')),
    CONSTRAINT valid_substitute_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Timetable Notifications Queue
CREATE TABLE IF NOT EXISTS timetable_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification Details
    notification_type VARCHAR(50) NOT NULL, -- daily_schedule, period_reminder, change_alert, weekly_summary, emergency_update
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_data JSONB, -- Additional data for the notification
    
    -- Delivery Channels
    channels TEXT[] NOT NULL DEFAULT ARRAY['in_app'], -- in_app, email, sms, push, whatsapp
    delivery_status JSONB DEFAULT '{}', -- Status for each channel
    
    -- Scheduling
    scheduled_for TIMESTAMP,
    sent_at TIMESTAMP,
    read_at TIMESTAMP,
    
    -- Priority
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT valid_notification_type CHECK (notification_type IN (
        'daily_schedule', 'period_reminder', 'change_alert', 
        'weekly_summary', 'emergency_update', 'substitute_assignment', 
        'conflict_alert', 'timetable_published'
    )),
    CONSTRAINT valid_priority CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

-- Timetable Generation Logs
CREATE TABLE IF NOT EXISTS timetable_generation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    generated_by UUID NOT NULL REFERENCES users(id),
    
    -- Generation Details
    generation_mode VARCHAR(50) NOT NULL, -- manual, balanced, optimized, minimal_conflicts
    target_sections UUID[], -- Array of section IDs
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    term_id UUID REFERENCES terms(id) ON DELETE CASCADE,
    
    -- Constraints Used
    constraints JSONB, -- Constraints applied during generation
    optimization_settings JSONB, -- Optimization preferences
    
    -- Results
    status VARCHAR(50) NOT NULL, -- in_progress, completed, failed, cancelled
    conflicts_detected INTEGER DEFAULT 0,
    conflicts_resolved INTEGER DEFAULT 0,
    generation_time_seconds DECIMAL(10,2),
    
    -- Output
    generated_timetables UUID[], -- Array of generated timetable IDs
    error_message TEXT,
    
    -- Metadata
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT valid_generation_mode CHECK (generation_mode IN ('manual', 'balanced', 'optimized', 'minimal_conflicts', 'ai_powered')),
    CONSTRAINT valid_generation_status CHECK (status IN ('in_progress', 'completed', 'failed', 'cancelled'))
);

-- Timetable Statistics
CREATE TABLE IF NOT EXISTS timetable_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timetable_id UUID NOT NULL REFERENCES timetables(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Statistics
    total_periods INTEGER DEFAULT 0,
    filled_periods INTEGER DEFAULT 0,
    empty_periods INTEGER DEFAULT 0,
    total_teachers INTEGER DEFAULT 0,
    total_subjects INTEGER DEFAULT 0,
    total_rooms INTEGER DEFAULT 0,
    
    -- Workload Distribution
    teacher_workload JSONB, -- Teacher ID -> periods count
    subject_distribution JSONB, -- Subject ID -> periods count
    room_utilization JSONB, -- Room ID -> utilization percentage
    
    -- Quality Metrics
    conflict_count INTEGER DEFAULT 0,
    average_teacher_periods_per_day DECIMAL(5,2),
    subject_balance_score DECIMAL(5,2), -- How well subjects are distributed
    
    -- Metadata
    calculated_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(timetable_id)
);

-- Indexes for Timetable System
CREATE INDEX idx_school_timings_tenant_id ON school_timings(tenant_id);
CREATE INDEX idx_school_timings_academic_year_id ON school_timings(academic_year_id);
CREATE INDEX idx_school_timings_is_active ON school_timings(is_active);

CREATE INDEX idx_break_schedules_tenant_id ON break_schedules(tenant_id);
CREATE INDEX idx_break_schedules_school_timing_id ON break_schedules(school_timing_id);
CREATE INDEX idx_break_schedules_is_active ON break_schedules(is_active);

CREATE INDEX idx_timetable_versions_timetable_id ON timetable_versions(timetable_id);
CREATE INDEX idx_timetable_versions_is_published ON timetable_versions(is_published);

CREATE INDEX idx_timetable_templates_tenant_id ON timetable_templates(tenant_id);
CREATE INDEX idx_timetable_templates_template_type ON timetable_templates(template_type);
CREATE INDEX idx_timetable_templates_is_default ON timetable_templates(is_default);

CREATE INDEX idx_teacher_availability_teacher_id ON teacher_availability(teacher_id);
CREATE INDEX idx_teacher_availability_tenant_id ON teacher_availability(tenant_id);
CREATE INDEX idx_teacher_availability_academic_year_id ON teacher_availability(academic_year_id);
CREATE INDEX idx_teacher_availability_day_of_week ON teacher_availability(day_of_week);

CREATE INDEX idx_rooms_tenant_id ON rooms(tenant_id);
CREATE INDEX idx_rooms_room_type ON rooms(room_type);
CREATE INDEX idx_rooms_is_available ON rooms(is_available);

CREATE INDEX idx_room_bookings_room_id ON room_bookings(room_id);
CREATE INDEX idx_room_bookings_timetable_period_id ON room_bookings(timetable_period_id);
CREATE INDEX idx_room_bookings_tenant_id ON room_bookings(tenant_id);
CREATE INDEX idx_room_bookings_booking_date ON room_bookings(booking_date);
CREATE INDEX idx_room_bookings_day_of_week ON room_bookings(day_of_week);

CREATE INDEX idx_timetable_conflicts_tenant_id ON timetable_conflicts(tenant_id);
CREATE INDEX idx_timetable_conflicts_timetable_id ON timetable_conflicts(timetable_id);
CREATE INDEX idx_timetable_conflicts_conflict_type ON timetable_conflicts(conflict_type);
CREATE INDEX idx_timetable_conflicts_severity ON timetable_conflicts(severity);
CREATE INDEX idx_timetable_conflicts_is_resolved ON timetable_conflicts(is_resolved);
CREATE INDEX idx_timetable_conflicts_affected_teacher_id ON timetable_conflicts(affected_teacher_id);

CREATE INDEX idx_substitute_assignments_tenant_id ON substitute_assignments(tenant_id);
CREATE INDEX idx_substitute_assignments_original_teacher_id ON substitute_assignments(original_teacher_id);
CREATE INDEX idx_substitute_assignments_substitute_teacher_id ON substitute_assignments(substitute_teacher_id);
CREATE INDEX idx_substitute_assignments_timetable_period_id ON substitute_assignments(timetable_period_id);
CREATE INDEX idx_substitute_assignments_status ON substitute_assignments(status);
CREATE INDEX idx_substitute_assignments_start_date ON substitute_assignments(start_date);

CREATE INDEX idx_timetable_notifications_tenant_id ON timetable_notifications(tenant_id);
CREATE INDEX idx_timetable_notifications_recipient_id ON timetable_notifications(recipient_id);
CREATE INDEX idx_timetable_notifications_notification_type ON timetable_notifications(notification_type);
CREATE INDEX idx_timetable_notifications_scheduled_for ON timetable_notifications(scheduled_for);
CREATE INDEX idx_timetable_notifications_sent_at ON timetable_notifications(sent_at);
CREATE INDEX idx_timetable_notifications_read_at ON timetable_notifications(read_at);

CREATE INDEX idx_timetable_generation_logs_tenant_id ON timetable_generation_logs(tenant_id);
CREATE INDEX idx_timetable_generation_logs_generated_by ON timetable_generation_logs(generated_by);
CREATE INDEX idx_timetable_generation_logs_status ON timetable_generation_logs(status);
CREATE INDEX idx_timetable_generation_logs_academic_year_id ON timetable_generation_logs(academic_year_id);

CREATE INDEX idx_timetable_statistics_timetable_id ON timetable_statistics(timetable_id);
CREATE INDEX idx_timetable_statistics_tenant_id ON timetable_statistics(tenant_id);

-- Add room_id to timetable_periods if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'timetable_periods' AND column_name = 'room_id'
    ) THEN
        ALTER TABLE timetable_periods ADD COLUMN room_id UUID REFERENCES rooms(id) ON DELETE SET NULL;
        CREATE INDEX idx_timetable_periods_room_id ON timetable_periods(room_id);
    END IF;
END $$;

-- Add version_id to timetables if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'timetables' AND column_name = 'version_id'
    ) THEN
        ALTER TABLE timetables ADD COLUMN version_id UUID REFERENCES timetable_versions(id) ON DELETE SET NULL;
        ALTER TABLE timetables ADD COLUMN template_id UUID REFERENCES timetable_templates(id) ON DELETE SET NULL;
        ALTER TABLE timetables ADD COLUMN school_timing_id UUID REFERENCES school_timings(id) ON DELETE SET NULL;
        CREATE INDEX idx_timetables_version_id ON timetables(version_id);
        CREATE INDEX idx_timetables_template_id ON timetables(template_id);
        CREATE INDEX idx_timetables_school_timing_id ON timetables(school_timing_id);
    END IF;
END $$;
