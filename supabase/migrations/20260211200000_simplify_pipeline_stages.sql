-- Simplify CRM pipeline: 7 stages → 5 temperature-based columns
-- Remap: Nuevo→Cold, Contactado→Warm, Calificado/Propuesta/Negociacion→Hot

-- 1. Remap existing leads to new stage names
UPDATE leads SET stage = 'Cold'  WHERE stage IN ('Nuevo', 'initial', 'new', 'lead');
UPDATE leads SET stage = 'Warm'  WHERE stage IN ('Contactado', 'contacted');
UPDATE leads SET stage = 'Hot'   WHERE stage IN ('Calificado', 'qualified', 'Propuesta', 'Negociacion', 'Demo Agendada', 'demo_scheduled');
-- Ganado and Perdido stay as-is
UPDATE leads SET stage = 'Ganado' WHERE stage IN ('customer', 'won', 'closed');
UPDATE leads SET stage = 'Perdido' WHERE stage IN ('lost');

-- 2. Update pipeline_stages table for all tenants
DELETE FROM pipeline_stages;

INSERT INTO pipeline_stages (tenant_id, name, color, position, is_won, is_lost)
SELECT
  t.id,
  s.name,
  s.color,
  s.position,
  s.is_won,
  s.is_lost
FROM tenants t
CROSS JOIN (
  VALUES
    ('Cold',    'blue',    0, false, false),
    ('Warm',    'amber',   1, false, false),
    ('Hot',     'orange',  2, false, false),
    ('Ganado',  'emerald', 3, true,  false),
    ('Perdido', 'gray',    4, false, true)
) AS s(name, color, position, is_won, is_lost);
