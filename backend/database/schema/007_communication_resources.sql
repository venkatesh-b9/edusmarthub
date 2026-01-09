-- ============================================
-- COMMUNICATION & RESOURCE MANAGEMENT SCHEMA
-- ============================================

-- Messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Message Details
    subject VARCHAR(500),
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'direct', -- direct, announcement, notification, system
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    
    -- Threading
    parent_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    thread_id UUID,
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    is_archived BOOLEAN DEFAULT false,
    archived_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP,
    
    -- Attachments
    attachments JSONB DEFAULT '[]',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create partitions for messages (monthly partitions)
CREATE TABLE IF NOT EXISTS messages_2024_01 PARTITION OF messages
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE IF NOT EXISTS messages_2024_02 PARTITION OF messages
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    school_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Announcement Details
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    announcement_type VARCHAR(50) DEFAULT 'general', -- general, academic, event, emergency
    priority VARCHAR(20) DEFAULT 'normal',
    
    -- Targeting
    target_audience JSONB DEFAULT '[]', -- roles, sections, grades, all
    target_sections UUID[],
    target_grades UUID[],
    
    -- Scheduling
    publish_at TIMESTAMP,
    expires_at TIMESTAMP,
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP,
    
    -- Attachments
    attachments JSONB DEFAULT '[]',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification Details
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL, -- grade, attendance, assignment, message, system
    priority VARCHAR(20) DEFAULT 'normal',
    
    -- Action
    action_url VARCHAR(500),
    action_type VARCHAR(50), -- view, navigate, open
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    is_delivered BOOLEAN DEFAULT false,
    delivered_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Create partitions for notifications (monthly partitions)
CREATE TABLE IF NOT EXISTS notifications_2024_01 PARTITION OF notifications
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE IF NOT EXISTS notifications_2024_02 PARTITION OF notifications
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Meetings
CREATE TABLE IF NOT EXISTS meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Meeting Details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    meeting_type VARCHAR(50) DEFAULT 'general', -- parent_teacher, staff, student, general
    location VARCHAR(255),
    virtual_meeting_url VARCHAR(500),
    virtual_meeting_id VARCHAR(255),
    
    -- Scheduling
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    is_all_day BOOLEAN DEFAULT false,
    
    -- Participants
    participant_ids UUID[],
    required_participants UUID[],
    optional_participants UUID[],
    
    -- Status
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
    cancellation_reason TEXT,
    
    -- Reminders
    reminder_sent BOOLEAN DEFAULT false,
    reminder_sent_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT valid_time CHECK (end_time > start_time)
);

-- Discussion Forums
CREATE TABLE IF NOT EXISTS discussion_forums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Forum Details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    forum_type VARCHAR(50) DEFAULT 'general', -- class, subject, general, parent_teacher
    section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    
    -- Settings
    is_public BOOLEAN DEFAULT true,
    allow_anonymous BOOLEAN DEFAULT false,
    moderation_enabled BOOLEAN DEFAULT false,
    
    -- Statistics
    total_posts INTEGER DEFAULT 0,
    total_replies INTEGER DEFAULT 0,
    last_activity_at TIMESTAMP,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Forum Posts
CREATE TABLE IF NOT EXISTS forum_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forum_id UUID NOT NULL REFERENCES discussion_forums(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_post_id UUID REFERENCES forum_posts(id) ON DELETE SET NULL,
    
    -- Post Details
    title VARCHAR(255),
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    
    -- Statistics
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    
    -- Status
    is_approved BOOLEAN DEFAULT true,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Polls
CREATE TABLE IF NOT EXISTS polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Poll Details
    question TEXT NOT NULL,
    description TEXT,
    poll_type VARCHAR(50) DEFAULT 'single_choice', -- single_choice, multiple_choice, rating
    target_audience JSONB DEFAULT '[]',
    
    -- Options
    options JSONB NOT NULL, -- Array of option objects
    
    -- Settings
    is_anonymous BOOLEAN DEFAULT false,
    allow_multiple_votes BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Scheduling
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    
    -- Results
    total_votes INTEGER DEFAULT 0,
    results JSONB,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Poll Votes
CREATE TABLE IF NOT EXISTS poll_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Vote Details
    selected_options JSONB NOT NULL,
    voted_at TIMESTAMP DEFAULT NOW(),
    ip_address VARCHAR(45),
    
    UNIQUE(poll_id, user_id)
);

-- Feedback
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Feedback Details
    feedback_type VARCHAR(50) NOT NULL, -- general, academic, service, technical, suggestion
    subject VARCHAR(255),
    message TEXT NOT NULL,
    rating INTEGER, -- 1-5 scale
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, reviewed, resolved, closed
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    response TEXT,
    responded_by UUID REFERENCES users(id),
    responded_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT valid_rating CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5))
);

-- Resources
CREATE TABLE IF NOT EXISTS resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Resource Details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    resource_type VARCHAR(50) NOT NULL, -- room, equipment, vehicle, facility
    category VARCHAR(100),
    
    -- Location
    building VARCHAR(100),
    room_number VARCHAR(50),
    floor INTEGER,
    
    -- Capacity/Details
    capacity INTEGER,
    specifications JSONB DEFAULT '{}',
    
    -- Status
    is_available BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Resource Bookings
CREATE TABLE IF NOT EXISTS resource_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    booked_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Booking Details
    purpose VARCHAR(255),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    recurring_pattern VARCHAR(50), -- daily, weekly, monthly, none
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, cancelled, completed
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT valid_time CHECK (end_time > start_time)
);

