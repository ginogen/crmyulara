-- Crear la tabla de historial de leads
CREATE TABLE IF NOT EXISTS lead_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id),
    action TEXT NOT NULL,
    description TEXT NOT NULL
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_lead_history_lead_id ON lead_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_history_user_id ON lead_history(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_history_created_at ON lead_history(created_at);

-- Habilitar RLS
ALTER TABLE lead_history ENABLE ROW LEVEL SECURITY;

-- Crear políticas de RLS
CREATE POLICY "Usuarios pueden ver el historial de leads de su organización" ON lead_history
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM leads l
            JOIN public.users u ON u.organization_id = l.organization_id
            WHERE l.id = lead_history.lead_id
            AND u.id = auth.uid()
        )
    );

CREATE POLICY "Usuarios pueden crear registros de historial para leads de su organización" ON lead_history
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM leads l
            JOIN public.users u ON u.organization_id = l.organization_id
            WHERE l.id = lead_history.lead_id
            AND u.id = auth.uid()
        )
    );

-- Agregar comentarios descriptivos
COMMENT ON TABLE lead_history IS 'Registra todas las acciones realizadas sobre los leads';
COMMENT ON COLUMN lead_history.action IS 'Tipo de acción realizada (ej: status_change, assignment_change, converted_to_contact)';
COMMENT ON COLUMN lead_history.description IS 'Descripción detallada de la acción realizada'; 