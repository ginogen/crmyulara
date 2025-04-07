'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { createClient } from '@/lib/supabase/client';
import { Lead } from '@/types/supabase';
import { formatPhoneNumber } from '@/lib/utils/strings';
import { formatDate } from '@/lib/utils/dates';
import { LeadModal } from '@/components/modals/LeadModal';
import { FacebookIntegrationModal } from '@/components/modals/FacebookIntegrationModal';
import { MakeIntegrationModal } from '@/components/modals/MakeIntegrationModal';
import { LeadHistoryModal } from '@/components/modals/LeadHistoryModal';
import { LeadTasksModal } from '@/components/modals/LeadTasksModal';
import { generateInquiryNumber } from '@/lib/utils/strings';
import { useAuth } from '@/contexts/AuthContext';
import { useLeads } from '@/hooks/useLeads';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

type UserRole = 'super_admin' | 'org_admin' | 'branch_manager' | 'sales_agent';

const statusLabels: Record<Lead['status'], string> = {
  new: 'Nuevo',
  assigned: 'Asignado',
  contacted: 'Contactado',
  followed: 'Seguido',
  interested: 'Interesado',
  reserved: 'Reservado',
  liquidated: 'Liquidado',
  effective_reservation: 'Reserva Efectiva',
};

const statusColors: Record<Lead['status'], { bg: string; text: string }> = {
  new: { bg: 'bg-gray-100', text: 'text-gray-800' },
  assigned: { bg: 'bg-blue-100', text: 'text-blue-800' },
  contacted: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  followed: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  interested: { bg: 'bg-green-100', text: 'text-green-800' },
  reserved: { bg: 'bg-purple-100', text: 'text-purple-800' },
  liquidated: { bg: 'bg-red-100', text: 'text-red-800' },
  effective_reservation: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
};

