import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Lead } from '@/types/supabase';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const supabase = createClient();

export function useLeads(organizationId?: string, branchId?: string) {
  const queryClient = useQueryClient();
  const { refreshSession } = useAuth();

  // Configurar el listener para la sesión
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        // Limpiar la caché cuando el usuario cierra sesión
        queryClient.clear();
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Refrescar los datos cuando el usuario inicia sesión o se refresca el token
        queryClient.invalidateQueries({ queryKey: ['leads'] });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  // Suscripción en tiempo real para leads
  useEffect(() => {
    if (!organizationId || !branchId) return;

    // Suscribirse a cambios en la tabla leads
    const subscription = supabase
      .channel('leads_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Escuchar todos los eventos (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'leads',
          filter: `organization_id=eq.${organizationId} AND branch_id=eq.${branchId}`,
        },
        (payload) => {
          // Actualizar la caché de React Query cuando hay cambios
          queryClient.invalidateQueries({ queryKey: ['leads', organizationId, branchId] });
        }
      )
      .subscribe();

    // Limpiar la suscripción cuando el componente se desmonta
    return () => {
      subscription.unsubscribe();
    };
  }, [organizationId, branchId, queryClient]);

  const query: UseQueryResult<Lead[], Error> = useQuery({
    queryKey: ['leads', organizationId, branchId],
    queryFn: async (): Promise<Lead[]> => {
      if (!organizationId || !branchId) {
        return [];
      }

      try {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('branch_id', branchId)
          .order('created_at', { ascending: false });

        if (error) {
          if (error.message.includes('JWT')) {
            // Si el error es de JWT, intentamos refrescar la sesión usando refreshSession del contexto
            const session = await refreshSession();
            if (session) {
              // Si se refresca exitosamente, reintentamos la consulta
              const result = await query.refetch();
              return result.data || [];
            }
          }
          throw error;
        }

        return data || [];
      } catch (error) {
        console.error('Error fetching leads:', error);
        throw error;
      }
    },
    enabled: !!organizationId && !!branchId,
    gcTime: 3600000, // Mantener en caché por 1 hora
    staleTime: 30000, // Los datos se consideran frescos por 30 segundos
    retry: 3, // Intentar hasta 3 veces si falla
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Espera exponencial entre reintentos
  });

  const createLeadMutation = useMutation({
    mutationFn: async (leadData: Omit<Lead, 'id' | 'created_at'>): Promise<Lead> => {
      try {
        const { data, error } = await supabase
          .from('leads')
          .insert([leadData])
          .select()
          .single();

        if (error) {
          if (error.message.includes('JWT')) {
            // Si el error es de JWT, intentamos refrescar la sesión
            const session = await refreshSession();
            if (session) {
              // Si se refresca exitosamente, reintentamos la mutación
              return createLeadMutation.mutateAsync(leadData);
            }
          }
          throw error;
        }

        if (!data) {
          throw new Error('No se recibieron datos después de crear el lead');
        }

        return data;
      } catch (error) {
        console.error('Error creating lead:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, ...leadData }: Partial<Lead> & { id: string }): Promise<Lead> => {
      try {
        const { data, error } = await supabase
          .from('leads')
          .update(leadData)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          if (error.message.includes('JWT')) {
            // Si el error es de JWT, intentamos refrescar la sesión
            const session = await refreshSession();
            if (session) {
              // Si se refresca exitosamente, reintentamos la mutación
              return updateLeadMutation.mutateAsync({ id, ...leadData });
            }
          }
          throw error;
        }

        if (!data) {
          throw new Error('No se recibieron datos después de actualizar el lead');
        }

        return data;
      } catch (error) {
        console.error('Error updating lead:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const updateLeadStatus = useMutation({
    mutationFn: async ({ leadId, status }: { leadId: string; status: Lead['status'] }) => {
      // Obtener los datos del lead antes de actualizarlo
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (leadError) {
        throw leadError;
      }

      // Estados que convierten un lead en contacto
      const contactStates: Lead['status'][] = ['contacted', 'followed', 'interested', 'reserved', 'liquidated', 'effective_reservation'];

      if (contactStates.includes(status)) {
        // Crear el contacto
        const { error: contactError } = await supabase
          .from('contacts')
          .insert([{
            full_name: lead.full_name,
            email: null, // El email será null por defecto
            phone: lead.phone,
            city: lead.province, // Usamos la provincia como ciudad ya que es el dato más cercano que tenemos
            province: lead.province,
            tag: status, // Usamos el estado como etiqueta inicial
            organization_id: lead.organization_id,
            branch_id: lead.branch_id,
            assigned_to: lead.assigned_to,
            // Campos adicionales del lead
            origin: lead.origin,
            pax_count: lead.pax_count,
            estimated_travel_date: lead.estimated_travel_date,
            original_lead_id: lead.id,
            original_lead_status: status,
            original_lead_inquiry_number: lead.inquiry_number,
          }]);

        if (contactError) {
          throw contactError;
        }

        // En lugar de eliminar el lead, lo marcamos como convertido
        const { error: updateError } = await supabase
          .from('leads')
          .update({ 
            status: status,
            // Opcionalmente podrías agregar un campo para indicar que fue convertido a contacto
            converted_to_contact: true,
          })
          .eq('id', leadId);

        if (updateError) {
          throw updateError;
        }

        // Registrar en el historial
        await supabase.from('lead_history').insert({
          lead_id: leadId,
          action: 'converted_to_contact',
          description: `Lead convertido a contacto con estado ${status}`,
        });

        return;
      }

      // Si no es un estado que convierte a contacto, actualizar normalmente
      const { error } = await supabase
        .from('leads')
        .update({ status })
        .eq('id', leadId);

      if (error) {
        throw error;
      }

      // Registrar el cambio en el historial
      await supabase.from('lead_history').insert({
        lead_id: leadId,
        action: 'status_change',
        description: `Estado cambiado a ${status}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  const updateLeadAssignment = useMutation({
    mutationFn: async ({ leadId, agentId }: { leadId: string; agentId: string | null }) => {
      const { error } = await supabase
        .from('leads')
        .update({ assigned_to: agentId })
        .eq('id', leadId);

      if (error) {
        throw error;
      }

      // Registrar el cambio en el historial
      await supabase.from('lead_history').insert({
        lead_id: leadId,
        action: 'assignment_change',
        description: agentId ? `Lead asignado` : 'Lead sin asignar',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  return {
    leads: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createLead: createLeadMutation,
    updateLead: updateLeadMutation,
    updateLeadStatus,
    updateLeadAssignment,
    refetch: query.refetch,
  };
} 