import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export interface Branch {
  id: string;
  created_at: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  address: string;
  city: string;
  province: string;
  phone: string;
  email: string;
  manager_id: string;
  organization_id: string;
}

type UserRole = 'super_admin' | 'org_admin' | 'branch_manager' | 'sales_agent';

export function useBranches(organizationId?: string, userRole?: UserRole) {
  const queryClient = useQueryClient();

  const {
    data: branches = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['branches', organizationId],
    queryFn: async () => {
      let query = supabase
        .from('branches')
        .select('*')
        .order('created_at', { ascending: false });

      // Filtrar por organización si no es super_admin
      if (userRole !== 'super_admin' && organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];
    },
    enabled: userRole === 'super_admin' || !!organizationId,
  });

  const createBranch = useMutation({
    mutationFn: async (branchData: Omit<Branch, 'id' | 'created_at'>) => {
      const dataToInsert = {
        ...branchData,
        organization_id: userRole === 'super_admin' 
          ? branchData.organization_id 
          : organizationId
      };

      const { data, error } = await supabase
        .from('branches')
        .insert([dataToInsert])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('No se recibieron datos después de crear la sucursal');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
  });

  const updateBranch = useMutation({
    mutationFn: async ({ id, ...branchData }: Partial<Branch> & { id: string }) => {
      const dataToUpdate = {
        ...branchData,
        organization_id: userRole === 'super_admin'
          ? branchData.organization_id
          : organizationId
      };

      const { data, error } = await supabase
        .from('branches')
        .update(dataToUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('No se recibieron datos después de actualizar la sucursal');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
  });

  return {
    branches,
    isLoading,
    error,
    createBranch,
    updateBranch,
  };
} 