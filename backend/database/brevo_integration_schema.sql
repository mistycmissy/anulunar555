-- =============================================
-- AnuLunar™ - Brevo CRM Integration Schema
-- Additional tables for CRM sync tracking
-- =============================================

-- Add Brevo sync flag to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS brevo_synced BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS brevo_contact_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS brevo_last_sync TIMESTAMP WITH TIME ZONE;

-- Table for tracking Brevo sync operations
CREATE TABLE IF NOT EXISTS brevo_sync_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('contact_created', 'contact_updated', 'contact_failed', 'email_sent', 'segment_added')),
    result JSONB,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0
);

-- Table for tracking email events from Brevo webhooks
CREATE TABLE IF NOT EXISTS email_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed', 'complained')),
    message_id TEXT,
    template_id INTEGER,
    campaign_name TEXT,
    occurred_at TIMESTAMP WITH TIME ZONE,
    webhook_data JSONB,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for managing Brevo segments and lists
CREATE TABLE IF NOT EXISTS brevo_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brevo_segment_id INTEGER NOT NULL,
    segment_name TEXT NOT NULL,
    segment_type TEXT NOT NULL CHECK (segment_type IN ('numerology', 'celtic_moon', 'astrology', 'engagement', 'tier')),
    criteria JSONB NOT NULL,
    contact_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for tracking email automation sequences
CREATE TABLE IF NOT EXISTS email_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    sequence_type TEXT NOT NULL CHECK (sequence_type IN ('welcome', 'onboarding', 'report_ready', 'lunar_update', 'nurture')),
    template_id INTEGER,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'failed', 'cancelled')),
    brevo_message_id TEXT,
    parameters JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_brevo_synced ON profiles(brevo_synced) WHERE brevo_synced = false;
CREATE INDEX IF NOT EXISTS idx_brevo_sync_log_profile_id ON brevo_sync_log(profile_id);
CREATE INDEX IF NOT EXISTS idx_brevo_sync_log_action ON brevo_sync_log(action);
CREATE INDEX IF NOT EXISTS idx_brevo_sync_log_synced_at ON brevo_sync_log(synced_at);
CREATE INDEX IF NOT EXISTS idx_email_events_email ON email_events(email);
CREATE INDEX IF NOT EXISTS idx_email_events_event_type ON email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_events_occurred_at ON email_events(occurred_at);
CREATE INDEX IF NOT EXISTS idx_email_sequences_profile_id ON email_sequences(profile_id);
CREATE INDEX IF NOT EXISTS idx_email_sequences_status ON email_sequences(status);
CREATE INDEX IF NOT EXISTS idx_email_sequences_scheduled_at ON email_sequences(scheduled_at);

-- RLS Policies
ALTER TABLE brevo_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE brevo_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;

-- Service role can manage all Brevo data
CREATE POLICY "Service role can manage brevo sync log" ON brevo_sync_log
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage email events" ON email_events
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage brevo segments" ON brevo_segments
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage email sequences" ON email_sequences
    FOR ALL USING (auth.role() = 'service_role');

-- Users can view their own email sequences
CREATE POLICY "Users can view their email sequences" ON email_sequences
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = email_sequences.profile_id
            AND auth.uid()::text = p.id::text
        )
    );

-- Functions for Brevo integration
CREATE OR REPLACE FUNCTION get_unsync_profiles_count()
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM profiles
        WHERE brevo_synced = false OR brevo_synced IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to queue email sequence
CREATE OR REPLACE FUNCTION queue_email_sequence(
    p_profile_id UUID,
    p_sequence_type TEXT,
    p_template_id INTEGER,
    p_delay_minutes INTEGER DEFAULT 0,
    p_parameters JSONB DEFAULT '{}'::JSONB
) RETURNS UUID AS $$
DECLARE
    v_sequence_id UUID;
    v_scheduled_at TIMESTAMP WITH TIME ZONE;
BEGIN
    v_scheduled_at := NOW() + (p_delay_minutes || ' minutes')::INTERVAL;
    
    INSERT INTO email_sequences (
        profile_id,
        sequence_type,
        template_id,
        scheduled_at,
        parameters
    ) VALUES (
        p_profile_id,
        p_sequence_type,
        p_template_id,
        v_scheduled_at,
        p_parameters
    ) RETURNING id INTO v_sequence_id;
    
    RETURN v_sequence_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark profile as synced with Brevo
