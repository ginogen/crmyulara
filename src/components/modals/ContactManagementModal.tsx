"use client"

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Contact } from '@/types/supabase';
import { formatPhoneNumber } from '@/lib/utils/strings';
import { formatDate } from '@/lib/utils/dates';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface ContactManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact?: Contact;
}

interface HistoryEntry {
  id: string;
  lead_id: string;
  action: string;
  description: string;
  created_at: string;
  user?: {
    full_name: string;
  };
}

interface Email {
  id: string;
  subject: string;
  body: string;
  from_email: string;
  to_emails: string[];
  status: string;
  direction: string;
  created_at: string;
  sent_at: string | null;
  scheduled_for: string | null;
}

interface Task {
  id: string;
  title: string;
  description: string;
  due_date: string;
  status: 'pending' | 'completed';
  created_at: string;
  assigned_to: string;
  user: {
    full_name: string;
  };
}

export function ContactManagementModal({ isOpen, onClose, contact }: ContactManagementModalProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingEmails, setIsLoadingEmails] = useState(true);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    due_date: '',
  });
  const { user, currentOrganization, currentBranch } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    const fetchHistory = async () => {
      if (!contact?.original_lead_id) return;

      try {
        const { data, error } = await supabase
          .from('lead_history')
          .select(`
            *,
            user:users(full_name)
          `)
          .eq('lead_id', contact.original_lead_id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setHistory(data || []);
      } catch (error) {
        console.error('Error fetching lead history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchEmails = async () => {
      if (!contact?.id) return;

      try {
        const response = await fetch(`/api/contacts/${contact.id}/emails`);
        if (!response.ok) throw new Error('Error fetching emails');
        const data = await response.json();
        setEmails(data || []);
      } catch (error) {
        console.error('Error fetching emails:', error);
      } finally {
        setIsLoadingEmails(false);
      }
    };

    const fetchTasks = async () => {
      if (!contact?.id) return;

      try {
        const { data, error } = await supabase
          .from('tasks')
          .select(`
            *,
            user:users(full_name)
          `)
          .eq('related_to_type', 'contact')
          .eq('related_to_id', contact.id)
          .order('due_date', { ascending: true });

        if (error) throw error;
        setTasks(data || []);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        toast.error("Error al cargar las tareas");
      } finally {
        setIsLoadingTasks(false);
      }
    };

    if (isOpen && contact) {
      fetchHistory();
      fetchEmails();
      fetchTasks();
    }
  }, [contact?.original_lead_id, contact?.id, isOpen]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !contact?.id || !currentOrganization?.id || !currentBranch?.id) {
      toast.error("No se puede crear la tarea porque faltan datos requeridos");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            ...newTask,
            related_to_type: 'contact',
            related_to_id: contact.id,
            assigned_to: user.id,
            status: 'pending',
            priority: 'medium',
            organization_id: currentOrganization.id,
            branch_id: currentBranch.id,
          },
        ])
        .select(`
          *,
          user:users(full_name)
        `)
        .single();

      if (error) throw error;

      setTasks([...tasks, data]);
      setNewTask({
        title: '',
        description: '',
        due_date: '',
      });

      toast.success("Tarea creada exitosamente");

    } catch (error) {
      console.error('Error creating task:', error);
      toast.error("Error al crear la tarea");
    }
  };

  const handleToggleTaskStatus = async (taskId: string, currentStatus: Task['status']) => {
    if (!user?.id) return;

    const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';

    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));

      toast.success(`Tarea marcada como ${newStatus === 'completed' ? 'completada' : 'pendiente'}`);

    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error("Error al actualizar el estado de la tarea");
    }
  };

  if (!contact) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Gestión del Contacto</DialogTitle>
          <DialogDescription>
            Información detallada y gestión del contacto
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info">
          <TabsList>
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
            <TabsTrigger value="emails">Correos</TabsTrigger>
            <TabsTrigger value="tasks">Tareas</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>Información del Contacto</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Nombre</h4>
                  <p className="mt-1">{contact.full_name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Email</h4>
                  <p className="mt-1">{contact.email}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Teléfono</h4>
                  <p className="mt-1">{formatPhoneNumber(contact.phone)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Ciudad</h4>
                  <p className="mt-1">{contact.city}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Provincia</h4>
                  <p className="mt-1">{contact.province}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Etiqueta</h4>
                  <Badge variant="secondary" className="mt-1">
                    {contact.tag}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {contact.original_lead_id && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Información del Lead Original</CardTitle>
                  <CardDescription>
                    Datos cuando era lead - Número de consulta: {contact.original_lead_inquiry_number}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Origen</h4>
                    <p className="mt-1">{contact.origin}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Cantidad de Pasajeros</h4>
                    <p className="mt-1">{contact.pax_count}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Fecha Estimada de Viaje</h4>
                    <p className="mt-1">{contact.estimated_travel_date ? formatDate(contact.estimated_travel_date) : 'No especificada'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Estado Final como Lead</h4>
                    <Badge variant="secondary" className="mt-1">
                      {contact.original_lead_status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Historial del Lead</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-4">Cargando historial...</div>
                ) : history.length === 0 ? (
                  <div className="text-center py-4">No hay registros en el historial</div>
                ) : (
                  <div className="space-y-4">
                    {history.map((entry) => (
                      <div key={entry.id} className="border-b pb-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{entry.description}</p>
                            <p className="text-sm text-gray-500">
                              {entry.user?.full_name} - {formatDate(entry.created_at)}
                            </p>
                          </div>
                          <Badge variant="outline">{entry.action}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="emails">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Correos</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingEmails ? (
                  <div className="text-center py-4">Cargando correos...</div>
                ) : emails.length === 0 ? (
                  <div className="text-center py-4">No hay correos registrados</div>
                ) : (
                  <div className="space-y-4">
                    {emails.map((email) => (
                      <div key={email.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">{email.subject}</h4>
                            <p className="text-sm text-gray-500">
                              {email.direction === 'outbound' ? 'Para: ' : 'De: '}
                              {email.direction === 'outbound' ? email.to_emails.join(', ') : email.from_email}
                            </p>
                          </div>
                          <Badge variant={email.status === 'sent' ? 'default' : 'secondary'}>
                            {email.status === 'sent' ? 'Enviado' : 
                             email.status === 'scheduled' ? 'Programado' :
                             email.status === 'error' ? 'Error' : email.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-700 mt-2">
                          {email.body}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          {email.status === 'sent' ? (
                            `Enviado el ${formatDate(email.sent_at!)}`
                          ) : email.status === 'scheduled' ? (
                            `Programado para ${formatDate(email.scheduled_for!)}`
                          ) : (
                            `Creado el ${formatDate(email.created_at)}`
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <CardTitle>Tareas del Contacto</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateTask} className="space-y-4 mb-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="title">Título</Label>
                      <Input
                        id="title"
                        required
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        placeholder="Título de la tarea"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="due_date">Fecha límite</Label>
                      <Input
                        type="datetime-local"
                        id="due_date"
                        required
                        value={newTask.due_date}
                        onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Input
                      id="description"
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      placeholder="Descripción de la tarea"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Crear Tarea
                  </Button>
                </form>

                <Separator className="my-4" />

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Estado</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Fecha límite</TableHead>
                      <TableHead>Asignado a</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingTasks ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10">
                          <div className="flex justify-center items-center space-x-2">
                            <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Cargando...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : tasks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10">
                          No hay tareas disponibles
                        </TableCell>
                      </TableRow>
                    ) : (
                      tasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell>
                            <Badge
                              variant={task.status === 'completed' ? 'default' : 'secondary'}
                            >
                              {task.status === 'completed' ? 'Completada' : 'Pendiente'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{task.title}</TableCell>
                          <TableCell>{formatDate(task.due_date)}</TableCell>
                          <TableCell>{task.user?.full_name}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleTaskStatus(task.id, task.status)}
                            >
                              {task.status === 'completed' ? 'Marcar como pendiente' : 'Marcar como completada'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 