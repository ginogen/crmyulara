'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Contact } from '@/types/supabase';
import { formatPhoneNumber } from '@/lib/utils/strings';
import { formatDate } from '@/lib/utils/dates';
import { ContactModal } from '@/components/modals/ContactModal';
import { useAuth } from '@/contexts/AuthContext';
import { useContacts } from '@/hooks/useContacts';
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
import { ContactManagementModal } from '@/components/modals/ContactManagementModal';
import { GmailConnectModal } from '@/components/modals/GmailConnectModal';
import { EmailModal } from '@/components/modals/EmailModal';
import { ContactTasksModal } from '@/components/modals/ContactTasksModal';
import { useGmail } from '@/hooks/useGmail';

type UserRole = 'super_admin' | 'org_admin' | 'branch_manager' | 'sales_agent';

export default function ContactsPage() {
  const { user, currentOrganization, currentBranch, userRole } = useAuth();
  const { contacts, isLoading, error, createContact, updateContact } = useContacts();
  const [filters, setFilters] = useState({
    name: '',
    city: '',
    tag: '',
    assignedTo: '',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | undefined>();
  const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);
  const [isTasksModalOpen, setIsTasksModalOpen] = useState(false);
  const [agents, setAgents] = useState<Array<{ id: string; full_name: string }>>([]);
  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const { isConnected: isGmailConnected } = useGmail();

  const handleCreateContact = async (contactData: Omit<Contact, 'id' | 'created_at'>) => {
    try {
      await createContact.mutateAsync(contactData);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error creating contact:', error);
      throw error;
    }
  };

  const handleUpdateContact = async (contactData: Omit<Contact, 'id' | 'created_at'>) => {
    if (!selectedContact) return;

    try {
      await updateContact.mutateAsync({
        id: selectedContact.id,
        ...contactData,
      });
      setIsModalOpen(false);
      setSelectedContact(undefined);
    } catch (error) {
      console.error('Error updating contact:', error);
      throw error;
    }
  };

  const handleOpenModal = (contact?: Contact) => {
    setSelectedContact(contact);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedContact(undefined);
  };

  const filteredContacts = contacts.filter((contact) => {
    return (
      contact.full_name.toLowerCase().includes(filters.name.toLowerCase()) &&
      contact.city.toLowerCase().includes(filters.city.toLowerCase()) &&
      contact.tag.toLowerCase().includes(filters.tag.toLowerCase()) &&
      (filters.assignedTo === 'all' || !filters.assignedTo ? true : contact.assigned_to === filters.assignedTo)
    );
  });

  if (error) {
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
        <div className="text-center py-10">
          <p className="text-red-500">Error al cargar los contactos: {error.message}</p>
        </div>
      </MainLayout>
    );
  }

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
          <h1 className="text-2xl font-semibold text-gray-900">Contactos</h1>
          <div className="flex gap-4">
            <Button
              variant={isGmailConnected ? "default" : "outline"}
              onClick={() => setIsGmailModalOpen(true)}
              className={`inline-flex items-center gap-x-2 ${
                isGmailConnected ? "bg-green-600 hover:bg-green-700" : ""
              }`}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z"/>
              </svg>
              {isGmailConnected ? "Gmail Conectado" : "Conectar Gmail"}
            </Button>
            {selectedContacts.length > 0 && (
              <Button
                onClick={() => setIsEmailModalOpen(true)}
                className="inline-flex items-center gap-x-2"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z"/>
                </svg>
                Enviar Email ({selectedContacts.length})
              </Button>
            )}
            <Button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-x-2"
            >
              <svg className="-ml-0.5 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
              </svg>
              Nuevo Contacto
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Nombre
                </label>
                <Input
                  placeholder="Buscar por nombre..."
                  value={filters.name}
                  onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Ciudad
                </label>
                <Input
                  placeholder="Filtrar por ciudad..."
                  value={filters.city}
                  onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Etiqueta
                </label>
                <Input
                  placeholder="Filtrar por etiqueta..."
                  value={filters.tag}
                  onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
                />
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
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Contactos */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30px]">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={selectedContacts.length === filteredContacts.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedContacts(filteredContacts);
                      } else {
                        setSelectedContacts([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Etiqueta</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    <div className="flex justify-center items-center space-x-2">
                      <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Cargando...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredContacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    No hay contactos disponibles
                  </TableCell>
                </TableRow>
              ) : (
                filteredContacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={selectedContacts.some(c => c.id === contact.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedContacts([...selectedContacts, contact]);
                          } else {
                            setSelectedContacts(selectedContacts.filter(c => c.id !== contact.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{contact.full_name}</TableCell>
                    <TableCell>{contact.city}</TableCell>
                    <TableCell>{formatPhoneNumber(contact.phone)}</TableCell>
                    <TableCell>{contact.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {contact.tag}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(contact.created_at)}</TableCell>
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
                          <DropdownMenuItem onClick={() => handleOpenModal(contact)}>
                            <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                            Editar
                          </DropdownMenuItem>
                          {contact.original_lead_id && (
                            <DropdownMenuItem onClick={() => {
                              setSelectedContact(contact);
                              setIsManagementModalOpen(true);
                            }}>
                              <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                              </svg>
                              Gestión
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => {
                            setSelectedContact(contact);
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

      {/* Modales */}
      <ContactModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={selectedContact ? handleUpdateContact : handleCreateContact}
        contact={selectedContact}
      />

      <ContactManagementModal
        isOpen={isManagementModalOpen}
        onClose={() => {
          setIsManagementModalOpen(false);
          setSelectedContact(undefined);
        }}
        contact={selectedContact}
      />

      <ContactTasksModal
        isOpen={isTasksModalOpen}
        onClose={() => {
          setIsTasksModalOpen(false);
          setSelectedContact(undefined);
        }}
        contactId={selectedContact?.id || ''}
      />

      <GmailConnectModal
        isOpen={isGmailModalOpen}
        onClose={() => setIsGmailModalOpen(false)}
      />

      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        contacts={selectedContacts}
      />
    </MainLayout>
  );
} 