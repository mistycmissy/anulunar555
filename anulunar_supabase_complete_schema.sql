-- =============================================
-- AnuLunar™ Additional Schema Improvements
-- Based on Technical Review Feedback
-- =============================================

-- Table for report type validation (Fix 5: Table-driven validation)
CREATE TABLE report_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed report types
INSERT INTO report_types (slug, name, description) VALUES
('numerology', 'Numerology Report', 'Core numerological analysis and insights'),
('astrology', 'Astrology Report', 'Complete birth chart analysis'),
('celtic_moon', 'Celtic Moon Report', 'Celtic lunar wisdom and tree signs'),
('inner_child_healing', 'Inner Child Healing Map', 'Deep emotional healing and shadow work'),
('karmic_blueprint', 'Karmic Blueprint Report', 'Soul evolution and karmic patterns'),
('complete_spiritual_intelligence', 'Complete Spiritual Intelligence', 'Full synthesis of all modalities');

-- Table for tracking notification delivery (Brevo integration improvement)
CREATE TABLE report_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES spiritual_reports(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    report_type TEXT NOT NULL,
    template_id INTEGER,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
    error_message TEXT,
    brevo_message_id TEXT,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced report_downloads table (already mentioned in main schema but ensuring completeness)
CREATE TABLE IF NOT EXISTS report_downloads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES spiritual_reports(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id TEXT,
    referrer TEXT
);

-- Table for tracking report generation jobs (future improvement)
CREATE TABLE report_generation_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES spiritual_reports(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('queued', 'processing', 'completed', 'failed')) DEFAULT 'queued',
    priority INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_report_types_slug ON report_types(slug);
CREATE INDEX idx_report_types_active ON report_types(active);

CREATE INDEX idx_report_notifications_report_id ON report_notifications(report_id);
CREATE INDEX idx_report_notifications_email ON report_notifications(email);
CREATE INDEX idx_report_notifications_status ON report_notifications(status);
CREATE INDEX idx_report_notifications_sent_at ON report_notifications(sent_at);

CREATE INDEX idx_report_downloads_report_id ON report_downloads(report_id);
CREATE INDEX idx_report_downloads_profile_id ON report_downloads(profile_id);
CREATE INDEX idx_report_downloads_downloaded_at ON report_downloads(downloaded_at);

CREATE INDEX idx_report_generation_jobs_status ON report_generation_jobs(status);
CREATE INDEX idx_report_generation_jobs_priority ON report_generation_jobs(priority);
CREATE INDEX idx_report_generation_jobs_created_at ON report_generation_jobs(created_at);

-- RLS Policies for new tables
ALTER TABLE report_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_generation_jobs ENABLE ROW LEVEL SECURITY;

-- Report types are publicly readable
CREATE POLICY "Report types are publicly readable" ON report_types
    FOR SELECT USING (active = true);

-- Users can only see notifications for their reports
CREATE POLICY "Users can view their report notifications" ON report_notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM spiritual_reports sr
            JOIN profiles p ON p.id = sr.profile_id
            WHERE sr.id = report_notifications.report_id
            AND auth.uid()::text = p.id::text
        )
    );

-- Only service role can manage generation jobs
CREATE POLICY "Service role can manage generation jobs" ON report_generation_jobs
    FOR ALL USING (auth.role() = 'service_role');

-- Function to get report type validation
CREATE OR REPLACE FUNCTION get_valid_report_types()
RETURNS TEXT[] AS $$
BEGIN
    RETURN ARRAY(
        SELECT slug FROM report_types WHERE active = true ORDER BY slug
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to queue report generation job
CREATE OR REPLACE FUNCTION queue_report_generation(
    p_report_id UUID,
    p_priority INTEGER DEFAULT 0
) RETURNS UUID AS $$
DECLARE
    v_job_id UUID;
BEGIN
    INSERT INTO report_generation_jobs (report_id, priority)
    VALUES (p_report_id, p_priority)
    RETURNING id INTO v_job_id;
    
    RETURN v_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track notification delivery
CREATE OR REPLACE FUNCTION log_notification_delivery(
    p_report_id UUID,
    p_email TEXT,
    p_report_type TEXT,
    p_template_id INTEGER,
    p_status TEXT,
    p_error_message TEXT DEFAULT NULL,
    p_brevo_message_id TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO report_notifications (
        report_id, email, report_type, template_id, status, error_message, brevo_message_id
    ) VALUES (
        p_report_id, p_email, p_report_type, p_template_id, p_status, p_error_message, p_brevo_message_id
    ) RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at on report_generation_jobs
CREATE OR REPLACE FUNCTION update_report_job_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_report_generation_jobs_updated_at 
    BEFORE UPDATE ON report_generation_jobs
    FOR EACH ROW EXECUTE FUNCTION update_report_job_updated_at();

-- View for report analytics
CREATE OR REPLACE VIEW report_analytics AS
SELECT 
    sr.report_type,
    sr.report_tier,
    COUNT(*) as total_generated,
    COUNT(rd.id) as total_downloads,
    AVG(EXTRACT(EPOCH FROM (sr.generated_at - sr.created_at))) as avg_generation_time_seconds,
    COUNT(CASE WHEN sr.generation_status = 'failed' THEN 1 END) as failed_generations,
    COUNT(rn.id) as notifications_sent,
    COUNT(CASE WHEN rn.status = 'failed' THEN 1 END) as notification_failures
FROM spiritual_reports sr
LEFT JOIN report_downloads rd ON sr.id = rd.report_id
LEFT JOIN report_notifications rn ON sr.id = rn.report_id
WHERE sr.created_at >= NOW() - INTERVAL '30 days'
GROUP BY sr.report_type, sr.report_tier
ORDER BY total_generated DESC;

-- Grant access to analytics view for service role
GRANT SELECT ON report_analytics TO service_role;