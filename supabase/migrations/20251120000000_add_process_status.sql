-- Add process_status column to clients table
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS process_status TEXT DEFAULT 'pendiente_de_propuesta'
CHECK (process_status IN (
  'pendiente_de_propuesta',
  'revisando_propuesta',
  'pendiente_de_contrato',
  'firma_de_contrato',
  'inicio_de_proyecto'
));

-- Add comment to document the status values
COMMENT ON COLUMN clients.process_status IS 'Status del proceso del cliente: pendiente_de_propuesta, revisando_propuesta, pendiente_de_contrato, firma_de_contrato, inicio_de_proyecto';

