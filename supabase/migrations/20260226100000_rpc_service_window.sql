-- Update get_webhook_context to track service windows
-- Adds p_referral_source_id parameter and updates window on every inbound message

CREATE OR REPLACE FUNCTION get_webhook_context(
  p_phone TEXT,
  p_name TEXT,
  p_tenant_id UUID DEFAULT NULL,
  p_is_test BOOLEAN DEFAULT FALSE,
  p_referral_source_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lead_id UUID;
  v_lead JSONB;
  v_conv_id UUID;
  v_conv JSONB;
  v_messages JSONB;
  v_memory TEXT;
  v_appointment JSONB;
  v_conv_count INT;
  v_agent_config JSONB;
  v_tenant_docs JSONB;
  v_tenant_tools JSONB;
  v_cal_config JSONB;
  v_bot_paused BOOLEAN;
  v_broadcast_suppress BOOLEAN;
  v_first_interaction TIMESTAMPTZ;
  v_lead_row RECORD;
  v_conv_row RECORD;
BEGIN
  -- ============================================
  -- 1. UPSERT LEAD
  -- ============================================
  IF p_tenant_id IS NOT NULL THEN
    SELECT * INTO v_lead_row FROM leads WHERE phone = p_phone AND tenant_id = p_tenant_id LIMIT 1;
  ELSE
    SELECT * INTO v_lead_row FROM leads WHERE phone = p_phone LIMIT 1;
  END IF;

  IF v_lead_row IS NULL THEN
    INSERT INTO leads (phone, name, stage, is_test, tenant_id)
    VALUES (p_phone, COALESCE(NULLIF(p_name, ''), 'Usuario'), 'Cold', p_is_test, p_tenant_id)
    RETURNING * INTO v_lead_row;
  ELSIF v_lead_row.name = 'Usuario' AND p_name IS NOT NULL AND p_name <> '' AND p_name <> 'Usuario' THEN
    UPDATE leads SET name = p_name WHERE id = v_lead_row.id;
    v_lead_row.name := p_name;
  END IF;

  v_lead_id := v_lead_row.id;
  v_first_interaction := v_lead_row.created_at;

  -- ============================================
  -- 1b. UPDATE SERVICE WINDOW
  -- Every inbound message opens/refreshes the service window
  -- ============================================
  UPDATE leads SET
    service_window_start = NOW(),
    service_window_type = CASE
      WHEN p_referral_source_id IS NOT NULL THEN 'ctwa'
      WHEN service_window_type = 'ctwa'
        AND service_window_start > NOW() - INTERVAL '72 hours'
      THEN 'ctwa'  -- keep CTWA if still active
      ELSE 'standard'
    END
  WHERE id = v_lead_id
  RETURNING * INTO v_lead_row;

  v_lead := jsonb_build_object(
    'id', v_lead_row.id,
    'phone', v_lead_row.phone,
    'name', v_lead_row.name,
    'email', v_lead_row.email,
    'company', v_lead_row.company,
    'industry', v_lead_row.industry,
    'stage', v_lead_row.stage,
    'challenge', v_lead_row.challenge,
    'created_at', v_lead_row.created_at,
    'service_window_start', v_lead_row.service_window_start,
    'service_window_type', v_lead_row.service_window_type
  );

  -- ============================================
  -- 2. UPSERT CONVERSATION
  -- ============================================
  SELECT * INTO v_conv_row
  FROM conversations
  WHERE lead_id = v_lead_id AND ended_at IS NULL
  ORDER BY started_at DESC
  LIMIT 1;

  IF v_conv_row IS NULL THEN
    INSERT INTO conversations (lead_id)
    VALUES (v_lead_id)
    RETURNING * INTO v_conv_row;
  END IF;

  v_conv_id := v_conv_row.id;
  v_bot_paused := COALESCE(v_conv_row.bot_paused, FALSE);
  v_broadcast_suppress := COALESCE(v_conv_row.broadcast_suppress_bot, FALSE);

  v_conv := jsonb_build_object(
    'id', v_conv_row.id,
    'lead_id', v_conv_row.lead_id,
    'started_at', v_conv_row.started_at,
    'ended_at', v_conv_row.ended_at,
    'summary', v_conv_row.summary
  );

  -- ============================================
  -- 3. RECENT MESSAGES (last 20, ordered ASC)
  -- ============================================
  SELECT COALESCE(jsonb_agg(m ORDER BY m.created_at ASC), '[]'::jsonb)
  INTO v_messages
  FROM (
    SELECT id, role, content, created_at
    FROM messages
    WHERE conversation_id = v_conv_id
    ORDER BY created_at DESC
    LIMIT 20
  ) m;

  -- ============================================
  -- 4. LEAD MEMORY
  -- ============================================
  SELECT memory INTO v_memory
  FROM lead_memory
  WHERE lead_id = v_lead_id;

  -- ============================================
  -- 5. ACTIVE APPOINTMENT
  -- ============================================
  SELECT jsonb_build_object(
    'id', a.id,
    'scheduled_at', a.scheduled_at,
    'event_id', a.event_id
  ) INTO v_appointment
  FROM appointments a
  WHERE a.lead_id = v_lead_id
    AND a.status = 'scheduled'
    AND a.scheduled_at >= NOW()
  ORDER BY a.scheduled_at ASC
  LIMIT 1;

  -- ============================================
  -- 6. CONVERSATION COUNT
  -- ============================================
  SELECT COUNT(*) INTO v_conv_count
  FROM conversations
  WHERE lead_id = v_lead_id;

  -- ============================================
  -- 7. AGENT CONFIG (tenant-specific)
  -- ============================================
  IF p_tenant_id IS NOT NULL THEN
    SELECT row_to_json(ac.*)::jsonb INTO v_agent_config
    FROM agent_configs ac
    WHERE ac.tenant_id = p_tenant_id;
  END IF;

  -- ============================================
  -- 8. TENANT DOCUMENTS (top 5 active)
  -- ============================================
  IF p_tenant_id IS NOT NULL THEN
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object('name', td.name, 'content', td.content)
      ORDER BY td.created_at DESC
    ), '[]'::jsonb)
    INTO v_tenant_docs
    FROM (
      SELECT name, content, created_at
      FROM tenant_documents
      WHERE tenant_id = p_tenant_id AND is_active = TRUE
      ORDER BY created_at DESC
      LIMIT 5
    ) td;
  ELSE
    v_tenant_docs := '[]'::jsonb;
  END IF;

  -- ============================================
  -- 9. TENANT TOOLS (active)
  -- ============================================
  IF p_tenant_id IS NOT NULL THEN
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'name', tt.name,
        'display_name', tt.display_name,
        'description', tt.description,
        'parameters', tt.parameters,
        'execution_type', tt.execution_type,
        'mock_response', tt.mock_response
      )
    ), '[]'::jsonb)
    INTO v_tenant_tools
    FROM tenant_tools tt
    WHERE tt.tenant_id = p_tenant_id AND tt.is_active = TRUE;
  ELSE
    v_tenant_tools := '[]'::jsonb;
  END IF;

  -- ============================================
  -- 10. CAL.COM CONFIG (encrypted token stays encrypted, decrypt in JS)
  -- ============================================
  IF p_tenant_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'access_token_encrypted', ti.access_token_encrypted,
      'cal_event_type_id', ti.cal_event_type_id
    ) INTO v_cal_config
    FROM tenant_integrations ti
    WHERE ti.tenant_id = p_tenant_id
      AND ti.provider = 'calcom'
      AND ti.status = 'connected'
      AND ti.access_token_encrypted IS NOT NULL
      AND ti.cal_event_type_id IS NOT NULL;
  END IF;

  -- ============================================
  -- RETURN EVERYTHING
  -- ============================================
  RETURN jsonb_build_object(
    'lead', v_lead,
    'conversation', v_conv,
    'recentMessages', v_messages,
    'memory', v_memory,
    'activeAppointment', v_appointment,
    'conversationCount', v_conv_count,
    'firstInteractionDate', v_first_interaction,
    'botPaused', v_bot_paused,
    'broadcastSuppressed', v_broadcast_suppress,
    'agentConfig', v_agent_config,
    'tenantDocuments', v_tenant_docs,
    'tenantTools', v_tenant_tools,
    'calConfig', v_cal_config
  );
END;
$$;