-- Inventory
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Item Details
    item_name VARCHAR(255) NOT NULL,
    item_code VARCHAR(100),
    category VARCHAR(100),
    description TEXT,
    
    -- Quantity
    quantity INTEGER DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'piece',
    min_quantity INTEGER DEFAULT 0,
    max_quantity INTEGER,
    
    -- Location
    storage_location VARCHAR(255),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Library Books
CREATE TABLE IF NOT EXISTS library_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Book Details
    isbn VARCHAR(20),
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    publisher VARCHAR(255),
    publication_year INTEGER,
    edition VARCHAR(50),
    category VARCHAR(100),
    subject VARCHAR(100),
    
    -- Availability
    total_copies INTEGER DEFAULT 1,
    available_copies INTEGER DEFAULT 1,
    reserved_copies INTEGER DEFAULT 0,
    
    -- Location
    shelf_number VARCHAR(50),
    row_number VARCHAR(50),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Book Loans
CREATE TABLE IF NOT EXISTS book_loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
    borrower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Loan Details
    loan_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'borrowed', -- borrowed, returned, overdue, lost
    fine_amount DECIMAL(10,2) DEFAULT 0,
    fine_paid BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Digital Resources
CREATE TABLE IF NOT EXISTS digital_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Resource Details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    resource_type VARCHAR(50), -- document, video, audio, image, link, other
    category VARCHAR(100),
    
    -- File Information
    file_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),
    file_extension VARCHAR(10),
    
    -- Access Control
    is_public BOOLEAN DEFAULT false,
    access_level VARCHAR(50) DEFAULT 'private', -- public, school, section, private
    allowed_roles TEXT[],
    allowed_sections UUID[],
    
    -- Metadata
    tags TEXT[],
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Assignments (Homework/Projects)
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    term_id UUID REFERENCES terms(id) ON DELETE CASCADE,
    
    -- Assignment Details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT,
    assignment_type VARCHAR(50) DEFAULT 'homework', -- homework, project, essay, presentation
    
    -- Files
    attachments JSONB DEFAULT '[]',
    resources JSONB DEFAULT '[]',
    
    -- Dates
    assigned_date DATE NOT NULL,
    due_date DATE NOT NULL,
    late_submission_allowed BOOLEAN DEFAULT false,
    late_penalty_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Grading
    max_score DECIMAL(10,2),
    is_graded BOOLEAN DEFAULT true,
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft', -- draft, published, closed
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Assignment Submissions
CREATE TABLE IF NOT EXISTS assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Submission Details
    submitted_at TIMESTAMP,
    submitted_by UUID REFERENCES users(id),
    
    -- Content
    submission_text TEXT,
    attachments JSONB DEFAULT '[]',
    
    -- Grading
    score DECIMAL(10,2),
    max_score DECIMAL(10,2),
    percentage DECIMAL(5,2),
    grade VARCHAR(10),
    feedback TEXT,
    graded_at TIMESTAMP,
    graded_by UUID REFERENCES users(id),
    
    -- Late Submission
    is_late BOOLEAN DEFAULT false,
    late_penalty_applied DECIMAL(5,2) DEFAULT 0,
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft', -- draft, submitted, graded, returned
    is_plagiarized BOOLEAN DEFAULT false,
    plagiarism_score DECIMAL(5,2),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(assignment_id, student_id)
);

-- Indexes for Communication & Resources
CREATE INDEX idx_messages_tenant_id ON messages(tenant_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_message_type ON messages(message_type);
CREATE INDEX idx_messages_is_read ON messages(is_read);
CREATE INDEX idx_messages_created_at ON messages(created_at);

CREATE INDEX idx_announcements_tenant_id ON announcements(tenant_id);
CREATE INDEX idx_announcements_is_published ON announcements(is_published);
CREATE INDEX idx_announcements_publish_at ON announcements(publish_at);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_notification_type ON notifications(notification_type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

CREATE INDEX idx_meetings_tenant_id ON meetings(tenant_id);
CREATE INDEX idx_meetings_organizer_id ON meetings(organizer_id);
CREATE INDEX idx_meetings_start_time ON meetings(start_time);
CREATE INDEX idx_meetings_status ON meetings(status);

CREATE INDEX idx_forum_posts_forum_id ON forum_posts(forum_id);
CREATE INDEX idx_forum_posts_author_id ON forum_posts(author_id);
CREATE INDEX idx_forum_posts_created_at ON forum_posts(created_at);

CREATE INDEX idx_poll_votes_poll_id ON poll_votes(poll_id);
CREATE INDEX idx_poll_votes_user_id ON poll_votes(user_id);

CREATE INDEX idx_resource_bookings_resource_id ON resource_bookings(resource_id);
CREATE INDEX idx_resource_bookings_start_time ON resource_bookings(start_time);
CREATE INDEX idx_resource_bookings_status ON resource_bookings(status);

CREATE INDEX idx_book_loans_book_id ON book_loans(book_id);
CREATE INDEX idx_book_loans_borrower_id ON book_loans(borrower_id);
CREATE INDEX idx_book_loans_status ON book_loans(status);
CREATE INDEX idx_book_loans_due_date ON book_loans(due_date);

CREATE INDEX idx_assignments_section_id ON assignments(section_id);
CREATE INDEX idx_assignments_subject_id ON assignments(subject_id);
CREATE INDEX idx_assignments_teacher_id ON assignments(teacher_id);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);
CREATE INDEX idx_assignments_status ON assignments(status);

CREATE INDEX idx_assignment_submissions_assignment_id ON assignment_submissions(assignment_id);
CREATE INDEX idx_assignment_submissions_student_id ON assignment_submissions(student_id);
CREATE INDEX idx_assignment_submissions_status ON assignment_submissions(status);
