-- Agregar campos del lead a la tabla de contactos
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS origin TEXT,
ADD COLUMN IF NOT EXISTS pax_count INTEGER,
ADD COLUMN IF NOT EXISTS estimated_travel_date DATE,
ADD COLUMN IF NOT EXISTS original_lead_id UUID REFERENCES leads(id),
ADD COLUMN IF NOT EXISTS original_lead_status TEXT,
ADD COLUMN IF NOT EXISTS original_lead_inquiry_number TEXT; 