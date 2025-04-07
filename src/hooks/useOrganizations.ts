import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export interface Organization {
  id: string;
  created_at: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  contact_name: string;
  contact_email: string;
  contact_phone: string;
}

export function useOrganizations() {
  const queryClient = useQueryClient();

  const {
    data: organizations = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    },
  });

  const createOrganization = useMutation({
    mutationFn: async (organizationData: Omit<Organization, 'id' | 'created_at'>) => {
      const dataToInsert = {
        ...organizationData,
        status: organizationData.status || 'active',
      };

      const { data, error } = await supabase
        .from('organizations')
        .insert(dataToInsert)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('No se recibieron datos después de crear la organización');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });

  const updateOrganization = useMutation({
    mutationFn: async ({ id, ...organizationData }: Partial<Organization> & { id: string }) => {
      const dataToUpdate = {
        ...organizationData,
        status: organizationData.status || 'active',
      };

      const { data, error } = await supabase
        .from('organizations')
        .update(dataToUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('No se recibieron datos después de actualizar la organización');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });

  return {
    organizations,
    isLoading,
    error,
    createOrganization,
    updateOrganization,
  };
} 