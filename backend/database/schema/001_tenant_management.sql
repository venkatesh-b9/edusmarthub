-- ============================================
-- TENANT MANAGEMENT SCHEMA
-- ============================================

-- Tenants (Schools) Table
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    domain VARCHAR(255),
    
    -- Contact Information
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(255),
    state VARCHAR(255),
    country VARCHAR(255) DEFAULT 'US',
    postal_code VARCHAR(20),
    
    -- Subscription Details
    subscription_tier VARCHAR(50) DEFAULT 'basic', -- basic, standard, premium, enterprise
    subscription_status VARCHAR(50) DEFAULT 'active', -- active, suspended, cancelled, expired
    subscription_start_date DATE,
    subscription_end_date DATE,
    max_users INTEGER DEFAULT 100,
    max_students INTEGER DEFAULT 1000,
    max_storage_gb INTEGER DEFAULT 10,
    
    -- Branding
    logo_url VARCHAR(500),
    primary_color VARCHAR(7),
    secondary_color VARCHAR(7),
    favicon_url VARCHAR(500),
    
    -- Settings
    timezone VARCHAR(50) DEFAULT 'UTC',
    locale VARCHAR(10) DEFAULT 'en-US',
    currency VARCHAR(3) DEFAULT 'USD',
    date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD',
    time_format VARCHAR(10) DEFAULT '24h',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_trial BOOLEAN DEFAULT false,
    trial_end_date DATE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_subscription_tier CHECK (subscription_tier IN ('basic', 'standard', 'premium', 'enterprise')),
    CONSTRAINT valid_subscription_status CHECK (subscription_status IN ('active', 'suspended', 'cancelled', 'expired'))
);

-- Tenant Configurations
CREATE TABLE IF NOT EXISTS tenant_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Academic Configuration
    academic_year_start_month INTEGER DEFAULT 9, -- September
    academic_year_end_month INTEGER DEFAULT 6,   -- June
    terms_per_year INTEGER DEFAULT 2,            -- Semesters
    grading_system VARCHAR(50) DEFAULT 'percentage', -- percentage, letter, gpa
    passing_grade DECIMAL(5,2) DEFAULT 60.00,
    
    -- Attendance Configuration
    attendance_method VARCHAR(50) DEFAULT 'manual', -- manual, biometric, rfid, facial
    attendance_marking_time TIME DEFAULT '09:00:00',
    late_threshold_minutes INTEGER DEFAULT 15,
    absence_threshold_days INTEGER DEFAULT 3,
    
    -- Communication Configuration
    email_notifications_enabled BOOLEAN DEFAULT true,
    sms_notifications_enabled BOOLEAN DEFAULT false,
    push_notifications_enabled BOOLEAN DEFAULT true,
    parent_portal_enabled BOOLEAN DEFAULT true,
    
    -- Security Configuration
    password_policy JSONB DEFAULT '{"minLength": 8, "requireUppercase": true, "requireLowercase": true, "requireNumbers": true, "requireSpecialChars": true}',
    session_timeout_minutes INTEGER DEFAULT 30,
    mfa_required BOOLEAN DEFAULT false,
    
    -- Feature Flags
    features JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(tenant_id)
);

-- Tenant Modules (Enabled Features)
CREATE TABLE IF NOT EXISTS tenant_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    module_name VARCHAR(100) NOT NULL,
    module_version VARCHAR(20),
    is_enabled BOOLEAN DEFAULT true,
    enabled_at TIMESTAMP DEFAULT NOW(),
    configuration JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(tenant_id, module_name)
);

-- Indexes for Tenant Management
CREATE INDEX idx_tenants_code ON tenants(code);
CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX idx_tenants_subscription_status ON tenants(subscription_status);
CREATE INDEX idx_tenants_is_active ON tenants(is_active);
CREATE INDEX idx_tenants_created_at ON tenants(created_at);

CREATE INDEX idx_tenant_configurations_tenant_id ON tenant_configurations(tenant_id);
CREATE INDEX idx_tenant_modules_tenant_id ON tenant_modules(tenant_id);
CREATE INDEX idx_tenant_modules_module_name ON tenant_modules(module_name);
CREATE INDEX idx_tenant_modules_is_enabled ON tenant_modules(is_enabled);

-- Partitioning for tenant_modules (if needed for large scale)
-- CREATE TABLE tenant_modules_2024 PARTITION OF tenant_modules
--     FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
