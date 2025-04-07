-- Agregar columna para indicar si un lead ha sido convertido a contacto
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS converted_to_contact BOOLEAN DEFAULT FALSE;

-- Agregar índice para mejorar el rendimiento de consultas que filtran por esta columna
CREATE INDEX IF NOT EXISTS idx_leads_converted ON leads(converted_to_contact);

-- Comentario descriptivo de la migración
COMMENT ON COLUMN leads.converted_to_contact IS 'Indica si el lead ha sido convertido a un contacto. Esto evita eliminarlo para mantener la integridad referencial.'; 