export default function LeadsPage() {
  const { user, currentOrganization, currentBranch, userRole, loading } = useAuth();
  const [filters, setFilters] = useState({
    status: '',
    assignedTo: '',
    search: '',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | undefined>();
  const [isFacebookModalOpen, setIsFacebookModalOpen] = useState(false);
  const [isMakeModalOpen, setIsMakeModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isTasksModalOpen, setIsTasksModalOpen] = useState(false);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState<string | null>(null);
  const [agents, setAgents] = useState<Array<{ id: string; full_name: string }>>([]);
  const supabase = createClient();

  const {
    leads,
    isLoading,
    error,
    createLead,
    updateLead,
    updateLeadStatus,
    updateLeadAssignment,
  } = useLeads(currentOrganization?.id, currentBranch?.id);

  useEffect(() => {
    const fetchAgents = async () => {
      if (!currentOrganization?.id || !currentBranch?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, full_name')
          .eq('organization_id', currentOrganization.id)
          .eq('branch_id', currentBranch.id);

        if (error) throw error;
        setAgents(data || []);
      } catch (error) {
        console.error('Error fetching agents:', error);
      }
    };

    fetchAgents();
  }, [currentOrganization?.id, currentBranch?.id]);

  const handleCreateLead = async (leadData: Omit<Lead, 'id' | 'created_at' | 'inquiry_number'>) => {
    if (loading) {
      console.log('Sistema cargando, espere por favor');
      return;
    }

    if (!user?.id || !currentOrganization?.id || !currentBranch?.id) {
      const errorMsg = 'No se puede crear el lead porque faltan datos requeridos';
      console.error(errorMsg, { 
        userId: user?.id, 
        organizationId: currentOrganization?.id, 
        branchId: currentBranch?.id 
      });
      throw new Error(errorMsg);
    }

    try {
      const inquiryNumber = generateInquiryNumber();
      await createLead.mutateAsync({
        ...leadData,
        inquiry_number: inquiryNumber,
        organization_id: currentOrganization.id,
        branch_id: currentBranch.id,
        assigned_to: user.id,
      });
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Error en handleCreateLead:', error);
      throw error;
    }
  };

  const handleUpdateLead = async (leadData: Omit<Lead, 'id' | 'created_at' | 'inquiry_number'>) => {
    if (!selectedLead || !currentOrganization?.id || !currentBranch?.id) return;

    try {
      await updateLead.mutateAsync({
        id: selectedLead.id,
        ...leadData,
        organization_id: currentOrganization.id,
        branch_id: currentBranch.id,
        inquiry_number: selectedLead.inquiry_number,
      });
      setIsModalOpen(false);
      setSelectedLead(undefined);
    } catch (error) {
      console.error('Error updating lead:', error);
    }
  };

  const handleOpenModal = (lead?: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLead(undefined);
  };

  const handleStatusChange = async (leadId: string, newStatus: Lead['status']) => {
    try {
      const contactStates: Lead['status'][] = ['contacted', 'followed', 'interested', 'reserved', 'liquidated', 'effective_reservation'];
      
      await updateLeadStatus.mutateAsync({ leadId, status: newStatus });
      
      if (contactStates.includes(newStatus)) {
        toast.success('Lead convertido a contacto exitosamente');
      } else {
        toast.success('Estado actualizado exitosamente');
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast.error('Error al actualizar el estado del lead');
    }
    setIsStatusMenuOpen(null);
  };

  const handleAssignmentChange = async (leadId: string, newAgentId: string) => {
    try {
      await updateLeadAssignment.mutateAsync({
        leadId,
        agentId: newAgentId === 'unassigned' ? null : newAgentId,
      });
    } catch (error) {
      console.error('Error updating lead assignment:', error);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    return (
      !lead.converted_to_contact &&
      (filters.status === 'all' || !filters.status ? true : lead.status === filters.status) &&
      (filters.assignedTo === 'all' || !filters.assignedTo ? true : lead.assigned_to === filters.assignedTo) &&
      (filters.search ? lead.full_name.toLowerCase().includes(filters.search.toLowerCase()) || formatPhoneNumber(lead.phone).includes(filters.search) : true)
    );
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
      branch={currentBranch ? {
        name: currentBranch.name
      } : undefined}
    >
      <div className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error instanceof Error ? error.message : 'Error desconocido'}</h3>
              </div>
            </div>
          </div>
        )}
        <div className="sm:flex sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Leads</h1>
          <div className="flex gap-4">
            <div className="relative inline-block text-left">
              <div>
                <button
                  type="button"
                  className="inline-flex items-center gap-x-2 rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  id="integration-options"
                  aria-expanded="true"
                  aria-haspopup="true"
                  onClick={() => document.getElementById('integration-dropdown')?.classList.toggle('hidden')}
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" strokeWidth="2" stroke="currentColor" fill="none" />
                    <path d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z" strokeWidth="2" stroke="currentColor" fill="none" />
                    <path d="M6 12H9" strokeWidth="2" stroke="currentColor" />
                    <path d="M15 12H18" strokeWidth="2" stroke="currentColor" />
                    <path d="M12 6V9" strokeWidth="2" stroke="currentColor" />
                    <path d="M12 15V18" strokeWidth="2" stroke="currentColor" />
                  </svg>
                  Conectar Lead Ads
                </button>
              </div>
              <div
                id="integration-dropdown"
                className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none hidden"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="integration-options"
              >
                <div className="py-1">
                  <button
                    onClick={() => {
                      document.getElementById('integration-dropdown')?.classList.add('hidden');
                      setIsFacebookModalOpen(true);
                    }}
                    className="text-gray-700 block px-4 py-2 text-sm w-full text-left hover:bg-gray-100"
                    role="menuitem"
                  >
                    Conectar con Facebook
                  </button>
                  <button
                    onClick={() => {
                      document.getElementById('integration-dropdown')?.classList.add('hidden');
                      setIsMakeModalOpen(true);
                    }}
                    className="text-gray-700 block px-4 py-2 text-sm w-full text-left hover:bg-gray-100"
                    role="menuitem"
                  >
                    Conectar con Make (Integromat)
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-x-2 rounded-md bg-red-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              <svg className="-ml-0.5 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
              </svg>
              Nuevo Lead
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Estado
                  </label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters({ ...filters, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los estados" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {userRole !== 'sales_agent' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Asignado a
                    </label>
                    <Select
                      value={filters.assignedTo}
                      onValueChange={(value) => setFilters({ ...filters, assignedTo: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los agentes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {agents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Buscar
                  </label>
                  <Input
                    placeholder="Buscar por nombre o teléfono..."
                    value={filters.search || ''}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabla de Leads */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Fecha de Viaje</TableHead>
                  <TableHead>Pax</TableHead>
                  <TableHead>Asignado A</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10">
                      <div className="flex justify-center items-center space-x-2">
                        <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Cargando...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10">
                      No hay leads disponibles
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.inquiry_number}</TableCell>
                      <TableCell>{lead.full_name}</TableCell>
                      <TableCell>
                        <DropdownMenu open={isStatusMenuOpen === lead.id} onOpenChange={() => setIsStatusMenuOpen(lead.id)}>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-full justify-start">
                              <Badge
                                variant="secondary"
                                className={`${statusColors[lead.status as Lead['status']].bg} ${statusColors[lead.status as Lead['status']].text}`}
                              >
                                {statusLabels[lead.status as Lead['status']]}
                              </Badge>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[200px]">
                            {Object.entries(statusLabels).map(([value, label]) => (
                              <DropdownMenuItem
                                key={value}
                                onClick={() => handleStatusChange(lead.id, value as Lead['status'])}
                              >
                                <Badge
                                  variant="secondary"
                                  className={`${statusColors[value as Lead['status']].bg} ${statusColors[value as Lead['status']].text}`}
                                >
                                  {label}
                                </Badge>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell>{formatPhoneNumber(lead.phone)}</TableCell>
                      <TableCell>{lead.origin}</TableCell>
                      <TableCell>{formatDate(lead.estimated_travel_date)}</TableCell>
                      <TableCell>{lead.pax_count}</TableCell>
                      <TableCell>
                        <Select
                          value={lead.assigned_to || ''}
                          onValueChange={(value) => handleAssignmentChange(lead.id, value)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Sin asignar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Sin asignar</SelectItem>
                            {agents.map((agent) => (
                              <SelectItem key={agent.id} value={agent.id}>
                                {agent.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <span className="sr-only">Abrir menú</span>
                              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                              </svg>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenModal(lead)}>
                              <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedLead(lead);
                              setIsHistoryModalOpen(true);
                            }}>
                              <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" />
                              </svg>
                              Historial
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedLead(lead);
                              setIsTasksModalOpen(true);
                            }}>
                              <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                              </svg>
                              Tareas
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>

      <LeadModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        lead={selectedLead}
        onSubmit={selectedLead ? handleUpdateLead : handleCreateLead}
        organizationId={currentOrganization?.id || ''}
        branchId={currentBranch?.id || ''}
      />

      <FacebookIntegrationModal
        isOpen={isFacebookModalOpen}
        onClose={() => setIsFacebookModalOpen(false)}
      />

      <MakeIntegrationModal
        isOpen={isMakeModalOpen}
        onClose={() => setIsMakeModalOpen(false)}
      />

      <LeadHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        leadId={selectedLead?.id || ''}
      />

      <LeadTasksModal
        isOpen={isTasksModalOpen}
        onClose={() => setIsTasksModalOpen(false)}
        leadId={selectedLead?.id || ''}
      />
    </MainLayout>
  );
} 