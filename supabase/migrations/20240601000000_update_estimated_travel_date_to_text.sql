-- Cambiar el tipo de datos del campo estimated_travel_date en la tabla leads
ALTER TABLE leads
    ALTER COLUMN estimated_travel_date TYPE TEXT;

-- Actualizar la descripción del campo
COMMENT ON COLUMN leads.estimated_travel_date IS 'Fecha estimada de viaje (formato libre que puede incluir texto)';

-- También actualizar el mismo campo en la tabla contacts para mantener la consistencia
ALTER TABLE contacts
    ALTER COLUMN estimated_travel_date TYPE TEXT;

COMMENT ON COLUMN contacts.estimated_travel_date IS 'Fecha estimada de viaje (formato libre que puede incluir texto)'; 