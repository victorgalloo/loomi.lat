-- Normalize lead stages to match new pipeline
-- Old stages → New unified stages

UPDATE leads SET stage = 'Nuevo' WHERE stage IN ('Lead', 'initial', 'new');
UPDATE leads SET stage = 'Calificado' WHERE stage = 'Demo Agendada';
UPDATE leads SET stage = 'Negociacion' WHERE stage = 'payment_pending';
