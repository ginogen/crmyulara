'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { OrganizationModal } from '@/components/modals/OrganizationModal';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizations, Organization } from '@/hooks/useOrganizations';

const statusLabels: Record<Organization['status'], string> = {
  active: 'Activa',
  inactive: 'Inactiva',
};

const statusColors: Record<Organization['status'], { bg: string; text: string }> = {
  active: { bg: 'bg-green-100', text: 'text-green-800' },
  inactive: { bg: 'bg-red-100', text: 'text-red-800' },
};

type UserRole = 'super_admin' | 'org_admin' | 'branch_manager' | 'sales_agent';

export default function OrganizationsPage() {
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | undefined>();
  const { user, userRole } = useAuth();
  const { organizations, isLoading, error, createOrganization, updateOrganization } = useOrganizations();

  const handleCreateOrganization = async (organizationData: Omit<Organization, 'id' | 'created_at'>) => {
    try {
      await createOrganization.mutateAsync(organizationData);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error en handleCreateOrganization:', error);
      throw error;
    }
  };

  const handleUpdateOrganization = async (organizationData: Omit<Organization, 'id' | 'created_at'>) => {
    if (!selectedOrganization) return;

    try {
      await updateOrganization.mutateAsync({
        id: selectedOrganization.id,
        ...organizationData,
      });
      setIsModalOpen(false);
      setSelectedOrganization(undefined);
    } catch (error) {
      console.error('Error updating organization:', error);
      throw error;
    }
  };

  const handleOpenModal = (organization?: Organization) => {
    setSelectedOrganization(organization);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrganization(undefined);
  };

  const filteredOrganizations = organizations.filter((org) => {
    const matchesStatus = filters.status ? org.status === filters.status : true;
    const matchesSearch = filters.search
      ? org.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        org.description.toLowerCase().includes(filters.search.toLowerCase())
      : true;

    return matchesStatus && matchesSearch;
  });

  if (!user || userRole !== 'super_admin') {
    return (
      <MainLayout
        user={{
          role: (userRole as UserRole) || 'sales_agent',
          email: user?.email || '',
          name: user?.full_name || '',
        }}
      >
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900">Acceso Denegado</h2>
          <p className="mt-2 text-gray-600">No tienes permisos para ver esta página.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      user={{
        role: (userRole as UserRole) || 'sales_agent',
        email: user?.email || '',
        name: user?.full_name || '',
      }}
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
          <h1 className="text-2xl font-semibold text-gray-900">Organizaciones</h1>
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Nueva Organización
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
              placeholder="Buscar por nombre o descripción"
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
              onChange={(e) => setFilters({ ...filters, status: e.target.value as Organization['status'] })}
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

        {/* Tabla de Organizaciones */}
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
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center items-center space-x-2">
                        <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Cargando...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredOrganizations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      No hay organizaciones disponibles
                    </td>
                  </tr>
                ) : (
                  filteredOrganizations.map((organization) => (
                    <tr key={organization.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{organization.name}</div>
                        <div className="text-sm text-gray-500">{organization.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            statusColors[organization.status as Organization['status']].bg
                          } ${statusColors[organization.status as Organization['status']].text}`}
                        >
                          {statusLabels[organization.status as Organization['status']]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {organization.contact_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {organization.contact_email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {organization.contact_phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleOpenModal(organization)}
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

      <OrganizationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        organization={selectedOrganization}
        onSubmit={selectedOrganization ? handleUpdateOrganization : handleCreateOrganization}
      />
    </MainLayout>
  );
} 