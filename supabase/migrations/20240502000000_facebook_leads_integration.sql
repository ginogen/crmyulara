-- Tabla para la integración con Facebook Lead Ads
CREATE TABLE IF NOT EXISTS facebook_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  branch_id UUID NOT NULL REFERENCES branches(id),
  page_id VARCHAR(255) NOT NULL,
  page_name VARCHAR(255),
  page_access_token TEXT,
  form_id VARCHAR(255) NOT NULL,
  form_name VARCHAR(255),
  active BOOLEAN DEFAULT TRUE,
  last_sync TIMESTAMP WITH TIME ZONE
);

-- Tabla para almacenar los leads importados de Facebook
DROP TABLE IF EXISTS facebook_leads;
CREATE TABLE IF NOT EXISTS facebook_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  facebook_lead_id VARCHAR(255) NOT NULL,
  form_id VARCHAR(255) NOT NULL,
  page_id VARCHAR(255) NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  branch_id UUID NOT NULL REFERENCES branches(id),
  lead_data JSONB,
  processed BOOLEAN DEFAULT FALSE,
  converted_to_lead BOOLEAN DEFAULT FALSE,
  lead_id UUID REFERENCES leads(id),
  conversion_date TIMESTAMP WITH TIME ZONE
);

-- Índices para optimizar el rendimiento
CREATE INDEX IF NOT EXISTS idx_facebook_integrations_org_branch ON facebook_integrations(organization_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_facebook_leads_org_branch ON facebook_leads(organization_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_facebook_leads_processed ON facebook_leads(processed);
CREATE INDEX IF NOT EXISTS idx_facebook_leads_facebook_id ON facebook_leads(facebook_lead_id);

-- Trigger para actualizar el campo updated_at
CREATE OR REPLACE FUNCTION update_facebook_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_facebook_integrations_updated_at
BEFORE UPDATE ON facebook_integrations
FOR EACH ROW
EXECUTE PROCEDURE update_facebook_integrations_updated_at(); 