CREATE OR REPLACE FUNCTION mark_brevo_synced(
    p_profile_id UUID,
    p_brevo_contact_id TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE profiles
    SET 
        brevo_synced = true,
        brevo_contact_id = COALESCE(p_brevo_contact_id, brevo_contact_id),
        brevo_last_sync = NOW()
    WHERE id = p_profile_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get email engagement metrics
CREATE OR REPLACE FUNCTION get_email_engagement_stats(
    p_days INTEGER DEFAULT 30
) RETURNS TABLE (
    total_sent BIGINT,
    total_delivered BIGINT,
    total_opened BIGINT,
    total_clicked BIGINT,
    open_rate NUMERIC,
    click_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) FILTER (WHERE event_type = 'sent') as total_sent,
        COUNT(*) FILTER (WHERE event_type = 'delivered') as total_delivered,
        COUNT(*) FILTER (WHERE event_type = 'opened') as total_opened,
        COUNT(*) FILTER (WHERE event_type = 'clicked') as total_clicked,
        ROUND(
            (COUNT(*) FILTER (WHERE event_type = 'opened')::NUMERIC / 
             NULLIF(COUNT(*) FILTER (WHERE event_type = 'delivered'), 0)) * 100, 2
        ) as open_rate,
        ROUND(
            (COUNT(*) FILTER (WHERE event_type = 'clicked')::NUMERIC / 
             NULLIF(COUNT(*) FILTER (WHERE event_type = 'opened'), 0)) * 100, 2
        ) as click_rate
    FROM email_events
    WHERE occurred_at >= NOW() - (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-queue welcome email when profile is created
CREATE OR REPLACE FUNCTION trigger_welcome_email()
RETURNS TRIGGER AS $$
BEGIN
    -- Queue welcome email with 5 minute delay
    PERFORM queue_email_sequence(
        NEW.id,
        'welcome',
        1, -- Welcome template ID
        5, -- 5 minute delay
        jsonb_build_object(
            'firstName', NEW.first_name,
            'lifePath', NEW.life_path_number,
            'celticTree', NEW.celtic_tree_sign
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profile_welcome_email
    AFTER INSERT ON profiles
    FOR EACH ROW
    WHEN (NEW.email IS NOT NULL)
    EXECUTE FUNCTION trigger_welcome_email();

-- View for Brevo sync status dashboard
CREATE OR REPLACE VIEW brevo_sync_status AS
SELECT 
    COUNT(*) as total_profiles,
    COUNT(*) FILTER (WHERE brevo_synced = true) as synced_profiles,
    COUNT(*) FILTER (WHERE brevo_synced = false OR brevo_synced IS NULL) as pending_sync,
    ROUND(
        (COUNT(*) FILTER (WHERE brevo_synced = true)::NUMERIC / COUNT(*)) * 100, 2
    ) as sync_percentage,
    MAX(brevo_last_sync) as last_sync_time
FROM profiles
WHERE email IS NOT NULL;

-- View for email performance dashboard
CREATE OR REPLACE VIEW email_performance_dashboard AS
SELECT 
    DATE_TRUNC('day', occurred_at) as date,
    COUNT(*) FILTER (WHERE event_type = 'sent') as sent,
    COUNT(*) FILTER (WHERE event_type = 'delivered') as delivered,
    COUNT(*) FILTER (WHERE event_type = 'opened') as opened,
    COUNT(*) FILTER (WHERE event_type = 'clicked') as clicked,
    ROUND(
        (COUNT(*) FILTER (WHERE event_type = 'opened')::NUMERIC / 
         NULLIF(COUNT(*) FILTER (WHERE event_type = 'delivered'), 0)) * 100, 2
    ) as open_rate,
    ROUND(
        (COUNT(*) FILTER (WHERE event_type = 'clicked')::NUMERIC / 
         NULLIF(COUNT(*) FILTER (WHERE event_type = 'opened'), 0)) * 100, 2
    ) as click_rate
FROM email_events
WHERE occurred_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', occurred_at)
ORDER BY date DESC;

-- Grant access to service role
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;