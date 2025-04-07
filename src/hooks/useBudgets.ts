import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Budget } from '@/types/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { toast } from 'sonner';

const supabase = createClient();

export function useBudgets() {
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
        queryClient.invalidateQueries({ queryKey: ['budgets'] });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  const query: UseQueryResult<Budget[], Error> = useQuery({
    queryKey: ['budgets', currentOrganization?.id, currentBranch?.id],
    queryFn: async (): Promise<Budget[]> => {
      if (!currentOrganization?.id || !currentBranch?.id) {
        return [];
      }

      try {
        const { data, error } = await supabase
          .from('budgets')
          .select(`
            *,
            contacts (
              id,
              full_name,
              email,
              phone
            )
          `)
          .eq('organization_id', currentOrganization.id)
          .eq('branch_id', currentBranch.id)
          .order('created_at', { ascending: false });

        if (error) {
          if (error.message.includes('JWT')) {
            console.log('Error de JWT al cargar presupuestos, intentando refrescar sesión...');
            // Si el error es de JWT, intentamos refrescar la sesión usando refreshSession del contexto
            const session = await refreshSession();
            if (session) {
              // Si se refresca exitosamente, reintentamos la consulta
              console.log('Sesión refrescada, reintentando cargar presupuestos...');
              const result = await query.refetch();
              return result.data || [];
            } else {
              toast.error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
              throw new Error('Sesión expirada');
            }
          }
          throw error;
        }

        return data || [];
      } catch (error) {
        console.error('Error fetching budgets:', error);
        throw error;
      }
    },
    enabled: !!currentOrganization?.id && !!currentBranch?.id,
    gcTime: 3600000, // Mantener en caché por 1 hora
    staleTime: 30000, // Los datos se consideran frescos por 30 segundos
    retry: (failureCount, error) => {
      // No reintentar errores de autenticación
      if (error instanceof Error && error.message.includes('Sesión expirada')) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Espera exponencial entre reintentos
  });

  const createBudgetMutation = useMutation({
    mutationFn: async (budgetData: Omit<Budget, 'id' | 'created_at'>): Promise<Budget> => {
      try {
        const { data, error } = await supabase
          .from('budgets')
          .insert([budgetData])
          .select(`
            *,
            contacts (
              id,
              full_name,
              email,
              phone
            )
          `)
          .single();

        if (error) {
          if (error.message.includes('JWT')) {
            console.log('Error de JWT al crear presupuesto, intentando refrescar sesión...');
            // Si el error es de JWT, intentamos refrescar la sesión usando refreshSession del contexto
            const session = await refreshSession();
            if (session) {
              // Si se refresca exitosamente, reintentamos la mutación
              console.log('Sesión refrescada, reintentando crear presupuesto...');
              return createBudgetMutation.mutateAsync(budgetData);
            } else {
              toast.error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
              throw new Error('Sesión expirada');
            }
          }
          throw error;
        }

        if (!data) {
          throw new Error('No se recibieron datos después de crear el presupuesto');
        }

        return data;
      } catch (error) {
        console.error('Error creating budget:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Presupuesto creado correctamente');
    },
    onError: (error) => {
      toast.error(`Error al crear presupuesto: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  });

  const updateBudgetMutation = useMutation({
    mutationFn: async ({ id, ...budgetData }: Partial<Budget> & { id: string }): Promise<Budget> => {
      try {
        const { data, error } = await supabase
          .from('budgets')
          .update(budgetData)
          .eq('id', id)
          .select(`
            *,
            contacts (
              id,
              full_name,
              email,
              phone
            )
          `)
          .single();

        if (error) {
          if (error.message.includes('JWT')) {
            console.log('Error de JWT al actualizar presupuesto, intentando refrescar sesión...');
            // Si el error es de JWT, intentamos refrescar la sesión usando refreshSession del contexto
            const session = await refreshSession();
            if (session) {
              // Si se refresca exitosamente, reintentamos la mutación
              console.log('Sesión refrescada, reintentando actualizar presupuesto...');
              return updateBudgetMutation.mutateAsync({ id, ...budgetData });
            } else {
              toast.error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
              throw new Error('Sesión expirada');
            }
          }
          throw error;
        }

        if (!data) {
          throw new Error('No se recibieron datos después de actualizar el presupuesto');
        }

        return data;
      } catch (error) {
        console.error('Error updating budget:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Presupuesto actualizado correctamente');
    },
    onError: (error) => {
      toast.error(`Error al actualizar presupuesto: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  });

  return {
    budgets: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createBudget: createBudgetMutation,
    updateBudget: updateBudgetMutation,
    refetch: query.refetch,
  };
} 