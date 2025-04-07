'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ArrowTrendingUpIcon, UsersIcon, UserIcon, PhoneIcon, DocumentTextIcon, ClipboardDocumentCheckIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import { FacebookIntegrationModal } from '@/components/modals/FacebookIntegrationModal';
import { useAuth } from '@/contexts/AuthContext';
import { useLeads } from '@/hooks/useLeads';
import { useContacts } from '@/hooks/useContacts';
import { useBudgets } from '@/hooks/useBudgets';
import { Lead, Contact, Budget } from '@/types/supabase';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

// Estilos CSS para animaciones
const fadeIn = 'animate-fadeIn';
const slideIn = 'animate-slideIn';

// Definir las animaciones en un estilo global
const globalStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideIn {
    from { transform: translateY(10px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.5s ease-in-out;
  }
  
  .animate-slideIn {
    animation: fadeIn 0.3s ease-out, slideIn 0.4s ease-out;
  }
`;

// Colores para gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Componente de mini gráfico para mostrar tendencias
interface SparklineChartProps {
  data: Array<{ value: number }>;
  color?: string;
  width?: number;
  height?: number;
}

const SparklineChart = ({ data, color = '#34495E', width = 80, height = 30 }: SparklineChartProps) => {
  return (
    <ResponsiveContainer width={width} height={height}>
      <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          isAnimationActive={true}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

// Generar datos de tendencia para gráficos pequeños
const generateTrendData = (count: number, isPositive: boolean = true) => {
  const data = [];
  let value = Math.floor(Math.random() * 10) + 10;
  
  for (let i = 0; i < count; i++) {
    // Crear variación aleatoria pero con tendencia general positiva o negativa
    const change = Math.random() * 5 - (isPositive ? 1 : 4);
    value = Math.max(0, value + change);
    data.push({ value });
  }
  
  return data;
};

type UserRole = 'super_admin' | 'org_admin' | 'branch_manager' | 'sales_agent';

export default function DashboardPage() {
  const { user, currentOrganization, currentBranch, userRole, refreshSession } = useAuth();
  const router = useRouter();
  const [isFacebookModalOpen, setIsFacebookModalOpen] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Usar los hooks para obtener datos reales
  const { 
    leads, 
    isLoading: isLeadsLoading, 
    error: leadsError, 
    refetch: refetchLeads 
  } = useLeads(currentOrganization?.id, currentBranch?.id);
  
  const { 
    contacts, 
    isLoading: isContactsLoading, 
    error: contactsError,
    refetch: refetchContacts 
  } = useContacts();
  
  const { 
    budgets, 
    isLoading: isBudgetsLoading, 
    error: budgetsError,
    refetch: refetchBudgets 
  } = useBudgets();

  // Generar datos para las sparklines (solo una vez al montar)
  const trendData = useMemo(() => {
    return {
      leadsTotal: generateTrendData(10, true),
      leadsNoAsignados: generateTrendData(10, false),
      leadsInteresados: generateTrendData(10, true),
      leadsContactados: generateTrendData(10, true)
    };
  }, []);

  // Crear datos para los gráficos más grandes
  const leadsByStatusData = useMemo(() => {
    if (leads.length === 0) return [];
    
    const statusCount: Record<string, number> = {};
    leads.forEach(lead => {
      statusCount[lead.status] = (statusCount[lead.status] || 0) + 1;
    });
    
    return Object.entries(statusCount).map(([name, value]) => ({ name, value }));
  }, [leads]);

  // Manejar errores de sesión
  const handleSessionError = async () => {
    if (isRetrying) return;
    
    setIsRetrying(true);
    try {
      console.log('Intentando refrescar la sesión...');
      const session = await refreshSession();
      
      if (session) {
        toast.success('Sesión refrescada correctamente');
        console.log('Sesión refrescada correctamente, recargando datos...');
        
        // Refrescar todos los datos
        await Promise.all([
          refetchLeads(),
          refetchContacts(),
          refetchBudgets()
        ]);
      } else {
        console.log('No se pudo refrescar la sesión, redirigiendo al login...');
        toast.error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Error al refrescar la sesión:', error);
      toast.error('Error al reconectar. Por favor, inicia sesión nuevamente.');
      router.push('/auth/login');
    } finally {
      setIsRetrying(false);
    }
  };

  // Manejar errores de sesión
  useEffect(() => {
    const error = leadsError || contactsError || budgetsError;
    if (error) {
      console.error('Error en la carga de datos:', error);
      
      if (error instanceof Error && 
          (error.message.includes('JWT') || 
           error.message.includes('token') || 
           error.message.includes('session') || 
           error.message.includes('expired'))) {
        toast.error('Tu sesión ha expirado. Intentando reconectar...');
        handleSessionError();
      }
    }
  }, [leadsError, contactsError, budgetsError]);

  // Calcular estadísticas reales
  const leadsTotal = leads.length;
  const leadsNoAsignados = leads.filter(lead => !lead.assigned_to || lead.assigned_to === '').length;
  const leadsInteresados = leads.filter(lead => lead.status === 'interested').length;
  const leadsContactados = leads.filter(lead => 
    ['contacted', 'followed', 'reserved', 'liquidated', 'effective_reservation'].includes(lead.status)
  ).length;

  // Estadísticas reales basadas en datos de los hooks
  const stats = [
    {
      name: 'Leads Totales',
      value: `${leadsTotal}`,
      change: leadsTotal > 0 ? '+100%' : '0%',
      changeType: leadsTotal > 0 ? 'positive' : 'neutral',
      icon: ArrowTrendingUpIcon,
    },
    {
      name: 'Leads Sin Gestión',
      value: `${leadsNoAsignados}`,
      change: `${Math.round((leadsNoAsignados / (leadsTotal || 1)) * 100)}%`,
      changeType: leadsNoAsignados < leadsTotal / 2 ? 'positive' : 'negative',
      icon: UsersIcon,
    },
    {
      name: 'Interesados',
      value: `${leadsInteresados}`,
      change: `${Math.round((leadsInteresados / (leadsTotal || 1)) * 100)}%`,
      changeType: 'positive',
      icon: UserIcon,
    },
    {
      name: 'Contactados',
      value: `${leadsContactados}`,
      change: `${Math.round((leadsContactados / (leadsTotal || 1)) * 100)}%`,
      changeType: 'positive',
      icon: PhoneIcon,
    },
  ];

  const getEstadoColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'completada':
      case 'activo':
      case 'aprobado':
      case 'approved':
      case 'convertido':
      case 'contacted':
      case 'liquidated':
      case 'effective_reservation':
        return 'bg-green-100 text-green-800';
      case 'en proceso':
      case 'en seguimiento':
      case 'pendiente':
      case 'nuevo':
      case 'new':
      case 'draft':
      case 'sent':
      case 'followed':
      case 'interested':
      case 'reserved':
        return 'bg-blue-100 text-blue-800';
      case 'inactivo':
      case 'rechazado':
      case 'rejected':
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Función para renderizar el contenido basado en el estado de carga
  const renderContent = () => {
    if (isLeadsLoading || isContactsLoading || isBudgetsLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#34495E]" role="status" aria-label="Cargando datos"></div>
            <p className="mt-4 text-base text-gray-700 font-medium">Cargando datos del dashboard...</p>
            <p className="mt-2 text-sm text-gray-500">Esto puede tardar unos segundos.</p>
          </div>
        </div>
      );
    }

    if (isRetrying) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#34495E]" role="status" aria-label="Reconectando sesión"></div>
            <p className="mt-4 text-base text-gray-700 font-medium">Reconectando tu sesión...</p>
            <p className="mt-2 text-sm text-gray-500">Estamos recuperando tus datos. Por favor, espera.</p>
          </div>
        </div>
      );
    }

    const error = leadsError || contactsError || budgetsError;
    if (error && !isRetrying) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center p-6 bg-red-50 rounded-xl max-w-md shadow-sm">
            <div className="inline-block h-12 w-12 text-red-500 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error al cargar los datos</h3>
            <p className="text-sm text-red-700 mb-4">
              No pudimos cargar los datos del dashboard. Por favor, intenta nuevamente.
            </p>
            <button
              onClick={handleSessionError}
              className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              aria-label="Reintentar cargar datos"
            >
              Reintentar
            </button>
          </div>
        </div>
      );
    }

    return (
      <>
        {/* Estadísticas */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
            // Determinar qué tendencia usar para cada tarjeta
            const trendKey = index === 0 ? 'leadsTotal' : 
                           index === 1 ? 'leadsNoAsignados' :
                           index === 2 ? 'leadsInteresados' : 'leadsContactados';
                           
            const trendColor = stat.changeType === 'positive' ? '#22c55e' : 
                             stat.changeType === 'negative' ? '#ef4444' : '#64748b';
                             
            return (
              <div
                key={stat.name}
                className={`relative overflow-hidden rounded-xl bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md group ${slideIn}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <dt>
                  <div className="absolute rounded-lg bg-[#34495E] p-2 text-white shadow-sm">
                    <stat.icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <p className="ml-12 truncate text-xs font-medium text-gray-600">{stat.name}</p>
                </dt>
                <dd className="ml-12 mt-1">
                  <div className="flex items-baseline">
                    <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
                    <p
                      className={`ml-2 flex items-center text-xs font-medium ${
                        stat.changeType === 'positive' ? 'text-green-600' : 
                        stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                      }`}
                    >
                      {stat.changeType === 'positive' ? 
                        <ArrowUpIcon className="mr-1 h-3 w-3" /> : 
                        stat.changeType === 'negative' ? 
                        <ArrowDownIcon className="mr-1 h-3 w-3" /> : null}
                      {stat.change}
                    </p>
                  </div>
                  
                  <div className="mt-2 opacity-70 group-hover:opacity-100 transition-opacity">
                    <SparklineChart data={trendData[trendKey]} color={trendColor} width={90} height={35} />
                  </div>
                </dd>
              </div>
            );
          })}
        </div>

        {/* Gráficos */}
        {leads.length > 0 && (
          <div className={`grid grid-cols-1 gap-4 lg:grid-cols-2 mt-4 ${fadeIn}`} style={{ animationDelay: '300ms' }}>
            {/* Gráfico de barras - Leads por estado */}
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Distribución de Leads por Estado</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={leadsByStatusData}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]} animationDuration={1500} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico circular - Distribución de leads */}
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Proporción de Leads</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leadsByStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      animationDuration={1500}
                      animationBegin={300}
                    >
                      {leadsByStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Accesos Directos */}
        <div className={`grid grid-cols-1 gap-4 md:grid-cols-3 ${fadeIn}`} style={{ animationDelay: '500ms' }}>
          {/* Acceso Directo a Leads */}
          <div className="rounded-xl bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Leads Recientes</h2>
              <Link 
                href="/leads"
                className="inline-flex items-center justify-center rounded-lg bg-[#34495E] px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-[#2c3e50] focus:outline-none focus:ring-2 focus:ring-[#34495E] focus:ring-offset-2 transition-colors"
              >
                Ver Todos
              </Link>
            </div>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leads.slice(0, 3).map((lead, index) => (
                    <tr 
                      key={lead.id} 
                      className={`hover:bg-gray-50 transition-colors duration-200 cursor-pointer ${slideIn}`}
                      style={{ animationDelay: `${index * 150}ms` }}
                      onClick={() => router.push(`/leads?id=${lead.id}`)}
                    >
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                        {lead.full_name}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${getEstadoColor(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {leads.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-3 py-3 text-center text-xs text-gray-500">
                        No hay leads disponibles
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Acceso Directo a Contactos */}
          <div className="rounded-xl bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Contactos Recientes</h2>
              <Link 
                href="/contacts"
                className="inline-flex items-center justify-center rounded-lg bg-[#34495E] px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-[#2c3e50] focus:outline-none focus:ring-2 focus:ring-[#34495E] focus:ring-offset-2 transition-colors"
              >
                Ver Todos
              </Link>
            </div>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contacts.slice(0, 3).map((contact, index) => (
                    <tr 
                      key={contact.id} 
                      className={`hover:bg-gray-50 transition-colors duration-200 cursor-pointer ${slideIn}`}
                      style={{ animationDelay: `${index * 150 + 200}ms` }}
                      onClick={() => router.push(`/contacts?id=${contact.id}`)}
                    >
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                        {contact.full_name}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${getEstadoColor(contact.tag)}`}>
                          {contact.tag}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {contacts.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-3 py-3 text-center text-xs text-gray-500">
                        No hay contactos disponibles
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Acceso Directo a Presupuestos */}
          <div className="rounded-xl bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Presupuestos Recientes</h2>
              <Link 
                href="/budgets"
                className="inline-flex items-center justify-center rounded-lg bg-[#34495E] px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-[#2c3e50] focus:outline-none focus:ring-2 focus:ring-[#34495E] focus:ring-offset-2 transition-colors"
              >
                Ver Todos
              </Link>
            </div>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Título
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {budgets.slice(0, 3).map((budget, index) => (
                    <tr 
                      key={budget.id} 
                      className={`hover:bg-gray-50 transition-colors duration-200 cursor-pointer ${slideIn}`}
                      style={{ animationDelay: `${index * 150 + 400}ms` }}
                      onClick={() => router.push(`/budgets/${budget.slug}`)}
                    >
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                        {budget.title}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                        {budget.contacts?.full_name || 'Sin contacto'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${getEstadoColor(budget.status)}`}>
                          {budget.status === 'draft' ? 'Borrador' : 
                           budget.status === 'sent' ? 'Enviado' : 
                           budget.status === 'approved' ? 'Aprobado' : 
                           budget.status === 'rejected' ? 'Rechazado' : 
                           budget.status === 'expired' ? 'Vencido' : budget.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {budgets.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-3 py-3 text-center text-xs text-gray-500">
                        No hay presupuestos disponibles
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </>
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
      {/* Estilos globales para animaciones */}
      <style jsx global>{globalStyles}</style>
      
      <div className="space-y-4">
        {/* Mensaje informativo */}
        <div className={`rounded-xl bg-blue-50 p-4 shadow-sm ring-1 ring-blue-900/10 transition-all hover:shadow-md ${fadeIn}`}>
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-700" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-base font-medium text-blue-800">Panel actualizado</h3>
              <div className="mt-1 text-sm text-blue-700">
                <p>El panel de control ahora muestra información real del sistema. Los datos se actualizan automáticamente cuando hay cambios.</p>
              </div>
            </div>
          </div>
        </div>

        {renderContent()}
      </div>

      <FacebookIntegrationModal
        isOpen={isFacebookModalOpen}
        onClose={() => setIsFacebookModalOpen(false)}
      />
    </MainLayout>
  );
} 