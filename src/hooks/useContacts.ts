import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Contact } from '@/types/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

const supabase = createClient();

export function useContacts() {
  const queryClient = useQueryClient();
  const { currentOrganization, currentBranch, refreshSession } = useAuth();

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
        queryClient.invalidateQueries({ queryKey: ['contacts'] });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  const query: UseQueryResult<Contact[], Error> = useQuery({
    queryKey: ['contacts', currentOrganization?.id, currentBranch?.id],
    queryFn: async (): Promise<Contact[]> => {
      if (!currentOrganization?.id || !currentBranch?.id) {
        return [];
      }

      try {
        const { data, error } = await supabase
          .from('contacts')
          .select(`
            *,
            original_lead_id,
            original_lead_status,
            original_lead_inquiry_number,
            origin,
            pax_count,
            estimated_travel_date
          `)
          .eq('organization_id', currentOrganization.id)
          .eq('branch_id', currentBranch.id)
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
        console.error('Error fetching contacts:', error);
        throw error;
      }
    },
    enabled: !!currentOrganization?.id && !!currentBranch?.id,
    gcTime: 3600000, // Mantener en caché por 1 hora
    staleTime: 30000, // Los datos se consideran frescos por 30 segundos
    retry: 3, // Intentar hasta 3 veces si falla
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Espera exponencial entre reintentos
  });

  const createContactMutation = useMutation({
    mutationFn: async (contactData: Omit<Contact, 'id' | 'created_at'>): Promise<Contact> => {
      try {
        const { data, error } = await supabase
          .from('contacts')
          .insert([contactData])
          .select()
          .single();

        if (error) {
          if (error.message.includes('JWT')) {
            // Si el error es de JWT, intentamos refrescar la sesión usando refreshSession del contexto
            const session = await refreshSession();
            if (session) {
              // Si se refresca exitosamente, reintentamos la mutación
              return createContactMutation.mutateAsync(contactData);
            }
          }
          throw new Error(error.message);
        }

        if (!data) {
          throw new Error('No se recibieron datos después de crear el contacto');
        }

        return data;
      } catch (error) {
        console.error('Error creating contact:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: async ({ id, ...contactData }: Partial<Contact> & { id: string }): Promise<Contact> => {
      try {
        const { data, error } = await supabase
          .from('contacts')
          .update(contactData)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          if (error.message.includes('JWT')) {
            // Si el error es de JWT, intentamos refrescar la sesión usando refreshSession del contexto
            const session = await refreshSession();
            if (session) {
              // Si se refresca exitosamente, reintentamos la mutación
              return updateContactMutation.mutateAsync({ id, ...contactData });
            }
          }
          throw new Error(error.message);
        }

        if (!data) {
          throw new Error('No se recibieron datos después de actualizar el contacto');
        }

        return data;
      } catch (error) {
        console.error('Error updating contact:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  return {
    contacts: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createContact: createContactMutation,
    updateContact: updateContactMutation,
    refetch: query.refetch,
  };
} 