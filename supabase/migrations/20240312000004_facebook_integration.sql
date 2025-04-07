-- Tabla para almacenar las conexiones con Facebook
CREATE TABLE IF NOT EXISTS facebook_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    page_id VARCHAR NOT NULL,
    page_name VARCHAR NOT NULL,
    access_token TEXT NOT NULL,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, page_id)
);

-- Tabla para almacenar los formularios de Facebook
CREATE TABLE IF NOT EXISTS facebook_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    connection_id UUID NOT NULL REFERENCES facebook_connections(id),
    form_id VARCHAR NOT NULL,
    form_name VARCHAR NOT NULL,
    status VARCHAR NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(connection_id, form_id)
);

-- Tabla para almacenar los leads de Facebook
CREATE TABLE IF NOT EXISTS facebook_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES facebook_forms(id),
    facebook_lead_id VARCHAR NOT NULL,
    full_name VARCHAR,
    email VARCHAR,
    phone VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    facebook_created_time TIMESTAMP WITH TIME ZONE,
    raw_data JSONB,
    processed BOOLEAN DEFAULT false,
    converted_to_lead BOOLEAN DEFAULT false,
    lead_id UUID REFERENCES leads(id),
    UNIQUE(form_id, facebook_lead_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_facebook_connections_organization ON facebook_connections(organization_id);
CREATE INDEX IF NOT EXISTS idx_facebook_forms_connection ON facebook_forms(connection_id);
CREATE INDEX IF NOT EXISTS idx_facebook_leads_form ON facebook_leads(form_id);
CREATE INDEX IF NOT EXISTS idx_facebook_leads_processed ON facebook_leads(processed);
CREATE INDEX IF NOT EXISTS idx_facebook_leads_converted ON facebook_leads(converted_to_lead);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_facebook_connections_updated_at
    BEFORE UPDATE ON facebook_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facebook_forms_updated_at
    BEFORE UPDATE ON facebook_forms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE facebook_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_leads ENABLE ROW LEVEL SECURITY;

-- Policies para facebook_connections
CREATE POLICY "Users can view their organization's Facebook connections"
    ON facebook_connections FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Organization admins can manage Facebook connections"
    ON facebook_connections FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM users 
        WHERE id = auth.uid() AND role IN ('super_admin', 'org_admin')
    ));

-- Policies para facebook_forms
CREATE POLICY "Users can view their organization's Facebook forms"
    ON facebook_forms FOR SELECT
    USING (connection_id IN (
        SELECT id FROM facebook_connections 
        WHERE organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Organization admins can manage Facebook forms"
    ON facebook_forms FOR ALL
    USING (connection_id IN (
        SELECT id FROM facebook_connections 
        WHERE organization_id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid() AND role IN ('super_admin', 'org_admin')
        )
    ));

-- Policies para facebook_leads
CREATE POLICY "Users can view their organization's Facebook leads"
    ON facebook_leads FOR SELECT
    USING (form_id IN (
        SELECT id FROM facebook_forms 
        WHERE connection_id IN (
            SELECT id FROM facebook_connections 
            WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    ));

CREATE POLICY "Organization admins can manage Facebook leads"
    ON facebook_leads FOR ALL
    USING (form_id IN (
        SELECT id FROM facebook_forms 
        WHERE connection_id IN (
            SELECT id FROM facebook_connections 
            WHERE organization_id IN (
                SELECT organization_id FROM users 
                WHERE id = auth.uid() AND role IN ('super_admin', 'org_admin')
            )
        )
    )); 