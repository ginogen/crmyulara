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
import { WhatsAppModal } from '@/components/modals/WhatsAppModal';

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
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [selectedContactForWA, setSelectedContactForWA] = useState<Contact | null>(null);

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
                    <TableCell className="flex items-center gap-2">
                      {formatPhoneNumber(contact.phone)}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedContactForWA(contact);
                          setIsWhatsAppModalOpen(true);
                        }}
                        className="p-1 rounded-full hover:bg-gray-100"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 448 512"
                          fill="currentColor"
                          className="w-5 h-5 text-green-600"
                        >
                          <path
                            d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"
                          />
                        </svg>
                      </button>
                    </TableCell>
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

      {selectedContactForWA && (
        <WhatsAppModal
          isOpen={isWhatsAppModalOpen}
          onClose={() => {
            setIsWhatsAppModalOpen(false);
            setSelectedContactForWA(null);
          }}
          contact={selectedContactForWA}
        />
      )}
    </MainLayout>
  );
} 