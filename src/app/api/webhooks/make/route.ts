import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateInquiryNumber } from '@/lib/utils/strings';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

// Esta función crea un cliente Supabase sin requerir una sesión autenticada
const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase URL or service key is missing');
  }

  // Crear un cliente con la clave de servicio que tiene permisos completos
  return createClient(supabaseUrl, supabaseServiceKey);
};

export async function POST(request: Request) {
  try {
    // Verificar que la petición tiene un secreto válido
    const authHeader = request.headers.get('x-webhook-secret');
    const WEBHOOK_SECRET = process.env.MAKE_WEBHOOK_SECRET;
    
    if (!authHeader || authHeader !== WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Obtener el cuerpo de la petición
    const data = await request.json();
    
    // Usar el cliente admin que no requiere sesión
    const supabase = createAdminClient();

    // Validar que los datos necesarios estén presentes
    if (!data.organization_id || !data.branch_id || !data.form_id || !data.lead_data) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Guardar el lead de Facebook en la base de datos
    const { error: saveError } = await supabase
      .from('facebook_leads')
      .insert([{
        facebook_lead_id: data.facebook_lead_id || `make_${Date.now()}`,
        form_id: data.form_id,
        page_id: data.page_id || 'make_integration',
        organization_id: data.organization_id,
        branch_id: data.branch_id,
        lead_data: data.lead_data,
        processed: false,
        converted_to_lead: false,
      }]);

    if (saveError) {
      console.error('Error guardando lead de Facebook:', saveError);
      return NextResponse.json(
        { error: 'Error guardando lead' },
        { status: 500 }
      );
    }

    // Si está configurado para conversión automática, crear el lead
    if (data.auto_convert === true) {
      try {
        // Generar número de consulta
        const inquiryNumber = generateInquiryNumber();
        
        // Mapear campos del formulario a los campos del lead
        const leadData = data.lead_data;
        
        console.log('Datos recibidos para conversión:', JSON.stringify(leadData, null, 2));
        
        // Extraer los datos para el lead
        const fullName = extractField(leadData, 'full_name', 'name') || 'Sin nombre';
        const phone = extractField(leadData, 'phone_number', 'phone') || '';
        const province = extractField(leadData, 'province', 'city', 'location') || '';
        
        // Usar los campos específicos si están disponibles
        const paxCountFromData = extractField(leadData, 'pax_count', 'pax', 'people');
        let paxCount = 1; // Valor predeterminado
        
        if (paxCountFromData) {
          // Intentar convertir a número
          const parsedValue = Number(paxCountFromData);
          // Verificar si es un número válido
          if (!isNaN(parsedValue)) {
            paxCount = parsedValue;
          } else {
            // Si contiene números, intentar extraerlos
            const numbersOnly = paxCountFromData.match(/\d+/);
            if (numbersOnly && numbersOnly.length > 0) {
              paxCount = Number(numbersOnly[0]);
            }
            // Si sigue siendo NaN, usar el valor predeterminado
            if (isNaN(paxCount)) {
              paxCount = 1;
            }
          }
        }
        
        // Para la fecha de viaje, conservamos el texto tal como viene
        const travelDate = extractField(leadData, 'estimated_travel_date', 'travel_date', 'date') || 'No especificada';
        
        // Usar "Facebook Ads" como origen predeterminado, pero permitir sobrescribirlo
        const origin = extractField(leadData, 'origin') || 'Facebook Ads';

        // Usar un ID de usuario específico que sabemos que existe en la base de datos
        // ID del usuario de la muestra de leads_rows.csv
        const assignedToUserId = '3c6d7374-8403-4bca-bb84-c937c4b5b94f';

        console.log('Datos procesados para el lead:', {
          fullName,
          phone, 
          province,
          paxCount,
          travelDate,
          origin,
          organization_id: data.organization_id,
          branch_id: data.branch_id
        });

        // Insertar el nuevo lead
        const { data: newLead, error: leadError } = await supabase
          .from('leads')
          .insert([{
            inquiry_number: inquiryNumber,
            full_name: fullName,
            status: 'new',
            assigned_to: assignedToUserId,
            origin: origin,
            province: province,
            phone: phone,
            pax_count: paxCount,
            estimated_travel_date: travelDate,
            organization_id: data.organization_id,
            branch_id: data.branch_id,
          }])
          .select()
          .single();

        if (leadError) {
          console.error('Error creando lead:', leadError);
          return NextResponse.json(
            { 
              error: 'Error creando lead', 
              details: leadError, 
              processed_data: {
                fullName,
                phone, 
                province,
                paxCount,
                travelDate,
                origin
              }
            },
            { status: 500 }
          );
        }

        // Actualizar el registro en facebook_leads para marcarlo como convertido
        await supabase
          .from('facebook_leads')
          .update({
            processed: true,
            converted_to_lead: true,
            lead_id: newLead.id,
            conversion_date: new Date().toISOString()
          })
          .eq('facebook_lead_id', data.facebook_lead_id);

        return NextResponse.json({
          success: true,
          message: 'Lead guardado y convertido exitosamente',
          lead_id: newLead.id
        });
      } catch (error) {
        console.error('Error en la conversión del lead:', error);
        return NextResponse.json(
          { 
            error: 'Error en la conversión del lead',
            details: error instanceof Error ? error.message : String(error)
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Lead guardado exitosamente' 
    });
    
  } catch (error) {
    console.error('Error en webhook de Make:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Función auxiliar para extraer campos
function extractField(data: any, ...possibleFieldNames: string[]): string | undefined {
  if (!data) return undefined;
  
  // Si es un objeto con field_data (formato Facebook)
  if (Array.isArray(data.field_data)) {
    for (const field of data.field_data) {
      if (possibleFieldNames.includes(field.name)) {
        return field.values[0];
      }
    }
  }
  
  // Si Make envía los datos ya procesados
  for (const fieldName of possibleFieldNames) {
    if (data[fieldName] !== undefined) {
      return String(data[fieldName]); // Convertir a string para asegurar compatibilidad
    }
  }
  
  // Si el último elemento parece ser un valor por defecto (no tiene aspecto de nombre de campo)
  const lastItem = possibleFieldNames[possibleFieldNames.length - 1];
  if (lastItem && !lastItem.includes('_') && !lastItem.match(/^[a-z]+$/)) {
    return lastItem;
  }
  
  return undefined;
} 