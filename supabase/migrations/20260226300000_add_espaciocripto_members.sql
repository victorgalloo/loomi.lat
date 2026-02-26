-- Add Espacio Cripto team members to anthanasupp@gmail.com tenant
DO $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Find the tenant owned by anthanasupp@gmail.com
  SELECT id INTO v_tenant_id FROM tenants WHERE email = 'anthanasupp@gmail.com';

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Tenant not found for anthanasupp@gmail.com';
  END IF;

  -- Insert team members
  INSERT INTO tenant_members (tenant_id, email, role, invited_at)
  VALUES
    (v_tenant_id, 'espaciocriptopodcast@gmail.com', 'member', NOW()),
    (v_tenant_id, 'Rivv@espaciocripto.io', 'member', NOW()),
    (v_tenant_id, 'Lalo@espaciocripto.io', 'member', NOW())
  ON CONFLICT (tenant_id, email) DO NOTHING;
END $$;
