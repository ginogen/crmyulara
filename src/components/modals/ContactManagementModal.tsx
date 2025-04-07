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

interface WhatsAppMessage {
  id: string;
  message: string;
  created_at: string;
  sent_by: string;
  users: {
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
  const [whatsappHistory, setWhatsappHistory] = useState<WhatsAppMessage[]>([]);

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

  useEffect(() => {
    if (!contact) return;

    const fetchWhatsappHistory = async () => {
      const { data: whatsappData, error: whatsappError } = await supabase
        .from('whatsapp_messages')
        .select(`
          id,
          message,
          created_at,
          sent_by,
          users!inner (
            full_name
          )
        `)
        .eq('contact_id', contact.id)
        .order('created_at', { ascending: false });

      if (whatsappError) {
        console.error('Error fetching WhatsApp history:', whatsappError);
        return;
      }

      const formattedData = (whatsappData || []).map(msg => ({
        ...msg,
        users: {
          full_name: msg.users[0]?.full_name || 'Usuario desconocido'
        }
      }));

      setWhatsappHistory(formattedData);
    };

    fetchWhatsappHistory();
  }, [contact]);

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
      <DialogContent className="max-w-5xl h-[80vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-xl font-semibold text-gray-700">
                {contact.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <DialogTitle className="text-2xl">{contact.full_name}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <span className="text-gray-600">{contact.email}</span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">{formatPhoneNumber(contact.phone)}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="info" className="mt-6">
          <TabsList className="grid w-full grid-cols-5 gap-4 bg-transparent p-0">
            {["info", "history", "emails", "tasks", "whatsapp"].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {tab === "info" && "Información"}
                {tab === "history" && "Historial"}
                {tab === "emails" && "Correos"}
                {tab === "tasks" && "Tareas"}
                {tab === "whatsapp" && "WhatsApp"}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="info" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información del Contacto</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Ciudad</h4>
                      <p className="mt-1 text-gray-900">{contact.city}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Provincia</h4>
                      <p className="mt-1 text-gray-900">{contact.province}</p>
                    </div>
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
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Información del Lead</CardTitle>
                    <CardDescription>
                      Consulta #{contact.original_lead_inquiry_number}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Origen</h4>
                        <p className="mt-1 text-gray-900">{contact.origin}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Pasajeros</h4>
                        <p className="mt-1 text-gray-900">{contact.pax_count}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Fecha de Viaje</h4>
                      <p className="mt-1 text-gray-900">
                        {contact.estimated_travel_date ? formatDate(contact.estimated_travel_date) : 'No especificada'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Estado Final</h4>
                      <Badge variant="secondary" className="mt-1">
                        {contact.original_lead_status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Historial del Lead</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No hay registros en el historial
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((entry) => (
                      <div key={entry.id} className="flex gap-4 p-4 rounded-lg bg-gray-50">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-gray-600">
                            {entry.user?.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">{entry.description}</p>
                              <p className="text-sm text-gray-500 mt-1">
                                {entry.user?.full_name} - {formatDate(entry.created_at)}
                              </p>
                            </div>
                            <Badge variant="outline">{entry.action}</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="emails" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Historial de Correos</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingEmails ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : emails.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No hay correos registrados
                  </div>
                ) : (
                  <div className="space-y-4">
                    {emails.map((email) => (
                      <div key={email.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900">{email.subject}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {email.direction === 'outbound' ? 'Para: ' : 'De: '}
                              <span className="font-medium">
                                {email.direction === 'outbound' ? email.to_emails.join(', ') : email.from_email}
                              </span>
                            </p>
                          </div>
                          <Badge variant={email.status === 'sent' ? 'default' : 'secondary'}>
                            {email.status === 'sent' ? 'Enviado' : 
                             email.status === 'scheduled' ? 'Programado' :
                             email.status === 'error' ? 'Error' : email.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
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

          <TabsContent value="tasks" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tareas del Contacto</CardTitle>
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
                        className="w-full"
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
                        className="w-full"
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
                      className="w-full"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Crear Tarea
                  </Button>
                </form>

                <Separator className="my-6" />

                <div className="rounded-lg border">
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
                          <TableCell colSpan={5} className="h-24">
                            <div className="flex justify-center items-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : tasks.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                            No hay tareas disponibles
                          </TableCell>
                        </TableRow>
                      ) : (
                        tasks.map((task) => (
                          <TableRow key={task.id}>
                            <TableCell>
                              <Badge
                                variant={task.status === 'completed' ? 'default' : 'secondary'}
                                className="whitespace-nowrap"
                              >
                                {task.status === 'completed' ? 'Completada' : 'Pendiente'}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{task.title}</TableCell>
                            <TableCell className="whitespace-nowrap">{formatDate(task.due_date)}</TableCell>
                            <TableCell>{task.user?.full_name}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleTaskStatus(task.id, task.status)}
                                className="whitespace-nowrap"
                              >
                                {task.status === 'completed' ? 'Marcar pendiente' : 'Marcar completada'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="whatsapp" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Historial de Mensajes WhatsApp</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {whatsappHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No hay mensajes de WhatsApp
                    </div>
                  ) : (
                    whatsappHistory.map((message) => (
                      <div key={message.id} className="flex gap-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 448 512"
                            fill="currentColor"
                            className="w-5 h-5 text-green-600"
                          >
                            <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <p className="text-sm text-gray-900">{message.message}</p>
                              <p className="text-xs text-gray-500">
                                Enviado por {message.users?.full_name} • {formatDate(message.created_at)}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const phoneNumber = contact?.phone.replace(/\D/g, '');
                                const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message.message)}`;
                                window.open(whatsappUrl, '_blank');
                              }}
                              className="ml-4"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 448 512"
                                fill="currentColor"
                                className="w-4 h-4 text-green-600"
                              >
                                <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
                              </svg>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 