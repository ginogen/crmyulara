'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import UserManagement from '@/components/UserManagement';
import { useAuth } from '@/contexts/AuthContext';

export default function UsersPage() {
  const { user, currentOrganization, currentBranch, userRole } = useAuth();

  return (
    <MainLayout
      user={{
        role: userRole as 'super_admin' | 'org_admin' | 'branch_manager' | 'sales_agent',
        email: user?.email || '',
        name: user?.full_name || '',
      }}
      organization={currentOrganization ? {
        name: currentOrganization.custom_name
      } : undefined}
      branch={currentBranch ? {
        name: currentBranch.name
      } : undefined}
    >
      <div className="space-y-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Gestión de Usuarios</h1>
        </div>
        <UserManagement />
      </div>
    </MainLayout>
  );
} 