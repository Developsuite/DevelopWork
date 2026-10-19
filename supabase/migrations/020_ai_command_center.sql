-- =============================================
-- AI Command Center: Database Tables
-- =============================================

-- AI Conversations (persists chat sessions)
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    admin_id UUID NOT NULL,
    title TEXT DEFAULT 'New Conversation',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_admin ON ai_conversations(admin_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_tenant ON ai_conversations(tenant_id);

-- AI Messages (each message in a conversation)
CREATE TABLE IF NOT EXISTS ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant', 'tool')),
    content TEXT,
    tool_calls JSONB,
    model TEXT,
    token_usage JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON ai_messages(conversation_id);

-- AI Action Runs (audit trail for every AI-triggered action)
CREATE TABLE IF NOT EXISTS ai_action_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    requested_by UUID NOT NULL,
    conversation_id UUID REFERENCES ai_conversations(id) ON DELETE SET NULL,
    tool_name TEXT NOT NULL,
    arguments JSONB DEFAULT '{}',
    risk_level TEXT DEFAULT 'read' CHECK (risk_level IN ('read', 'low', 'external', 'sensitive', 'destructive')),
    status TEXT DEFAULT 'proposed' CHECK (status IN ('proposed', 'awaiting_confirmation', 'executing', 'completed', 'partially_completed', 'failed', 'cancelled')),
    requires_confirmation BOOLEAN DEFAULT false,
    confirmed_at TIMESTAMPTZ,
    before_value JSONB,
    after_value JSONB,
    error_message TEXT,
    idempotency_key TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_action_runs_tenant ON ai_action_runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_action_runs_admin ON ai_action_runs(requested_by);
CREATE INDEX IF NOT EXISTS idx_ai_action_runs_status ON ai_action_runs(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_action_runs_idempotency ON ai_action_runs(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Notification Outbox (tracks email and Telegram delivery)
CREATE TABLE IF NOT EXISTS notification_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    recipient_id UUID,
    recipient_email TEXT,
    event_type TEXT NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('in_app', 'email', 'telegram')),
    payload JSONB DEFAULT '{}',
    status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'sending', 'delivered', 'failed', 'retrying')),
    attempt_count INT DEFAULT 0,
    next_attempt_at TIMESTAMPTZ,
    provider_message_id TEXT,
    last_error TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notification_outbox_status ON notification_outbox(status);
CREATE INDEX IF NOT EXISTS idx_notification_outbox_recipient ON notification_outbox(recipient_id);

-- User Integrations (Telegram connections, future providers)
CREATE TABLE IF NOT EXISTS user_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    user_id UUID NOT NULL,
    provider TEXT NOT NULL DEFAULT 'telegram',
    external_chat_id TEXT,
    connected_at TIMESTAMPTZ DEFAULT now(),
    disabled_at TIMESTAMPTZ,
    UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_user_integrations_user ON user_integrations(user_id);

-- Integration Connection Tokens (one-time tokens for Telegram linking)
CREATE TABLE IF NOT EXISTS integration_connection_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    user_id UUID NOT NULL,
    provider TEXT NOT NULL DEFAULT 'telegram',
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_connection_tokens_hash ON integration_connection_tokens(token_hash);

-- =============================================
-- RLS Policies
-- =============================================

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_action_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_connection_tokens ENABLE ROW LEVEL SECURITY;

-- Admins can see their own conversations
CREATE POLICY ai_conversations_admin_policy ON ai_conversations
    FOR ALL USING (admin_id = auth.uid());

-- Admins can see messages in their conversations
CREATE POLICY ai_messages_admin_policy ON ai_messages
    FOR ALL USING (conversation_id IN (SELECT id FROM ai_conversations WHERE admin_id = auth.uid()));

-- Admins can see their own action runs
CREATE POLICY ai_action_runs_admin_policy ON ai_action_runs
    FOR ALL USING (requested_by = auth.uid());

-- Admins can manage notification outbox
CREATE POLICY notification_outbox_admin_policy ON notification_outbox
    FOR ALL USING (true);

-- Users can see their own integrations
CREATE POLICY user_integrations_own_policy ON user_integrations
    FOR ALL USING (user_id = auth.uid());

-- Users can see their own connection tokens
CREATE POLICY connection_tokens_own_policy ON integration_connection_tokens
    FOR ALL USING (user_id = auth.uid());
