'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { formatDate } from '@/lib/utils/dates';
import { BranchModal } from '@/components/modals/BranchModal';
import { useAuth } from '@/contexts/AuthContext';
import { useBranches, Branch } from '@/hooks/useBranches';

type UserRole = 'super_admin' | 'org_admin' | 'branch_manager' | 'sales_agent';

// TODO: Reemplazar con datos reales de la base de datos
const mockUser = {
  role: 'super_admin' as UserRole,
  email: 'admin@example.com',
  name: 'Admin Usuario',
};

const mockOrganization = {
  name: 'Viajes Example',
};

const statusLabels: Record<Branch['status'], string> = {
  active: 'Activa',
  inactive: 'Inactiva',
};

const statusColors: Record<Branch['status'], { bg: string; text: string }> = {
  active: { bg: 'bg-green-100', text: 'text-green-800' },
  inactive: { bg: 'bg-red-100', text: 'text-red-800' },
};

export default function BranchesPage() {
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | undefined>();
  const { user, currentOrganization, userRole } = useAuth();
  const { branches, isLoading, error, createBranch, updateBranch } = useBranches(
    currentOrganization?.id,
    userRole as UserRole | undefined
  );

  const handleCreateBranch = async (branchData: Omit<Branch, 'id' | 'created_at'>) => {
    try {
      await createBranch.mutateAsync(branchData);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error en handleCreateBranch:', error);
      throw error;
    }
  };

  const handleUpdateBranch = async (branchData: Omit<Branch, 'id' | 'created_at'>) => {
    if (!selectedBranch) return;

    try {
      await updateBranch.mutateAsync({
        id: selectedBranch.id,
        ...branchData,
      });
      setIsModalOpen(false);
      setSelectedBranch(undefined);
    } catch (error) {
      console.error('Error updating branch:', error);
      throw error;
    }
  };

  const handleOpenModal = (branch?: Branch) => {
    setSelectedBranch(branch);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBranch(undefined);
  };

  const filteredBranches = branches.filter((branch) => {
    const matchesStatus = filters.status ? branch.status === filters.status : true;
    const matchesSearch = filters.search
      ? branch.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        branch.description.toLowerCase().includes(filters.search.toLowerCase()) ||
        branch.city.toLowerCase().includes(filters.search.toLowerCase()) ||
        branch.province.toLowerCase().includes(filters.search.toLowerCase())
      : true;

    return matchesStatus && matchesSearch;
  });

  return (
    <MainLayout
      user={{
        role: userRole as UserRole,
        email: user?.email || '',
        name: user?.full_name || '',
      }}
      organization={currentOrganization ? {
        name: currentOrganization.name || ''
      } : undefined}
    >
      <div className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {error instanceof Error ? error.message : 'Error desconocido'}
                </h3>
              </div>
            </div>
          </div>
        )}

        <div className="sm:flex sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">
            {currentOrganization ? `Sucursales - ${currentOrganization.name}` : 'Sucursales'}
          </h1>
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Nueva Sucursal
          </button>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              Buscar
            </label>
            <input
              type="text"
              id="search"
              name="search"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Buscar por nombre, ciudad o provincia"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Estado
            </label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as Branch['status'] })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Todos</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabla de Sucursales */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ubicación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creada
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center space-x-2">
                        <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Cargando...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredBranches.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      No hay sucursales disponibles
                    </td>
                  </tr>
                ) : (
                  filteredBranches.map((branch) => (
                    <tr key={branch.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div>
                          <div className="font-medium">{branch.name}</div>
                          <div className="text-gray-500">{branch.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            statusColors[branch.status as Branch['status']].bg
                          } ${statusColors[branch.status as Branch['status']].text}`}
                        >
                          {statusLabels[branch.status as Branch['status']]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <div>{branch.address}</div>
                          <div>{branch.city}, {branch.province}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <div>{branch.phone}</div>
                          <div>{branch.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(branch.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          type="button"
                          onClick={() => handleOpenModal(branch)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <BranchModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        branch={selectedBranch}
        onSubmit={selectedBranch ? handleUpdateBranch : handleCreateBranch}
      />
    </MainLayout>
  );
} 