-- Modificar la tabla budgets
ALTER TABLE budgets
  -- Renombrar lead_id a contact_id
  RENAME COLUMN lead_id TO contact_id;

-- Eliminar la columna amount
ALTER TABLE budgets
  DROP COLUMN amount;

-- Agregar nuevas columnas
ALTER TABLE budgets
  ADD COLUMN contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  ADD COLUMN rates text,
  ADD COLUMN responsible text,
  ADD COLUMN slug text,
  ADD COLUMN theme_settings jsonb DEFAULT jsonb_build_object(
    'logo_url', '',
    'primary_color', '#3B82F6',
    'secondary_color', '#1E40AF',
    'font_family', 'Inter',
    'header_style', 'modern'
  );

-- Crear índice para búsqueda rápida por slug
CREATE INDEX idx_budgets_slug ON budgets(slug);

-- Asegurarse de que el slug sea único
ALTER TABLE budgets
  ADD CONSTRAINT budgets_slug_unique UNIQUE (slug);

-- Actualizar las referencias de clave foránea
ALTER TABLE budgets
  DROP CONSTRAINT IF EXISTS budgets_lead_id_fkey,
  ADD CONSTRAINT budgets_contact_id_fkey 
    FOREIGN KEY (contact_id) 
    REFERENCES contacts(id) 
    ON DELETE CASCADE; 