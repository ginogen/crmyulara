import { createClient } from '@/lib/supabase/client';
import { FacebookAccount, FacebookForm, FacebookLead } from '@/types/facebook';
import { FacebookIntegration, Lead } from '@/types/supabase';
import { generateInquiryNumber } from '@/lib/utils/strings';

export interface FacebookConnection {
  id: string;
  organization_id: string;
  page_id: string;
  page_name: string;
  access_token: string;
  token_expires_at: string;
}

export interface FacebookFormDB {
  id: string;
  connection_id: string;
  form_id: string;
  form_name: string;
  status: string;
  is_active: boolean;
}

export interface FacebookLeadDB {
  id: string;
  form_id: string;
  facebook_lead_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  facebook_created_time: string;
  raw_data: any;
  processed: boolean;
  converted_to_lead: boolean;
  lead_id: string | null;
}

export class FacebookDBService {
  private static supabase = createClient();

  static async saveConnection(
    organizationId: string,
    pageId: string,
    pageName: string,
    accessToken: string,
    expiresAt: Date
  ): Promise<FacebookConnection> {
    const { data, error } = await this.supabase
      .from('facebook_connections')
      .upsert({
        organization_id: organizationId,
        page_id: pageId,
        page_name: pageName,
        access_token: accessToken,
        token_expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async saveForms(
    connectionId: string,
    forms: FacebookForm[]
  ): Promise<FacebookFormDB[]> {
    const formsToUpsert = forms.map(form => ({
      connection_id: connectionId,
      form_id: form.id,
      form_name: form.name,
      status: form.status,
      is_active: true,
    }));

    const { data, error } = await this.supabase
      .from('facebook_forms')
      .upsert(formsToUpsert)
      .select();

    if (error) throw error;
    return data;
  }

  static async saveLead(
    formId: string,
    lead: FacebookLead
  ): Promise<FacebookLeadDB> {
    const { data, error } = await this.supabase
      .from('facebook_leads')
      .upsert({
        form_id: formId,
        facebook_lead_id: lead.id,
        full_name: lead.fieldData.find(f => f.name === 'full_name')?.value,
        email: lead.fieldData.find(f => f.name === 'email')?.value,
        phone: lead.fieldData.find(f => f.name === 'phone')?.value,
        facebook_created_time: lead.createdTime,
        raw_data: lead.fieldData,
        processed: false,
        converted_to_lead: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getActiveConnections(organizationId: string): Promise<FacebookConnection[]> {
    const { data, error } = await this.supabase
      .from('facebook_connections')
      .select('*')
      .eq('organization_id', organizationId)
      .gt('token_expires_at', new Date().toISOString());

    if (error) throw error;
    return data;
  }

  static async getActiveForms(connectionId: string): Promise<FacebookFormDB[]> {
    const { data, error } = await this.supabase
      .from('facebook_forms')
      .select('*')
      .eq('connection_id', connectionId)
      .eq('is_active', true);

    if (error) throw error;
    return data;
  }

  static async getUnprocessedLeads(): Promise<FacebookLeadDB[]> {
    const { data, error } = await this.supabase
      .from('facebook_leads')
      .select('*')
      .eq('processed', false)
      .order('facebook_created_time', { ascending: true });

    if (error) throw error;
    return data;
  }

  static async markLeadAsProcessed(
    leadId: string,
    convertedToLead: boolean = false,
    newLeadId?: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from('facebook_leads')
      .update({
        processed: true,
        converted_to_lead: convertedToLead,
        lead_id: newLeadId,
        conversion_date: new Date().toISOString(),
      })
      .eq('id', leadId);

    if (error) throw error;
  }

  // Métodos para gestionar las integraciones con Facebook
  static async getIntegrations(
    organizationId: string,
    branchId: string
  ): Promise<FacebookIntegration[]> {
    const { data, error } = await this.supabase
      .from('facebook_integrations')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async saveIntegration(
    integration: Omit<FacebookIntegration, 'id' | 'created_at' | 'updated_at'>
  ): Promise<FacebookIntegration> {
    const { data, error } = await this.supabase
      .from('facebook_integrations')
      .insert([integration])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateIntegration(
    id: string,
    updates: Partial<Omit<FacebookIntegration, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<FacebookIntegration> {
    const { data, error } = await this.supabase
      .from('facebook_integrations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteIntegration(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('facebook_integrations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Métodos para gestionar los leads importados de Facebook
  static async saveFacebookLead(
    leadData: Omit<FacebookLead, 'id' | 'created_at'>
  ): Promise<FacebookLead> {
    const { data, error } = await this.supabase
      .from('facebook_leads')
      .insert([leadData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getFacebookLeads(
    organizationId: string,
    branchId: string,
    processed = false
  ): Promise<FacebookLead[]> {
    const { data, error } = await this.supabase
      .from('facebook_leads')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('branch_id', branchId)
      .eq('processed', processed)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async convertToLead(
    facebookLeadId: string,
    userId: string
  ): Promise<Lead> {
    // Obtener el lead de Facebook
    const { data: fbLead, error: fbLeadError } = await this.supabase
      .from('facebook_leads')
      .select('*')
      .eq('id', facebookLeadId)
      .single();

    if (fbLeadError) throw fbLeadError;

    // Extraer datos del lead de Facebook
    const leadData = fbLead.lead_data;
    
    // Crear un nuevo lead en el sistema
    const inquiryNumber = generateInquiryNumber();
    
    // Mapear los campos del formulario de Facebook a los campos de Lead
    // Nota: Esto puede variar según la estructura de datos que devuelva Facebook
    const newLead: Omit<Lead, 'id' | 'created_at'> = {
      inquiry_number: inquiryNumber,
      full_name: this.extractLeadField(leadData, 'full_name', 'name'),
      status: 'new',
      assigned_to: userId,
      origin: 'Facebook Lead Ad',
      province: this.extractLeadField(leadData, 'province', 'city', 'location'),
      phone: this.extractLeadField(leadData, 'phone_number', 'phone'),
      pax_count: Number(this.extractLeadField(leadData, 'pax', 'people', '1')),
      estimated_travel_date: this.extractLeadField(leadData, 'travel_date', new Date().toISOString().split('T')[0]),
      organization_id: fbLead.organization_id,
      branch_id: fbLead.branch_id,
    };

    // Insertar el nuevo lead
    const { data: lead, error: leadError } = await this.supabase
      .from('leads')
      .insert([newLead])
      .select()
      .single();

    if (leadError) throw leadError;

    // Actualizar el lead de Facebook como procesado
    await this.markLeadAsProcessed(
      fbLead.id,
      true,
      lead.id
    );

    return lead;
  }

  // Función auxiliar para extraer campos de los datos del lead de Facebook
  private static extractLeadField(
    leadData: any,
    ...possibleFieldNames: string[]
  ): string {
    if (!leadData || typeof leadData !== 'object') {
      return possibleFieldNames[possibleFieldNames.length - 1];
    }

    // Si los datos vienen en formato field_data de Facebook
    if (Array.isArray(leadData.field_data)) {
      for (const field of leadData.field_data) {
        if (possibleFieldNames.includes(field.name)) {
          return field.values[0];
        }
      }
    }

    // Búsqueda directa en el objeto
    for (const fieldName of possibleFieldNames) {
      if (leadData[fieldName] !== undefined) {
        return leadData[fieldName];
      }
    }

    // Valor por defecto (último elemento del array)
    return possibleFieldNames[possibleFieldNames.length - 1];
  }
} 