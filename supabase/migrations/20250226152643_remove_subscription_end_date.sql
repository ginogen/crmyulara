-- Eliminar la columna subscription_end_date de la tabla organizations
ALTER TABLE organizations DROP COLUMN IF EXISTS subscription_end_date;
