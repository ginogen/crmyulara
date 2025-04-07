'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { createClient } from '@/lib/supabase/client';
import { Budget } from '@/types/supabase';
import { formatMoney } from '@/lib/utils/strings';
import { formatDate } from '@/lib/utils/dates';
import { BudgetModal } from '@/components/modals/BudgetModal';
import { useAuth } from '@/contexts/AuthContext';
import { useBudgets } from '@/hooks/useBudgets';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type UserRole = 'super_admin' | 'org_admin' | 'branch_manager' | 'sales_agent';

const statusLabels: Record<Budget['status'], string> = {
  draft: 'Borrador',
  sent: 'Enviado',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  expired: 'Vencido',
};

const statusColors: Record<Budget['status'], { bg: string; text: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-800' },
  sent: { bg: 'bg-blue-100', text: 'text-blue-800' },
  approved: { bg: 'bg-green-100', text: 'text-green-800' },
  rejected: { bg: 'bg-red-100', text: 'text-red-800' },
  expired: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
};

export default function BudgetsPage() {
  const { user, currentOrganization, currentBranch, userRole, refreshSession } = useAuth();
  const router = useRouter();
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | undefined>();
  const [isRetrying, setIsRetrying] = useState(false);

  const {
    budgets,
    isLoading,
    error,
    createBudget,
    updateBudget,
    refetch,
  } = useBudgets();

  // Manejar errores de sesión
  useEffect(() => {
    if (error) {
      console.error('Error en useBudgets:', error);
      
      if (error instanceof Error && 
          (error.message.includes('JWT') || 
           error.message.includes('token') || 
           error.message.includes('session') || 
           error.message.includes('expired'))) {
        toast.error('Tu sesión ha expirado. Intentando reconectar...');
        handleSessionError();
      }
    }
  }, [error]);

  // Función para manejar errores de sesión
  const handleSessionError = async () => {
    setIsRetrying(true);
    try {
      console.log('Intentando refrescar la sesión...');
      const session = await refreshSession();
      
      if (session) {
        console.log('Sesión refrescada correctamente, recargando datos...');
        await refetch();
        toast.success('¡Conexión restablecida!');
      } else {
        console.log('No se pudo refrescar la sesión, redirigiendo a login...');
        toast.error('La sesión ha expirado. Por favor, inicia sesión nuevamente.');
        router.push('/login');
      }
    } catch (e) {
      console.error('Error al refrescar la sesión:', e);
      toast.error('Error al reconectar. Por favor, recarga la página.');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleCreateBudget = async (budgetData: Omit<Budget, 'id' | 'created_at'>) => {
    try {
      await createBudget.mutateAsync(budgetData);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error creating budget:', error);
      // El error ya se maneja en el hook con toast
    }
  };

  const handleUpdateBudget = async (budgetData: Omit<Budget, 'id' | 'created_at'>) => {
    if (!selectedBudget) return;

    try {
      await updateBudget.mutateAsync({
        id: selectedBudget.id,
        ...budgetData,
      });
      setIsModalOpen(false);
      setSelectedBudget(undefined);
    } catch (error) {
      console.error('Error updating budget:', error);
      // El error ya se maneja en el hook con toast
    }
  };

  const handleOpenModal = (budget?: Budget) => {
    setSelectedBudget(budget);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBudget(undefined);
  };

  const filteredBudgets = budgets.filter((budget) => {
    const matchesStatus = filters.status ? budget.status === filters.status : true;
    const matchesSearch = filters.search
      ? budget.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        budget.description.toLowerCase().includes(filters.search.toLowerCase())
      : true;

    return matchesStatus && matchesSearch;
  });

  const renderContent = () => {
    if (isLoading || isRetrying) {
      return (
        <div className="flex justify-center items-center py-10">
          <div className="flex flex-col items-center">
            <div className="flex items-center space-x-2">
              <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Cargando presupuestos...</span>
            </div>
          </div>
        </div>
      );
    }

    if (error && !isRetrying) {
      return (
        <div className="py-8 px-4 text-center">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mx-auto max-w-lg">
            <div className="flex flex-col items-center">
              <svg className="h-12 w-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-red-800">Error al cargar los presupuestos</h3>
              <p className="mt-2 text-sm text-red-700">
                {error instanceof Error ? error.message : 'Ocurrió un error desconocido'}
              </p>
              <button
                onClick={handleSessionError}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (filteredBudgets.length === 0) {
      return (
        <div className="py-8 px-4 text-center bg-white shadow rounded-md">
          <p className="text-gray-500">No hay presupuestos disponibles</p>
        </div>
      );
    }

    return (
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Título
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contacto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Válido hasta
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Creado
            </th>
            <th className="relative px-6 py-3">
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredBudgets.map((budget) => (
            <tr key={budget.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {budget.title}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    statusColors[budget.status].bg
                  } ${statusColors[budget.status].text}`}
                >
                  {statusLabels[budget.status]}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {budget.contacts?.full_name || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(budget.valid_until)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(budget.created_at)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                <button
                  type="button"
                  onClick={() => handleOpenModal(budget)}
                  className="text-blue-600 hover:text-blue-900"
                >
                  Editar
                </button>
                <a
                  href={`/budgets/${budget.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-900"
                >
                  Ver
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <MainLayout 
      user={{
        role: userRole as UserRole,
        email: user?.email || '',
        name: user?.full_name || '',
      }}
      organization={currentOrganization ? {
        name: currentOrganization.name
      } : undefined}
      branch={currentBranch ? {
        name: currentBranch.name
      } : undefined}
    >
      <div className="space-y-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Presupuestos</h1>
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isLoading || isRetrying}
          >
            Nuevo Presupuesto
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
              placeholder="Buscar por título o descripción"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              disabled={isLoading || isRetrying}
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
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              disabled={isLoading || isRetrying}
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

        {/* Tabla de Presupuestos */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="overflow-x-auto">
            {renderContent()}
          </div>
        </div>
      </div>

      <BudgetModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        budget={selectedBudget}
        onSubmit={selectedBudget ? handleUpdateBudget : handleCreateBudget}
      />
    </MainLayout>
  );
} 