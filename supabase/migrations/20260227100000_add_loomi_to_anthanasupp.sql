-- Add hello@loomi.lat as admin to anthanasupp@gmail.com tenant
DO $$
DECLARE
  v_tenant_id UUID;
BEGIN
  SELECT id INTO v_tenant_id FROM tenants WHERE email = 'anthanasupp@gmail.com';

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Tenant not found for anthanasupp@gmail.com';
  END IF;

  INSERT INTO tenant_members (tenant_id, email, role, invited_at)
  VALUES (v_tenant_id, 'hello@loomi.lat', 'admin', NOW())
  ON CONFLICT (tenant_id, email) DO NOTHING;
END $$;
